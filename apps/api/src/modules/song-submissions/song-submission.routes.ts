import { Router } from "express";

import { requireVerseHanaService } from "../../middleware/versehana-auth.middleware.js";

import {
  createSongDraftController,
  createAudioUploadUrlController,
  confirmAudioUploadController,
} from "./song-submission.controller.js";

const router = Router();

// Only trusted VerseHana backend requests are allowed.
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

export default router;