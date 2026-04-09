import { Router } from "express";
import { db, ipRulesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/ip-rules", requireAuth, async (req, res) => {
  const { type } = req.query;
  let query = db.select().from(ipRulesTable);
  const rules = type
    ? await db.select().from(ipRulesTable).where(eq(ipRulesTable.type, String(type)))
    : await query;
  res.json(rules);
});

router.post("/ip-rules", requireAuth, async (req, res) => {
  const { type, ip, reason, country } = req.body;
  if (!type || !ip) { res.status(400).json({ error: "type and ip required" }); return; }
  const [rule] = await db.insert(ipRulesTable).values({ type, ip, reason: reason ?? "", country: country ?? null }).returning();
  res.status(201).json(rule);
});

router.delete("/ip-rules/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(ipRulesTable).where(eq(ipRulesTable.id, id));
  res.json({ ok: true });
});

export default router;
