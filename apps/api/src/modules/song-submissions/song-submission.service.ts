
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
} from "./song-submission.schema.js";

type CreateSongDraftInput = ReturnType<
  typeof createSongDraftSchema.parse
>;

type SubmitSongForReviewInput = ReturnType<
  typeof submitSongForReviewSchema.parse
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
      // Find the song and its artist ownership.
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

      // Identify the active primary artist who owns this song.
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

      // A song must have at least one successfully uploaded audio asset.
      if (song.audioAssets.length === 0) {
        throw new Error(
          "Upload and confirm at least one audio file before submitting.",
        );
      }

      // Atomically move the song out of DRAFT.
      // This also prevents concurrent duplicate submissions.
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

      // Create the submission and record the artist's declaration.
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
