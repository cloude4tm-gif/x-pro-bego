import { Router } from "express";
import { db, apiKeysTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import crypto from "crypto";

const router = Router();

function generateKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "xpbk_";
  for (let i = 0; i < 40; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

router.get("/api-keys", requireAuth, async (_req, res) => {
  const keys = await db.select({
    id: apiKeysTable.id,
    name: apiKeysTable.name,
    keyPrefix: apiKeysTable.keyPrefix,
    permissions: apiKeysTable.permissions,
    active: apiKeysTable.active,
    lastUsed: apiKeysTable.lastUsed,
    createdAt: apiKeysTable.createdAt,
  }).from(apiKeysTable).orderBy(apiKeysTable.id);
  res.json(keys.map(k => ({ ...k, permissions: JSON.parse(k.permissions) })));
});

router.post("/api-keys", requireAuth, async (req, res) => {
  const { name, permissions } = req.body;
  const rawKey = generateKey();
  const keyHash = hashKey(rawKey);
  const keyPrefix = rawKey.slice(0, 14);
  const permsJson = JSON.stringify(permissions ?? []);
  const [record] = await db.insert(apiKeysTable).values({ name, keyHash, keyPrefix, permissions: permsJson, active: true }).returning();
  res.status(201).json({ ...record, rawKey, permissions: permissions ?? [] });
});

router.patch("/api-keys/:id/revoke", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [updated] = await db.update(apiKeysTable).set({ active: false }).where(eq(apiKeysTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ok: true });
});

router.delete("/api-keys/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(apiKeysTable).where(eq(apiKeysTable.id, id));
  res.json({ ok: true });
});

export default router;
