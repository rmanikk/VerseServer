
import { Router } from "express";

import { requireAdmin } from "../../middleware/admin-auth.middleware.js";
import { requireVerseHanaService } from "../../middleware/versehana-auth.middleware.js";

import {
  submitSongRequest,
  listSongRequests,
  showSongRequest,
  listMySongRequests,
  reviewSongRequestByAdmin,
  fulfillSongRequestByAdmin,
} from "./song-request.controller.js";

const router = Router();

// ==========================================
// VERSEHANA SERVICE ROUTES
// ==========================================

// Submit a song request
router.post(
  "/",
  requireVerseHanaService,
  submitSongRequest
);

// Retrieve a user's song request history
router.get(
  "/my-requests",
  requireVerseHanaService,
  listMySongRequests
);

// ==========================================
// VERSESERVER ADMIN ROUTES
// ==========================================

// List all requests
router.get(
  "/",
  requireAdmin,
  listSongRequests
);

// View request details
router.get(
  "/:id",
  requireAdmin,
  showSongRequest
);

// Accept or reject a request
router.patch(
  "/:id/review",
  requireAdmin,
  reviewSongRequestByAdmin
);

// Mark an accepted request as fulfilled
router.patch(
  "/:id/fulfill",
  requireAdmin,
  fulfillSongRequestByAdmin
);

export default router;
