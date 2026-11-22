
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      success: true,
      message: "VerseServer API is running",
      service: "VerseServer",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch {
    return res.status(503).json({
      success: false,
      message: "VerseServer API is running, but the database is unavailable",
      service: "VerseServer",
      database: "disconnected",
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
