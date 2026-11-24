
import { z } from "zod";

export const listSongsSchema = z
  .object({
    q: z.string().trim().min(1).max(100).optional(),

    artistSlug: z.string().trim().min(1).max(150).optional(),

    genreSlug: z.string().trim().min(1).max(150).optional(),

    moodSlug: z.string().trim().min(1).max(150).optional(),

    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(50).default(20),

    sort: z
      .enum(["newest", "oldest", "title"])
      .default("newest"),
  })
  .strict();

export const songSlugSchema = z
  .object({
    slug: z.string().trim().min(1).max(200),
  })
  .strict();
