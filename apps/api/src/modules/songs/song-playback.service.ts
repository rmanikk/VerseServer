
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { createB2DownloadUrl } from "../../services/b2-storage.service.js";

const PLAYBACK_URL_EXPIRATION = 300;

export async function getSongPlaybackUrl(slug: string) {
  const song = await prisma.song.findFirst({
    where: {
      slug,
      status: "APPROVED",
      publishedAt: {
        not: null,
      },
      audioAssets: {
        some: {
          status: "READY",
          storageProvider: "b2",
          bucketName: env.B2_BUCKET_NAME,
        },
      },
    },

    select: {
      id: true,
      title: true,
      slug: true,
      durationSeconds: true,

      audioAssets: {
        where: {
          status: "READY",
          storageProvider: "b2",
          bucketName: env.B2_BUCKET_NAME,
        },

        select: {
          id: true,
          objectKey: true,
          contentType: true,
          durationSeconds: true,
          codec: true,
          bitrateKbps: true,
          versionLabel: true,
          isDefault: true,
        },

        orderBy: [
          {
            isDefault: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      },
    },
  });

  if (!song || song.audioAssets.length === 0) {
    throw new Error("Song not found or not available for playback.");
  }

  const audioAsset = song.audioAssets[0];

  const playbackUrl = await createB2DownloadUrl({
    objectKey: audioAsset.objectKey,
    contentType: audioAsset.contentType,
    expiresInSeconds: PLAYBACK_URL_EXPIRATION,
  });

  return {
    song: {
      id: song.id,
      title: song.title,
      slug: song.slug,
      durationSeconds: song.durationSeconds,
    },

    audio: {
      assetId: audioAsset.id,
      contentType: audioAsset.contentType,
      durationSeconds: audioAsset.durationSeconds,
      codec: audioAsset.codec,
      bitrateKbps: audioAsset.bitrateKbps,
      versionLabel: audioAsset.versionLabel,
    },

    playbackUrl,
    expiresInSeconds: PLAYBACK_URL_EXPIRATION,
  };
}
