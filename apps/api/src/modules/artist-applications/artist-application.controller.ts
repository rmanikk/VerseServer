
import type { Request, Response } from "express";
import {
  createArtistApplication,
  getArtistApplications,
  getArtistApplicationById,
  reviewArtistApplication,
} from "./artist-application.service.js";
import {
  createArtistApplicationSchema,
  reviewArtistApplicationSchema,
} from "./artist-application.schema.js";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

// VerseHana backend submits an application.
export async function submitArtistApplication(
  req: Request,
  res: Response,
) {
  const parsed = createArtistApplicationSchema.safeParse(
    req.body,
  );

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid artist application.",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const application = await createArtistApplication(
      parsed.data,
    );

    return res.status(201).json({
      success: true,
      message: "Artist application submitted successfully.",
      data: application,
    });
  } catch (error) {
    return res.status(409).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
}

// VerseServer Admin lists applications.
export async function listArtistApplications(
  req: Request,
  res: Response,
) {
  const status = req.query.status;

  const allowedStatuses = [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "WITHDRAWN",
  ] as const;

  if (
    status !== undefined &&
    (typeof status !== "string" ||
      !allowedStatuses.includes(
        status as (typeof allowedStatuses)[number],
      ))
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid application status filter.",
    });
  }

  try {
    const applications = await getArtistApplications(
      status as
        | (typeof allowedStatuses)[number]
        | undefined,
    );

    return res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
}

// VerseServer Admin views one application.
export async function showArtistApplication(
  req: Request,
  res: Response,
) {
  const applicationId = req.params.id;

  if (typeof applicationId !== "string") {
    return res.status(400).json({
      success: false,
      message: "Invalid application ID.",
    });
  }

  try {
    const application =
      await getArtistApplicationById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Artist application not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
}

// VerseServer Admin approves or rejects an application.
export async function decideArtistApplication(
  req: Request,
  res: Response,
) {
  const parsed = reviewArtistApplicationSchema.safeParse(
    req.body,
  );

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid application review.",
      errors: parsed.error.flatten(),
    });
  }

  if (!req.admin?.id) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });
  }

  const applicationId = req.params.id;

  if (typeof applicationId !== "string") {
    return res.status(400).json({
      success: false,
      message: "Invalid application ID.",
    });
  }

  try {
    const application = await reviewArtistApplication(
      applicationId,
      req.admin.id,
      parsed.data,
    );

    return res.status(200).json({
      success: true,
      message:
        parsed.data.action === "APPROVED"
          ? "Artist application approved."
          : "Artist application rejected.",
      data: application,
    });
  } catch (error) {
    const message = getErrorMessage(error);

    const statusCode = message.includes("not found")
      ? 404
      : message.includes("already")
        ? 409
        : 400;

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}
