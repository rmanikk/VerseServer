
import { Router } from "express";

import { requireVerseHanaService } from "../../middleware/versehana-auth.middleware.js";
import { requireAdmin } from "../../middleware/admin-auth.middleware.js";

import {
  createSongDraftController,
  createAudioUploadUrlController,
  confirmAudioUploadController,
  submitSongForReviewController,
  listSongSubmissionsController,
  getSongSubmissionController,
  reviewSongSubmissionController,
} from "./song-submission.controller.js";

const router = Router();

// ==========================================
// ARTIST: SONG SUBMISSION
// ==========================================

router.post(
  "/drafts",
  requireVerseHanaService,
  createSongDraftController,
);

router.post(
  "/audio-upload-urls",
  requireVerseHanaService,
  createAudioUploadUrlController,
);

router.post(
  "/audio-assets/:audioAssetId/confirm",
  requireVerseHanaService,
  confirmAudioUploadController,
);

router.post(
  "/:songId/submit",
  requireVerseHanaService,
  submitSongForReviewController,
);

// ==========================================
// ADMIN: SONG SUBMISSION MANAGEMENT
// ==========================================

router.get(
  "/admin",
  requireAdmin,
  listSongSubmissionsController,
);

router.get(
  "/admin/:submissionId",
  requireAdmin,
  getSongSubmissionController,
);

router.patch(
  "/admin/:submissionId/review",
  requireAdmin,
  reviewSongSubmissionController,
);

export default router;
