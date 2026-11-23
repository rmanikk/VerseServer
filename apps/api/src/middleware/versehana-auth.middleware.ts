
import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "node:crypto";

import { env } from "../config/env.js";

export function requireVerseHanaService(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const providedSecret = req.get("x-versehana-service-secret");

  if (!providedSecret) {
    return res.status(401).json({
      success: false,
      message: "Service authentication required.",
    });
  }

  const expectedBuffer = Buffer.from(
    env.VERSEHANA_SERVICE_SECRET,
    "utf8"
  );

  const providedBuffer = Buffer.from(providedSecret, "utf8");

  // timingSafeEqual requires buffers of equal length.
  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid service credentials.",
    });
  }

  return next();
}
