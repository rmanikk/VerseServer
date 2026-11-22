
import type { Request, Response } from "express";
import {
  getArtists,
  getArtistBySlug,
} from "./artist.service.js";

export async function listArtists(
  _req: Request,
  res: Response
) {
  try {
    const artists = await getArtists();

    return res.status(200).json({
      success: true,
      data: artists,
    });
  } catch (error) {
    console.error("Failed to fetch artists:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve artists",
    });
  }
}

export async function showArtist(
  req: Request,
  res: Response
) {
  try {
    const slug = req.params.slug;

    if (typeof slug !== "string" || !slug.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid artist slug is required",
      });
    }

    const artist = await getArtistBySlug(slug);

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: artist,
    });
  } catch (error) {
    console.error("Failed to fetch artist:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve artist",
    });
  }
}
