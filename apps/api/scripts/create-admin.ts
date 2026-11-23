import "../src/config/env.js";

import {
  input,
  password as passwordPrompt,
} from "@inquirer/prompts";

import argon2 from "argon2";
import { prisma } from "../src/lib/prisma.js";

async function createFirstAdmin() {
  try {
    console.log("\n================================");
    console.log("   VerseServer Admin Setup");
    console.log("================================\n");

    const existingAdmins = await prisma.admin.count();

    if (existingAdmins > 0) {
      console.error("An admin account already exists.");
      console.error("First-admin setup is no longer available.");
      process.exitCode = 1;
      return;
    }

    const name = (
      await input({
        message: "Admin name:",
        validate: (value) =>
          value.trim().length >= 2 ||
          "Name must contain at least 2 characters.",
      })
    ).trim();

    const email = (
      await input({
        message: "Admin email:",
        validate: (value) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ||
          "Please enter a valid email address.",
      })
    ).trim().toLowerCase();

    const adminPassword = await passwordPrompt({
      message: "Create admin password (minimum 12 characters):",
      mask: "*",
      validate: (value) =>
        (value.length >= 12 && value.length <= 128) ||
        "Password must be between 12 and 128 characters.",
    });

    const confirmPassword = await passwordPrompt({
      message: "Confirm admin password:",
      mask: "*",
    });

    if (adminPassword !== confirmPassword) {
      console.error("\nPasswords do not match.");
      process.exitCode = 1;
      return;
    }

    const passwordHash = await argon2.hash(adminPassword, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const admin = await prisma.$transaction(
      async (tx) => {
        const count = await tx.admin.count();

        if (count > 0) {
          throw new Error("An admin account already exists.");
        }

        return tx.admin.create({
          data: {
            name,
            email,
            passwordHash,
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
      },
      {
        isolationLevel: "Serializable",
      }
    );

    console.log("\n================================");
    console.log("   Admin Created Successfully");
    console.log("================================");
    console.log(`ID: ${admin.id}`);
    console.log(`Name: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log("\nYou can now log in to VerseServer.");
  } finally {
    await prisma.$disconnect();
  }
}

createFirstAdmin().catch((error) => {
  console.error("\nAdmin setup failed:", error.message);
  process.exitCode = 1;
});
