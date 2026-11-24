
import type { Request, Response, NextFunction } from "express";

import {
  listSongsSchema,
  songSlugSchema,
} from "./song.schema.js";

import {
  getSongs,
  getSongBySlug,
} from "./song.service.js";

export async function listSongsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const query = listSongsSchema.parse(req.query);
    const result = await getSongs(query);

    return res.status(200).json({
      success: true,
      message: "Songs retrieved successfully.",
      data: result.songs,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getSongBySlugController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const params = songSlugSchema.parse(req.params);
    const song = await getSongBySlug(params.slug);

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Song retrieved successfully.",
      data: song,
    });
  } catch (error) {
    return next(error);
  }
}
