import type { Request, Response, NextFunction } from "express";
import { verifyToken, extractToken } from "../../lib/auth.js";
import { db, xproAdminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      res.status(401).json({ detail: "Not authenticated" });
      return;
    }
    const payload = verifyToken(token);
    (req as any).admin = payload;
    next();
  } catch {
    res.status(401).json({ detail: "Invalid or expired token" });
  }
}

export async function requireSudo(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, async () => {
    if (!(req as any).admin?.is_sudo) {
      res.status(403).json({ detail: "You're not allowed to do this action" });
      return;
    }
    next();
  });
}
