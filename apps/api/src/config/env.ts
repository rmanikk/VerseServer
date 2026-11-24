
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: "../../.env" });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),

  // VerseServer admin authentication
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("15m"),

  // VerseHana server-to-server authentication
  VERSEHANA_SERVICE_SECRET: z
    .string()
    .min(64, "VERSEHANA_SERVICE_SECRET must be at least 64 characters"),

  // Backblaze B2 storage (S3-compatible API)
  B2_ENDPOINT: z.string().url("B2_ENDPOINT must be a valid URL"),
  B2_REGION: z.string().min(1, "B2_REGION is required"),
  B2_BUCKET_NAME: z.string().min(1, "B2_BUCKET_NAME is required"),
  B2_ACCESS_KEY_ID: z.string().min(1, "B2_ACCESS_KEY_ID is required"),
  B2_SECRET_ACCESS_KEY: z.string().min(1, "B2_SECRET_ACCESS_KEY is required"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:");
  console.error(parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
