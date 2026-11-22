
import type { Request, Response } from "express";
import { z } from "zod";

import { prisma } from "../../lib/prisma.js";
import {
  createAdminAccessToken,
  verifyPassword,
} from "./auth.service.js";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export async function adminLogin(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email and password.",
    });
  }

  const email = parsed.data.email.toLowerCase();
  const { password } = parsed.data;

  try {
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordIsValid = await verifyPassword(
      admin.passwordHash,
      password
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const accessToken = await createAdminAccessToken({
      adminId: admin.id,
      email: admin.email,
    });

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      data: {
        accessToken,
        tokenType: "Bearer",
        expiresIn: "15m",
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
        },
      },
    });
  } catch (error) {
    console.error("Admin login failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process admin login.",
    });
  }
}
