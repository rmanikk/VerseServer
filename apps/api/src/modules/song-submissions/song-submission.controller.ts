
import type { Request, Response } from "express";

import {
  createSongDraftSchema,
  createAudioUploadUrlSchema,
  confirmAudioUploadSchema,
  submitSongForReviewSchema,
  listSongSubmissionsSchema,
  reviewSongSubmissionSchema,
} from "./song-submission.schema.js";

import {
  createSongDraft,
  submitSongForReview,
  listSongSubmissions,
  getSongSubmissionById,
  reviewSongSubmission,
} from "./song-submission.service.js";

import {
  createSongAudioUpload,
  confirmSongAudioUpload,
} from "./song-upload.service.js";

// ==========================================
// CREATE SONG DRAFT
// ==========================================

export async function createSongDraftController(
  req: Request,
  res: Response,
) {
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

// ==========================================
// CREATE AUDIO UPLOAD URL
// ==========================================

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

// ==========================================
// CONFIRM AUDIO UPLOAD
// ==========================================

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

// ==========================================
// SUBMIT SONG FOR ADMIN REVIEW
// ==========================================

export async function submitSongForReviewController(
  req: Request,
  res: Response,
) {
  const parsed = submitSongForReviewSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid song submission details.",
      errors: parsed.error.flatten(),
    });
  }

  const songId = Array.isArray(req.params.songId)
    ? req.params.songId[0]
    : req.params.songId;

  if (!songId) {
    return res.status(400).json({
      success: false,
      message: "Song ID is required.",
    });
  }

  try {
    const submission = await submitSongForReview(
      songId,
      parsed.data,
    );

    return res.status(201).json({
      success: true,
      message: "Song submitted for admin review successfully.",
      data: submission,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error.";

    console.error("Song submission failed:", error);

    if (message.includes("permission")) {
      return res.status(403).json({ success: false, message });
    }

    if (message.includes("not found")) {
      return res.status(404).json({ success: false, message });
    }

    if (
      message.includes("Only draft songs") ||
      message.includes("at least one") ||
      message.includes("Multiple primary") ||
      message.includes("status changed")
    ) {
      return res.status(409).json({ success: false, message });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to submit song for review.",
    });
  }
}

// ==========================================
// ADMIN: LIST SONG SUBMISSIONS
// ==========================================

export async function listSongSubmissionsController(
  req: Request,
  res: Response,
) {
  const parsed = listSongSubmissionsSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid song submission filters.",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const result = await listSongSubmissions(parsed.data);

    return res.status(200).json({
      success: true,
      message: "Song submissions retrieved successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Song submission listing failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve song submissions.",
    });
  }
}

// ==========================================
// ADMIN: GET SONG SUBMISSION DETAILS
// ==========================================

export async function getSongSubmissionController(
  req: Request,
  res: Response,
) {
  const submissionId = Array.isArray(req.params.submissionId)
    ? req.params.submissionId[0]
    : req.params.submissionId;

  if (!submissionId) {
    return res.status(400).json({
      success: false,
      message: "Submission ID is required.",
    });
  }

  try {
    const submission = await getSongSubmissionById(submissionId);

    return res.status(200).json({
      success: true,
      message: "Song submission retrieved successfully.",
      data: submission,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error.";

    console.error("Song submission retrieval failed:", error);

    if (message.includes("not found")) {
      return res.status(404).json({ success: false, message });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve song submission.",
    });
  }
}

// ==========================================
// ADMIN: REVIEW SONG SUBMISSION
// ==========================================

export async function reviewSongSubmissionController(
  req: Request,
  res: Response,
) {
  const parsed = reviewSongSubmissionSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid song review details.",
      errors: parsed.error.flatten(),
    });
  }

  const submissionId = Array.isArray(req.params.submissionId)
    ? req.params.submissionId[0]
    : req.params.submissionId;

  if (!submissionId) {
    return res.status(400).json({
      success: false,
      message: "Submission ID is required.",
    });
  }

  const adminId = req.admin?.id;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication is required.",
    });
  }

  try {
    const submission = await reviewSongSubmission(
      submissionId,
      adminId,
      parsed.data,
    );

    return res.status(200).json({
      success: true,
      message:
        parsed.data.action === "APPROVE"
          ? "Song submission approved and added to the catalogue successfully."
          : "Song submission rejected successfully.",
      data: submission,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error.";

    console.error("Song submission review failed:", error);

    if (message.includes("not found")) {
      return res.status(404).json({ success: false, message });
    }

    if (
      message.includes("already been reviewed") ||
      message.includes("valid state") ||
      message.includes("without a rights declaration") ||
      message.includes("without a ready audio asset") ||
      message.includes("status changed")
    ) {
      return res.status(409).json({ success: false, message });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to review song submission.",
    });
  }
}
