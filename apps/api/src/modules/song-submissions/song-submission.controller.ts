
import type { Request, Response } from "express";

import {
  createSongDraftSchema,
  createAudioUploadUrlSchema,
  confirmAudioUploadSchema,
} from "./song-submission.schema.js";

import { createSongDraft } from "./song-submission.service.js";

import {
  createSongAudioUpload,
  confirmSongAudioUpload,
} from "./song-upload.service.js";

export async function createSongDraftController(req: Request, res: Response) {
  const parsed = createSongDraftSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid song draft details.",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const song = await createSongDraft(parsed.data);

    return res.status(201).json({
      success: true,
      message: "Song draft created successfully.",
      data: song,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error.";

    console.error("Song draft creation failed:", error);

    if (message.includes("No artist profile")) {
      return res.status(403).json({ success: false, message });
    }

    if (
      message.includes("not currently active") ||
      message.includes("Multiple active artist")
    ) {
      return res.status(409).json({ success: false, message });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create song draft.",
    });
  }
}

export async function createAudioUploadUrlController(
  req: Request,
  res: Response,
) {
  const parsed = createAudioUploadUrlSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid audio upload details.",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const upload = await createSongAudioUpload(parsed.data);

    return res.status(201).json({
      success: true,
      message: "Audio upload URL created successfully.",
      data: upload,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error.";

    console.error("Audio upload URL creation failed:", error);

    if (message.includes("permission")) {
      return res.status(403).json({ success: false, message });
    }

    if (message.includes("not found")) {
      return res.status(404).json({ success: false, message });
    }

    if (
      message.includes("maximum allowed size") ||
      message.includes("Unsupported audio format")
    ) {
      return res.status(400).json({ success: false, message });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create audio upload URL.",
    });
  }
}

export async function confirmAudioUploadController(
  req: Request,
  res: Response,
) {
  const parsed = confirmAudioUploadSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid audio confirmation details.",
      errors: parsed.error.flatten(),
    });
  }

  const audioAssetId = Array.isArray(req.params.audioAssetId)
  ? req.params.audioAssetId[0]
  : req.params.audioAssetId;

  if (!audioAssetId) {
    return res.status(400).json({
      success: false,
      message: "Audio asset ID is required.",
    });
  }

  try {
    const result = await confirmSongAudioUpload(
      audioAssetId,
      parsed.data,
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error.";

    console.error("Audio upload confirmation failed:", error);

    if (message.includes("permission")) {
      return res.status(403).json({ success: false, message });
    }

    if (message.includes("not found")) {
      return res.status(404).json({ success: false, message });
    }

    if (
      message.includes("does not match") ||
      message.includes("not available") ||
      message.includes("not awaiting") ||
      message.includes("status changed")
    ) {
      return res.status(409).json({ success: false, message });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to confirm audio upload.",
    });
  }
}
