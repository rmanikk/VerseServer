
import { Router } from "express";
import {
  listArtists,
  showArtist,
} from "./artist.controller.js";

const router = Router();

router.get("/", listArtists);
router.get("/:slug", showArtist);

export default router;
