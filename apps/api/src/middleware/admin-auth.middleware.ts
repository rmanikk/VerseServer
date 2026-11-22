
import type { Request, Response, NextFunction } from "express";

import { verifyAdminAccessToken } from "../modules/auth/auth.service.js";
import { prisma } from "../lib/prisma.js";

export interface AdminRequest extends Request {
  admin?: {
    id: string;
    email: string;
    name: string;
  };
}

export async function requireAdmin(
  req: AdminRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const tokenAdmin = await verifyAdminAccessToken(token);

    const admin = await prisma.admin.findUnique({
      where: { id: tokenAdmin.adminId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });

    if (!admin || !admin.isActive || admin.email !== tokenAdmin.email) {
      return res.status(401).json({
        success: false,
        message: "Admin account is inactive or no longer valid.",
      });
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    };

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
}
