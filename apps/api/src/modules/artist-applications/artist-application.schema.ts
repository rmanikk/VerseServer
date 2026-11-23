
import { z } from "zod";

export const createArtistApplicationSchema = z.object({
  applicantUserId: z
    .string()
    .trim()
    .min(1, "Applicant user ID is required.")
    .max(128),

  proposedName: z
    .string()
    .trim()
    .min(2, "Artist name must contain at least 2 characters.")
    .max(120, "Artist name cannot exceed 120 characters."),

  bio: z
    .string()
    .trim()
    .max(2000, "Bio cannot exceed 2000 characters.")
    .optional(),
});

export const reviewArtistApplicationSchema = z.object({
  action: z.enum(["APPROVED", "REJECTED"]),

  reviewNotes: z
    .string()
    .trim()
    .max(2000, "Review notes cannot exceed 2000 characters.")
    .optional(),
});
