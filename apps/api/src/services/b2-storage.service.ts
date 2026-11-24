
import {
  S3Client,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../config/env.js";

export const b2Client = new S3Client({
  endpoint: env.B2_ENDPOINT,
  region: env.B2_REGION,
  credentials: {
    accessKeyId: env.B2_ACCESS_KEY_ID,
    secretAccessKey: env.B2_SECRET_ACCESS_KEY,
  },
});

export async function checkB2Connection(): Promise<void> {
  await b2Client.send(
    new HeadBucketCommand({
      Bucket: env.B2_BUCKET_NAME,
    }),
  );
}

interface CreateUploadUrlInput {
  objectKey: string;
  contentType: string;
  contentLengthBytes: number;
  expiresInSeconds?: number;
}

export async function createB2UploadUrl({
  objectKey,
  contentType,
  contentLengthBytes,
  expiresInSeconds = 300,
}: CreateUploadUrlInput): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.B2_BUCKET_NAME,
    Key: objectKey,
    ContentType: contentType,
    ContentLength: contentLengthBytes,
  });

  return getSignedUrl(b2Client, command, {
    expiresIn: expiresInSeconds,
  });
}

interface CreateDownloadUrlInput {
  objectKey: string;
  contentType: string;
  expiresInSeconds?: number;
}

export async function createB2DownloadUrl({
  objectKey,
  contentType,
  expiresInSeconds = 300,
}: CreateDownloadUrlInput): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.B2_BUCKET_NAME,
    Key: objectKey,
    ResponseContentType: contentType,
    ResponseContentDisposition: "inline",
  });

  return getSignedUrl(b2Client, command, {
    expiresIn: expiresInSeconds,
  });
}

interface B2ObjectMetadata {
  contentLength: number;
  contentType: string | undefined;
}

export async function getB2ObjectMetadata(
  objectKey: string,
): Promise<B2ObjectMetadata | null> {
  try {
    const result = await b2Client.send(
      new HeadObjectCommand({
        Bucket: env.B2_BUCKET_NAME,
        Key: objectKey,
      }),
    );

    if (result.ContentLength === undefined) {
      throw new Error("Storage did not return the uploaded file size.");
    }

    return {
      contentLength: result.ContentLength,
      contentType: result.ContentType,
    };
  } catch (error) {
    const storageError = error as {
      name?: string;
      $metadata?: { httpStatusCode?: number };
    };

    if (
      storageError.name === "NotFound" ||
      storageError.name === "NoSuchKey" ||
      storageError.$metadata?.httpStatusCode === 404
    ) {
      return null;
    }

    throw error;
  }
}
