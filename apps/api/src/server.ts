
import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function startServer() {
  try {
    await prisma.$connect();

    const server = app.listen(env.PORT, () => {
      console.log("----------------------------------");
      console.log("       VerseServer API");
      console.log("----------------------------------");
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`Port: ${env.PORT}`);
      console.log(`URL: http://localhost:${env.PORT}`);
      console.log("Database: Connected");
      console.log("----------------------------------");
    });

    const shutdown = (signal: string) => {
      console.log(`\n${signal} received. Shutting down...`);

      server.close(async (error) => {
        if (error) {
          console.error("Error closing HTTP server:", error);
          process.exitCode = 1;
        }

        try {
          await prisma.$disconnect();
          console.log("Database disconnected.");
        } catch (disconnectError) {
          console.error("Database disconnection failed:", disconnectError);
          process.exitCode = 1;
        }
      });
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start VerseServer:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
