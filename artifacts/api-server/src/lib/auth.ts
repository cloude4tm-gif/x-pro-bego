import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { XproAdmin } from "@workspace/db";

const SECRET = process.env.SESSION_SECRET || "xprobego-secret-change-me";

export interface JwtPayload {
  username: string;
  is_sudo: boolean;
}

export function signToken(admin: XproAdmin): string {
  return jwt.sign(
    { username: admin.username, is_sudo: admin.isSudo },
    SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function extractToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    return parts[1];
  }
  return null;
}
