import { Router } from "express";
import { db, webhooksTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/webhooks", requireAuth, async (_req, res) => {
  const hooks = await db.select().from(webhooksTable).orderBy(webhooksTable.id);
  res.json(hooks.map(h => ({ ...h, events: JSON.parse(h.events) })));
});

router.post("/webhooks", requireAuth, async (req, res) => {
  const { name, url, secret, events, method, active } = req.body;
  const [hook] = await db.insert(webhooksTable).values({
    name, url, secret: secret ?? "", events: JSON.stringify(events ?? []),
    method: method ?? "POST", active: active ?? true,
  }).returning();
  res.status(201).json({ ...hook, events: JSON.parse(hook.events) });
});

router.put("/webhooks/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { name, url, secret, events, method, active } = req.body;
  const [updated] = await db.update(webhooksTable).set({
    name, url, secret, events: JSON.stringify(events ?? []), method, active,
  }).where(eq(webhooksTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, events: JSON.parse(updated.events) });
});

router.delete("/webhooks/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(webhooksTable).where(eq(webhooksTable.id, id));
  res.json({ ok: true });
});

router.post("/webhooks/:id/test", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [hook] = await db.select().from(webhooksTable).where(eq(webhooksTable.id, id));
  if (!hook) { res.status(404).json({ error: "Not found" }); return; }

  const payload = { event: "test", message: "X-Pro Bego webhook test", timestamp: new Date().toISOString() };
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (hook.secret) headers["X-Secret"] = hook.secret;

  let statusCode = 0;
  try {
    const response = await fetch(hook.url, { method: hook.method, headers, body: hook.method === "POST" ? JSON.stringify(payload) : undefined });
    statusCode = response.status;
  } catch {
    statusCode = 0;
  }

  await db.update(webhooksTable).set({
    lastTriggered: new Date(),
    lastStatus: statusCode || null,
    triggerCount: sql`${webhooksTable.triggerCount} + 1`,
  }).where(eq(webhooksTable.id, id));

  res.json({ ok: true, status: statusCode });
});

export async function fireWebhookEvent(event: string, payload: object) {
  const hooks = await db.select().from(webhooksTable).where(eq(webhooksTable.active, true));
  for (const hook of hooks) {
    const events = JSON.parse(hook.events) as string[];
    if (!events.includes(event)) continue;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (hook.secret) headers["X-Secret"] = hook.secret;
    const body = JSON.stringify({ event, ...payload, timestamp: new Date().toISOString() });
    let statusCode = 0;
    try {
      const r = await fetch(hook.url, { method: hook.method, headers, body: hook.method === "POST" ? body : undefined });
      statusCode = r.status;
    } catch { statusCode = 0; }
    await db.update(webhooksTable).set({
      lastTriggered: new Date(), lastStatus: statusCode || null,
      triggerCount: sql`${webhooksTable.triggerCount} + 1`,
    }).where(eq(webhooksTable.id, hook.id));
  }
}

export default router;
