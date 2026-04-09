import { Router } from "express";
import { db, xproAdminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "../../lib/auth.js";
import { requireAuth, requireSudo } from "./middleware.js";

const router = Router();

router.get("/admin", requireAuth, async (req, res): Promise<void> => {
  try {
    const me = (req as any).admin;
    const admin = await db.select().from(xproAdminsTable).where(eq(xproAdminsTable.username, me.username)).limit(1).then(r => r[0]);
    if (!admin) { res.status(404).json({ detail: "Not found" }); return; }
    res.json({ username: admin.username, is_sudo: admin.isSudo });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

router.get("/admins", requireAuth, async (req, res): Promise<void> => {
  try {
    const admins = await db.select().from(xproAdminsTable);
    res.json(admins.map(a => ({ username: a.username, is_sudo: a.isSudo })));
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

router.post("/admin", requireSudo, async (req, res): Promise<void> => {
  try {
    const { username, password, is_sudo } = req.body as any;
    if (!username || !password) { res.status(422).json({ detail: "username and password required" }); return; }
    const hashed = await hashPassword(password);
    const [admin] = await db.insert(xproAdminsTable).values({
      username, hashedPassword: hashed, isSudo: !!is_sudo,
    }).returning();
    res.status(201).json({ username: admin.username, is_sudo: admin.isSudo });
  } catch (err: any) {
    if (err.code === "23505") { res.status(409).json({ detail: "Admin already exists" }); return; }
    res.status(500).json({ detail: err.message });
  }
});

router.put("/admin/:username", requireSudo, async (req, res): Promise<void> => {
  try {
    const { username } = req.params;
    const { password, is_sudo } = req.body as any;
    const updates: Record<string, any> = {};
    if (password) updates.hashedPassword = await hashPassword(password);
    if (typeof is_sudo === "boolean") updates.isSudo = is_sudo;
    if (Object.keys(updates).length === 0) { res.status(422).json({ detail: "Nothing to update" }); return; }
    const [admin] = await db.update(xproAdminsTable).set(updates).where(eq(xproAdminsTable.username, username)).returning();
    if (!admin) { res.status(404).json({ detail: "Admin not found" }); return; }
    res.json({ username: admin.username, is_sudo: admin.isSudo });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

router.delete("/admin/:username", requireSudo, async (req, res): Promise<void> => {
  try {
    const { username } = req.params;
    const me = (req as any).admin;
    if (me.username === username) { res.status(400).json({ detail: "Cannot delete yourself" }); return; }
    await db.delete(xproAdminsTable).where(eq(xproAdminsTable.username, username));
    res.json({ detail: "Admin deleted" });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

export default router;
