
import express from "express";
import cors from "cors";
import helmet from "helmet";

import healthRoutes from "./routes/health.routes.js";
import artistRoutes from "./modules/artists/artist.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import songRequestRoutes from "./modules/song-requests/song-request.routes.js";
import artistApplicationRoutes from "./modules/artist-applications/artist-application.routes.js";
import songSubmissionRoutes from "./modules/song-submissions/song-submission.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Welcome to VerseServer API",
    version: "1.0.0",
  });
});

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/artists", artistRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/song-requests", songRequestRoutes);
app.use("/api/v1/artist-applications", artistApplicationRoutes);
app.use("/api/v1/song-submissions", songSubmissionRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

export default app;
