
import type { Request, Response, NextFunction } from "express";

import { songSlugSchema } from "./song.schema.js";
import { getSongPlaybackUrl } from "./song-playback.service.js";

export async function getSongPlaybackController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { slug } = songSlugSchema.parse(req.params);

    const result = await getSongPlaybackUrl(slug);

    res.status(200).json({
      success: true,
      message: "Playback URL generated successfully.",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Song not found or not available for playback."
    ) {
      res.status(404).json({
        success: false,
        message: "Song or playable audio not found.",
      });
      return;
    }

    next(error);
  }
}
