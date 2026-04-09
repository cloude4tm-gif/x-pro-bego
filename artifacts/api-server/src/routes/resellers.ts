import { Router } from "express";
import { db, resellersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/resellers", requireAuth, async (_req, res) => {
  const resellers = await db.select().from(resellersTable).orderBy(resellersTable.id);
  res.json(resellers);
});

router.post("/resellers", requireAuth, async (req, res) => {
  const { username, email, role, parent, commissionRate, usersLimit, active } = req.body;
  const [r] = await db.insert(resellersTable).values({
    username, email: email ?? "", role: role ?? "reseller", parent: parent ?? null,
    commissionRate: commissionRate ?? 15, usersLimit: usersLimit ?? 50,
    active: active ?? true, balance: 0, usersCreated: 0, totalEarned: 0,
  }).returning();
  res.status(201).json(r);
});

router.put("/resellers/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const fields = req.body;
  const [updated] = await db.update(resellersTable).set(fields).where(eq(resellersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.post("/resellers/:id/balance", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { amount } = req.body;
  if (!amount || typeof amount !== "number") { res.status(400).json({ error: "amount required" }); return; }
  const [updated] = await db.update(resellersTable)
    .set({ balance: sql`${resellersTable.balance} + ${amount}` })
    .where(eq(resellersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/resellers/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(resellersTable).where(eq(resellersTable.id, id));
  res.json({ ok: true });
});

export default router;
