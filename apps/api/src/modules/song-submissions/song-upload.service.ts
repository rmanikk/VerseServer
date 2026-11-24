
import { randomUUID } from "node:crypto";

import {
  ArtistStatus,
  AudioAssetStatus,
  SongSource,
  SongStatus,
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import {
  createB2UploadUrl,
  getB2ObjectMetadata,
} from "../../services/b2-storage.service.js";

import type {
  createAudioUploadUrlSchema,
  confirmAudioUploadSchema,
} from "./song-submission.schema.js";

type CreateAudioUploadInput = ReturnType<
  typeof createAudioUploadUrlSchema.parse
>;

type ConfirmAudioUploadInput = ReturnType<
  typeof confirmAudioUploadSchema.parse
>;

const MAX_UPLOAD_SIZE = 100 * 1024 * 1024;
const UPLOAD_URL_EXPIRATION = 300;

const AUDIO_EXTENSIONS: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/flac": "flac",
  "audio/ogg": "ogg",
  "audio/aac": "aac",
};

export async function createSongAudioUpload(input: CreateAudioUploadInput) {
  if (input.fileSizeBytes > MAX_UPLOAD_SIZE) {
    throw new Error("Audio file exceeds the maximum allowed size.");
  }

  const extension = AUDIO_EXTENSIONS[input.contentType];

  if (!extension) {
    throw new Error("Unsupported audio format.");
  }

  const song = await prisma.song.findFirst({
    where: {
      id: input.songId,
      status: SongStatus.DRAFT,
      source: SongSource.ARTIST_SUBMISSION,
    },
    include: {
      artists: {
        include: {
          artist: {
            select: {
              id: true,
              ownerUserId: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!song) {
    throw new Error("Song draft was not found.");
  }

  const ownedArtist = song.artists.find(
    (credit) =>
      credit.artist.ownerUserId === input.submittedByUserId &&
      credit.artist.status === ArtistStatus.ACTIVE,
  );

  if (!ownedArtist) {
    throw new Error(
      "You do not have permission to upload audio for this song.",
    );
  }

  const objectKey =
    `songs/${song.id}/audio/${randomUUID()}.${extension}`;

  const audioAsset = await prisma.audioAsset.create({
    data: {
      songId: song.id,
      storageProvider: "b2",
      bucketName: env.B2_BUCKET_NAME,
      objectKey,
      originalFilename: input.originalFilename,
      contentType: input.contentType,
      fileSizeBytes: BigInt(input.fileSizeBytes),
      status: AudioAssetStatus.UPLOADING,
    },
  });

  try {
    const uploadUrl = await createB2UploadUrl({
      objectKey,
      contentType: input.contentType,
      contentLengthBytes: input.fileSizeBytes,
      expiresInSeconds: UPLOAD_URL_EXPIRATION,
    });

    return {
      audioAssetId: audioAsset.id,
      songId: song.id,
      objectKey,
      uploadUrl,
      expiresInSeconds: UPLOAD_URL_EXPIRATION,
      requiredHeaders: {
        "Content-Type": input.contentType,
        "Content-Length": String(input.fileSizeBytes),
      },
    };
  } catch (error) {
    await prisma.audioAsset.update({
      where: { id: audioAsset.id },
      data: { status: AudioAssetStatus.FAILED },
    });

    throw error;
  }
}

export async function confirmSongAudioUpload(
  audioAssetId: string,
  input: ConfirmAudioUploadInput,
) {
  const audioAsset = await prisma.audioAsset.findUnique({
    where: {
      id: audioAssetId,
    },
    include: {
      song: {
        include: {
          artists: {
            include: {
              artist: {
                select: {
                  id: true,
                  ownerUserId: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!audioAsset) {
    throw new Error("Audio asset was not found.");
  }

  const song = audioAsset.song;

  if (
    song.status !== SongStatus.DRAFT ||
    song.source !== SongSource.ARTIST_SUBMISSION
  ) {
    throw new Error("Song draft is not available for audio confirmation.");
  }

  const ownedArtist = song.artists.find(
    (credit) =>
      credit.artist.ownerUserId === input.submittedByUserId &&
      credit.artist.status === ArtistStatus.ACTIVE,
  );

  if (!ownedArtist) {
    throw new Error(
      "You do not have permission to confirm this audio upload.",
    );
  }

  if (
    audioAsset.storageProvider !== "b2" ||
    audioAsset.bucketName !== env.B2_BUCKET_NAME
  ) {
    throw new Error("Audio storage configuration does not match.");
  }

  // Allow safe retries after successful confirmation.
  if (audioAsset.status === AudioAssetStatus.READY) {
    return {
      audioAssetId: audioAsset.id,
      songId: song.id,
      status: AudioAssetStatus.READY,
      message: "Audio upload was already confirmed.",
    };
  }

  if (audioAsset.status !== AudioAssetStatus.UPLOADING) {
    throw new Error("Audio asset is not awaiting upload confirmation.");
  }

  // Retrieve the object key from our database, never from the request.
  const metadata = await getB2ObjectMetadata(audioAsset.objectKey);

  if (!metadata) {
    throw new Error("Uploaded audio object was not found in storage.");
  }

  if (metadata.contentLength !== Number(audioAsset.fileSizeBytes)) {
    throw new Error("Uploaded audio file size does not match.");
  }

  if (
    !metadata.contentType ||
    metadata.contentType.trim().toLowerCase() !==
      audioAsset.contentType.trim().toLowerCase()
  ) {
    throw new Error("Uploaded audio content type does not match.");
  }

  const updated = await prisma.audioAsset.updateMany({
    where: {
      id: audioAsset.id,
      status: AudioAssetStatus.UPLOADING,
    },
    data: {
      status: AudioAssetStatus.READY,
    },
  });

  if (updated.count === 0) {
    const latestAsset = await prisma.audioAsset.findUnique({
      where: { id: audioAsset.id },
      select: { status: true },
    });

    if (latestAsset?.status === AudioAssetStatus.READY) {
      return {
        audioAssetId: audioAsset.id,
        songId: song.id,
        status: AudioAssetStatus.READY,
        message: "Audio upload was already confirmed.",
      };
    }

    throw new Error("Audio asset status changed. Please try again.");
  }

  return {
    audioAssetId: audioAsset.id,
    songId: song.id,
    status: AudioAssetStatus.READY,
    message: "Audio upload confirmed successfully.",
  };
}
