
import { Router } from "express";

import { requireVerseHanaService } from "../../middleware/versehana-auth.middleware.js";

import {
  createSongDraftController,
  createAudioUploadUrlController,
  confirmAudioUploadController,
  submitSongForReviewController,
} from "./song-submission.controller.js";

const router = Router();

// Only trusted VerseHana backend requests are allowed.

// Create a song draft.
router.post(
  "/drafts",
  requireVerseHanaService,
  createSongDraftController,
);

// Generate a signed B2 audio upload URL.
router.post(
  "/audio-upload-urls",
  requireVerseHanaService,
  createAudioUploadUrlController,
);

// Confirm a completed audio upload.
router.post(
  "/audio-assets/:audioAssetId/confirm",
  requireVerseHanaService,
  confirmAudioUploadController,
);

// Submit a completed song for admin review.
router.post(
  "/:songId/submit",
  requireVerseHanaService,
  submitSongForReviewController,
);

export default router;
