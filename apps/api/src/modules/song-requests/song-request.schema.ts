
import { z } from "zod";
import { SongRequestStatus } from "../../generated/prisma/client.js";

const youtubeUrlSchema = z
  .string()
  .trim()
  .url("Please provide a valid YouTube URL.")
  .max(2048, "YouTube URL is too long.")
  .refine((value) => {
    try {
      const hostname = new URL(value).hostname.toLowerCase();

      const allowedHosts = [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "music.youtube.com",
        "youtu.be",
        "www.youtu.be",
      ];

      return allowedHosts.includes(hostname);
    } catch {
      return false;
    }
  }, "Please provide a valid YouTube link.");

export const createSongRequestSchema = z.object({
  artistName: z
    .string()
    .trim()
    .min(1, "Artist name is required.")
    .max(120, "Artist name is too long."),

  songName: z
    .string()
    .trim()
    .min(1, "Song name is required.")
    .max(160, "Song name is too long."),

  youtubeUrl: youtubeUrlSchema,

  message: z
    .string()
    .trim()
    .max(500, "Message cannot exceed 500 characters.")
    .optional(),
});

export const listSongRequestsSchema = z.object({
  status: z.nativeEnum(SongRequestStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const reviewSongRequestSchema = z
  .object({
    action: z.enum(["ACCEPTED", "REJECTED"]),

    // Private notes, visible only to VerseServer admins.
    adminNotes: z
      .string()
      .trim()
      .max(2000, "Admin notes cannot exceed 2000 characters.")
      .optional(),

    // Public response, visible to the requesting user.
    responseMessage: z
      .string()
      .trim()
      .max(1000, "Response message cannot exceed 1000 characters.")
      .optional(),
  })
  .strict();

export const fulfillSongRequestSchema = z.object({
  songId: z.string().trim().min(1, "A valid song ID is required."),
});
