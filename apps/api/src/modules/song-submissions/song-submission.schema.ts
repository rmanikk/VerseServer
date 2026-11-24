
import { z } from "zod";

// ==========================================
// CREATE SONG DRAFT
// ==========================================

export const createSongDraftSchema = z
  .object({
    // Supplied by the trusted VerseHana backend.
    submittedByUserId: z.string().trim().min(1).max(128),

    title: z
      .string()
      .trim()
      .min(1, "Song title is required.")
      .max(160, "Song title cannot exceed 160 characters."),

    description: z.string().trim().max(3000).optional(),

    durationSeconds: z.number().int().positive().max(86400).optional(),

    releaseDate: z.string().datetime({ offset: true }).optional(),

    language: z.string().trim().min(2).max(35).optional(),

    isExplicit: z.boolean().optional().default(false),
  })
  .strict();

// ==========================================
// REQUEST AUDIO UPLOAD URL
// ==========================================

const supportedAudioTypes = [
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/ogg",
  "audio/aac",
] as const;

export const createAudioUploadUrlSchema = z
  .object({
    submittedByUserId: z.string().trim().min(1).max(128),

    songId: z.string().trim().min(1).max(128),

    originalFilename: z
      .string()
      .trim()
      .min(1, "Filename is required.")
      .max(255, "Filename cannot exceed 255 characters."),

    contentType: z.enum(supportedAudioTypes, {
      error: "Unsupported audio format.",
    }),

    fileSizeBytes: z
      .number()
      .int()
      .positive()
      .max(100 * 1024 * 1024, "Audio file cannot exceed 100 MB."),
  })
  .strict();

// ==========================================
// CONFIRM AUDIO UPLOAD
// ==========================================

export const confirmAudioUploadSchema = z
  .object({
    submittedByUserId: z.string().trim().min(1).max(128),
  })
  .strict();


// ==========================================
// SUBMIT SONG FOR REVIEW
// ==========================================

export const submitSongForReviewSchema = z
  .object({
    submittedByUserId: z.string().trim().min(1).max(128),

    rightsConfirmed: z.literal(true, {
      error: "You must confirm that you have the necessary distribution rights.",
    }),

    rightsDeclarationVersion: z
      .string()
      .trim()
      .min(1, "Rights declaration version is required.")
      .max(50),
  })
  .strict();
