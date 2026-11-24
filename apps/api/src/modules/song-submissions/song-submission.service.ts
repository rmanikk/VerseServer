
import { randomUUID } from "node:crypto";
import {
  ArtistStatus,
  ArtistCreditRole,
  SongSource,
  SongStatus,
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";
import { createSongDraftSchema } from "./song-submission.schema.js";

type CreateSongDraftInput = ReturnType<
  typeof createSongDraftSchema.parse
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

export async function createSongDraft(
  input: CreateSongDraftInput,
) {
  return prisma.$transaction(
    async (tx) => {
      // Find the artist profiles owned by this VerseHana user.
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

      // Only active artist profiles can submit songs.
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

      // Create the song draft and its primary artist relationship.
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
