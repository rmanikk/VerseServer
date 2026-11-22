
import argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../../config/env.js";

const jwtSecret = new TextEncoder().encode(env.JWT_SECRET);

const TOKEN_ISSUER = "verseserver";
const TOKEN_AUDIENCE = "verseserver-admin";

export interface AdminTokenPayload {
  adminId: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(
  passwordHash: string,
  password: string
): Promise<boolean> {
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}

export async function createAdminAccessToken(
  admin: AdminTokenPayload
): Promise<string> {
  return new SignJWT({
    email: admin.email,
    role: "ADMIN",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.adminId)
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(jwtSecret);
}

export async function verifyAdminAccessToken(token: string) {
  const { payload } = await jwtVerify(token, jwtSecret, {
    algorithms: ["HS256"],
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
  });

  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    payload.role !== "ADMIN"
  ) {
    throw new Error("Invalid admin token payload");
  }

  return {
    adminId: payload.sub,
    email: payload.email,
  };
}
