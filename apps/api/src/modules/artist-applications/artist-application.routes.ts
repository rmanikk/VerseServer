
import { Router } from "express";
import {
  submitArtistApplication,
  listArtistApplications,
  showArtistApplication,
  decideArtistApplication,
} from "./artist-application.controller.js";
import { requireAdmin } from "../../middleware/admin-auth.middleware.js";
import { requireVerseHanaService } from "../../middleware/versehana-auth.middleware.js";

const router = Router();

// VerseHana backend: submit an artist application.
router.post(
  "/",
  requireVerseHanaService,
  submitArtistApplication,
);

// VerseServer Admin: list applications.
router.get(
  "/",
  requireAdmin,
  listArtistApplications,
);

// VerseServer Admin: view one application.
router.get(
  "/:id",
  requireAdmin,
  showArtistApplication,
);

// VerseServer Admin: approve or reject an application.
router.patch(
  "/:id/review",
  requireAdmin,
  decideArtistApplication,
);

export default router;
