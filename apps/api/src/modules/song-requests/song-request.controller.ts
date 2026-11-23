
import type { Request, Response } from "express";
import { z } from "zod";

import type { AdminRequest } from "../../middleware/admin-auth.middleware.js";

import {
  createSongRequest,
  getSongRequests,
  getSongRequestById,
  getUserSongRequests,
  reviewSongRequest,
  fulfillSongRequest,
} from "./song-request.service.js";

import {
  createSongRequestSchema,
  listSongRequestsSchema,
  reviewSongRequestSchema,
  fulfillSongRequestSchema,
} from "./song-request.schema.js";

const requesterUserIdSchema = z
  .string()
  .trim()
  .min(1, "A valid requester user ID is required.")
  .max(191);

export async function submitSongRequest(req: Request, res: Response) {
  const userIdResult = requesterUserIdSchema.safeParse(
    req.body?.requesterUserId
  );

  if (!userIdResult.success) {
    return res.status(400).json({
      success: false,
      message: "A valid requester user ID is required.",
    });
  }

  const parsed = createSongRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid song request details.",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const request = await createSongRequest({
      requesterUserId: userIdResult.data,
      artistName: parsed.data.artistName,
      songName: parsed.data.songName,
      youtubeUrl: parsed.data.youtubeUrl,
      message: parsed.data.message,
    });

    return res.status(201).json({
      success: true,
      message: "Song request submitted successfully.",
      data: request,
    });
  } catch (error) {
    console.error("Song request submission failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit song request.",
    });
  }
}

export async function listSongRequests(req: AdminRequest, res: Response) {
  const parsed = listSongRequestsSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid request filters.",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const result = await getSongRequests(parsed.data);

    return res.status(200).json({
      success: true,
      data: result.requests,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Failed to retrieve song requests:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve song requests.",
    });
  }
}

export async function showSongRequest(req: AdminRequest, res: Response) {
  const requestId = req.params.id;

  if (typeof requestId !== "string" || !requestId.trim()) {
    return res.status(400).json({
      success: false,
      message: "A valid request ID is required.",
    });
  }

  try {
    const request = await getSongRequestById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Song request not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error("Failed to retrieve song request:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve song request.",
    });
  }
}

const userHistoryQuerySchema = z.object({
  requesterUserId: requesterUserIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function listMySongRequests(req: Request, res: Response) {
  const parsed = userHistoryQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid song request history parameters.",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const result = await getUserSongRequests(
      parsed.data.requesterUserId,
      parsed.data.page,
      parsed.data.limit
    );

    return res.status(200).json({
      success: true,
      data: result.requests,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Failed to retrieve user song requests:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your song requests.",
    });
  }
}

export async function reviewSongRequestByAdmin(
  req: AdminRequest,
  res: Response
) {
  const requestId = req.params.id;

  if (typeof requestId !== "string" || !requestId.trim()) {
    return res.status(400).json({
      success: false,
      message: "A valid request ID is required.",
    });
  }

  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });
  }

  const parsed = reviewSongRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid review details.",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const request = await reviewSongRequest({
      requestId,
      adminId: req.admin.id,
      action: parsed.data.action,
      adminNotes: parsed.data.adminNotes,
      responseMessage: parsed.data.responseMessage,
    });

    if (!request) {
      return res.status(409).json({
        success: false,
        message: "Request not found or it is no longer pending review.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        parsed.data.action === "ACCEPTED"
          ? "Song request accepted successfully."
          : "Song request rejected successfully.",
      data: request,
    });
  } catch (error) {
    console.error("Failed to review song request:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to review song request.",
    });
  }
}

export async function fulfillSongRequestByAdmin(
  req: AdminRequest,
  res: Response
) {
  const requestId = req.params.id;

  if (typeof requestId !== "string" || !requestId.trim()) {
    return res.status(400).json({
      success: false,
      message: "A valid request ID is required.",
    });
  }

  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });
  }

  const parsed = fulfillSongRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid fulfilment details.",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const request = await fulfillSongRequest({
      requestId,
      adminId: req.admin.id,
      songId: parsed.data.songId,
    });

    if (!request) {
      return res.status(409).json({
        success: false,
        message: "Request not found or it has not been accepted.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Song request fulfilled successfully.",
      data: request,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "The linked song must be approved and published."
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Failed to fulfil song request:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fulfil song request.",
    });
  }
}
