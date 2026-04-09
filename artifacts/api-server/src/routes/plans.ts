import { Router } from "express";
import { db, plansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/plans", requireAuth, async (_req, res) => {
  const plans = await db.select().from(plansTable).orderBy(plansTable.id);
  res.json(plans);
});

router.post("/plans", requireAuth, async (req, res) => {
  const { name, emoji, color, price, currency, dataLimitGB, durationDays, userLimit, description, popular } = req.body;
  const [plan] = await db.insert(plansTable).values({ name, emoji, color, price, currency, dataLimitGB, durationDays, userLimit, description, popular: popular ?? false }).returning();
  res.status(201).json(plan);
});

router.put("/plans/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { name, emoji, color, price, currency, dataLimitGB, durationDays, userLimit, description, popular, active } = req.body;
  const [updated] = await db.update(plansTable).set({ name, emoji, color, price, currency, dataLimitGB, durationDays, userLimit, description, popular, active }).where(eq(plansTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/plans/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(plansTable).where(eq(plansTable.id, id));
  res.json({ ok: true });
});

export default router;
