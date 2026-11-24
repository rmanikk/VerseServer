
import { randomUUID } from "node:crypto";

import {
  ArtistStatus,
  ArtistCreditRole,
  AudioAssetStatus,
  SongSource,
  SongStatus,
  SubmissionStatus,
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

import {
  createSongDraftSchema,
  submitSongForReviewSchema,
  listSongSubmissionsSchema,
  reviewSongSubmissionSchema,
} from "./song-submission.schema.js";

type CreateSongDraftInput = ReturnType<
  typeof createSongDraftSchema.parse
>;

type SubmitSongForReviewInput = ReturnType<
  typeof submitSongForReviewSchema.parse
>;

type ListSongSubmissionsInput = ReturnType<
  typeof listSongSubmissionsSchema.parse
>;

type ReviewSongSubmissionInput = ReturnType<
  typeof reviewSongSubmissionSchema.parse
>;

function createSongSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);

  const uniqueSuffix = randomUUID()
    .replace(/-/g, "")
    .slice(0, 12);

  return `${baseSlug || "song"}-${uniqueSuffix}`;
}

// ==========================================
// CREATE SONG DRAFT
// ==========================================

export async function createSongDraft(
  input: CreateSongDraftInput,
) {
  return prisma.$transaction(
    async (tx) => {
      const artistProfiles = await tx.artist.findMany({
        where: {
          ownerUserId: input.submittedByUserId,
        },
        select: {
          id: true,
          name: true,
          status: true,
        },
      });

      if (artistProfiles.length === 0) {
        throw new Error(
          "No artist profile is associated with this user.",
        );
      }

      const activeArtists = artistProfiles.filter(
        (artist) => artist.status === ArtistStatus.ACTIVE,
      );

      if (activeArtists.length === 0) {
        throw new Error(
          "Your artist profile is not currently active.",
        );
      }

      if (activeArtists.length > 1) {
        throw new Error(
          "Multiple active artist profiles were found. Please contact an administrator.",
        );
      }

      const artist = activeArtists[0];

      if (!artist) {
        throw new Error("Artist profile could not be identified.");
      }

      const song = await tx.song.create({
        data: {
          title: input.title,
          slug: createSongSlug(input.title),
          description: input.description ?? null,
          durationSeconds: input.durationSeconds ?? null,
          releaseDate: input.releaseDate
            ? new Date(input.releaseDate)
            : null,
          language: input.language ?? null,
          isExplicit: input.isExplicit,

          status: SongStatus.DRAFT,
          source: SongSource.ARTIST_SUBMISSION,

          createdByUserId: input.submittedByUserId,
          updatedByUserId: input.submittedByUserId,

          artists: {
            create: {
              artistId: artist.id,
              role: ArtistCreditRole.PRIMARY,
              position: 0,
            },
          },
        },
        include: {
          artists: {
            include: {
              artist: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      return song;
    },
    {
      maxWait: 15_000,
      timeout: 60_000,
    },
  );
}

// ==========================================
// SUBMIT SONG FOR ADMIN REVIEW
// ==========================================

export async function submitSongForReview(
  songId: string,
  input: SubmitSongForReviewInput & {
    submittedByUserId: string;
  },
) {
  return prisma.$transaction(
    async (tx) => {
      const song = await tx.song.findFirst({
        where: {
          id: songId,
          source: SongSource.ARTIST_SUBMISSION,
        },
        include: {
          artists: {
            include: {
              artist: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  ownerUserId: true,
                  status: true,
                },
              },
            },
          },
          audioAssets: {
            where: {
              status: AudioAssetStatus.READY,
            },
            select: {
              id: true,
              contentType: true,
              fileSizeBytes: true,
            },
          },
        },
      });

      if (!song) {
        throw new Error("Song draft was not found.");
      }

      if (song.status !== SongStatus.DRAFT) {
        throw new Error(
          "Only draft songs can be submitted for review.",
        );
      }

      const ownedPrimaryArtists = song.artists.filter(
        (credit) =>
          credit.role === ArtistCreditRole.PRIMARY &&
          credit.artist.ownerUserId === input.submittedByUserId &&
          credit.artist.status === ArtistStatus.ACTIVE,
      );

      if (ownedPrimaryArtists.length === 0) {
        throw new Error(
          "You do not have permission to submit this song.",
        );
      }

      if (ownedPrimaryArtists.length > 1) {
        throw new Error(
          "Multiple primary artist profiles were found for this song.",
        );
      }

      const primaryArtist = ownedPrimaryArtists[0];

      if (!primaryArtist) {
        throw new Error("Primary artist could not be identified.");
      }

      if (song.audioAssets.length === 0) {
        throw new Error(
          "Upload and confirm at least one audio file before submitting.",
        );
      }

      const updatedSong = await tx.song.updateMany({
        where: {
          id: song.id,
          status: SongStatus.DRAFT,
          source: SongSource.ARTIST_SUBMISSION,
        },
        data: {
          status: SongStatus.PENDING_REVIEW,
          updatedByUserId: input.submittedByUserId,
        },
      });

      if (updatedSong.count !== 1) {
        throw new Error(
          "Song status changed. Please refresh and try again.",
        );
      }

      const submission = await tx.songSubmission.create({
        data: {
          songId: song.id,
          artistId: primaryArtist.artist.id,
          submittedByUserId: input.submittedByUserId,

          rightsConfirmed: true,
          rightsConfirmedAt: new Date(),
          rightsDeclarationVersion:
            input.rightsDeclarationVersion,

          status: SubmissionStatus.PENDING,
        },
        include: {
          song: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
            },
          },
          artist: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      return submission;
    },
    {
      maxWait: 15_000,
      timeout: 60_000,
    },
  );
}

// ==========================================
// ADMIN: LIST SONG SUBMISSIONS
// ==========================================

export async function listSongSubmissions(
  input: ListSongSubmissionsInput,
) {
  const page = input.page;
  const limit = input.limit;
  const skip = (page - 1) * limit;

  const where = input.status
    ? { status: input.status }
    : {};

  const [submissions, total] = await prisma.$transaction([
    prisma.songSubmission.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        songId: true,
        artistId: true,
        submittedByUserId: true,
        rightsConfirmed: true,
        rightsConfirmedAt: true,
        rightsDeclarationVersion: true,
        status: true,
        reviewNotes: true,
        reviewedAt: true,
        createdAt: true,

        artist: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },

        song: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            durationSeconds: true,
            releaseDate: true,
            isExplicit: true,

            artists: {
              select: {
                role: true,
                artist: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },

            audioAssets: {
              select: {
                id: true,
                originalFilename: true,
                contentType: true,
                fileSizeBytes: true,
                status: true,
              },
            },
          },
        },
      },
    }),

    prisma.songSubmission.count({
      where,
    }),
  ]);

  return {
    submissions: submissions.map((submission) => ({
      ...submission,
      song: {
        ...submission.song,
        audioAssets: submission.song.audioAssets.map((asset) => ({
          ...asset,
          fileSizeBytes: asset.fileSizeBytes.toString(),
        })),
      },
    })),

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ==========================================
// ADMIN: GET SONG SUBMISSION DETAILS
// ==========================================

export async function getSongSubmissionById(id: string) {
  const submission = await prisma.songSubmission.findUnique({
    where: {
      id,
    },

    include: {
      artist: {
        select: {
          id: true,
          name: true,
          slug: true,
          bio: true,
          status: true,
          ownerUserId: true,
        },
      },

      reviewedByAdmin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      song: {
        include: {
          artists: {
            include: {
              artist: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  status: true,
                },
              },
            },
            orderBy: {
              position: "asc",
            },
          },

          genres: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },

          moods: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },

          audioAssets: {
            select: {
              id: true,
              originalFilename: true,
              contentType: true,
              fileSizeBytes: true,
              codec: true,
              bitrateKbps: true,
              sampleRateHz: true,
              channels: true,
              durationSeconds: true,
              versionLabel: true,
              isDefault: true,
              status: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!submission) {
    throw new Error("Song submission not found.");
  }

  return {
    ...submission,
    song: {
      ...submission.song,
      audioAssets: submission.song.audioAssets.map((asset) => ({
        ...asset,
        fileSizeBytes: asset.fileSizeBytes.toString(),
      })),
    },
  };
}

// ==========================================
// ADMIN: APPROVE OR REJECT SONG SUBMISSION
// ==========================================

export async function reviewSongSubmission(
  submissionId: string,
  adminId: string,
  input: ReviewSongSubmissionInput,
) {
  return prisma.$transaction(
    async (tx) => {
      const submission = await tx.songSubmission.findUnique({
        where: {
          id: submissionId,
        },
        include: {
          song: {
            include: {
              audioAssets: {
                where: {
                  status: AudioAssetStatus.READY,
                },
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!submission) {
        throw new Error("Song submission not found.");
      }

      if (submission.status !== SubmissionStatus.PENDING) {
        throw new Error(
          "This song submission has already been reviewed.",
        );
      }

      if (
        submission.song.status !== SongStatus.PENDING_REVIEW ||
        submission.song.source !== SongSource.ARTIST_SUBMISSION
      ) {
        throw new Error(
          "Song is not in a valid state for admin review.",
        );
      }

      if (input.action === "APPROVE") {
        if (!submission.rightsConfirmed) {
          throw new Error(
            "Cannot approve a song without a rights declaration.",
          );
        }

        if (submission.song.audioAssets.length === 0) {
          throw new Error(
            "Cannot approve a song without a ready audio asset.",
          );
        }
      }

      const now = new Date();

      const nextSubmissionStatus =
        input.action === "APPROVE"
          ? SubmissionStatus.APPROVED
          : SubmissionStatus.REJECTED;

      const nextSongStatus =
        input.action === "APPROVE"
          ? SongStatus.APPROVED
          : SongStatus.REJECTED;

      const submissionUpdate = await tx.songSubmission.updateMany({
        where: {
          id: submissionId,
          status: SubmissionStatus.PENDING,
        },
        data: {
          status: nextSubmissionStatus,
          reviewNotes: input.reviewNotes ?? null,
          reviewedByAdminId: adminId,
          reviewedAt: now,
        },
      });

      if (submissionUpdate.count !== 1) {
        throw new Error(
          "Submission status changed. Refresh and try again.",
        );
      }

      const songUpdate = await tx.song.updateMany({
        where: {
          id: submission.songId,
          status: SongStatus.PENDING_REVIEW,
          source: SongSource.ARTIST_SUBMISSION,
        },
        data: {
          status: nextSongStatus,
          publishedAt:
            input.action === "APPROVE" ? now : null,
        },
      });

      if (songUpdate.count !== 1) {
        throw new Error(
          "Song status changed. The review was not completed.",
        );
      }

      const updatedSubmission = await tx.songSubmission.findUnique({
        where: {
          id: submissionId,
        },
        include: {
          artist: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },

          song: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              publishedAt: true,
            },
          },

          reviewedByAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!updatedSubmission) {
        throw new Error(
          "Unable to retrieve the reviewed submission.",
        );
      }

      return updatedSubmission;
    },
    {
      maxWait: 15_000,
      timeout: 60_000,
    },
  );
}
