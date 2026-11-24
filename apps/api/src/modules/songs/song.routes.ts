

import { Router } from "express";

import {
  listSongsController,
  getSongBySlugController,
} from "./song.controller.js";

import {
  getSongPlaybackController,
} from "./song-playback.controller.js";

const router = Router();

router.get("/", listSongsController);

// Keep playback before the generic slug route.
router.get("/:slug/playback", getSongPlaybackController);

router.get("/:slug", getSongBySlugController);

export default router;
