import { Router } from "express";
import { db, automationTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router = Router();

async function getOrCreate() {
  const rows = await db.select().from(automationTable).limit(1);
  if (rows.length > 0) return rows[0];
  const [created] = await db.insert(automationTable).values({}).returning();
  return created;
}

router.get("/automation", requireAuth, async (_req, res) => {
  const settings = await getOrCreate();
  res.json({
    ...settings,
    reminderDaysBefore: JSON.parse(settings.reminderDaysBefore),
  });
});

router.put("/automation", requireAuth, async (req, res) => {
  const body = req.body;
  if (body.reminderDaysBefore && Array.isArray(body.reminderDaysBefore)) {
    body.reminderDaysBefore = JSON.stringify(body.reminderDaysBefore);
  }
  await db.update(automationTable).set({ ...body, updatedAt: new Date() });
  const settings = await getOrCreate();
  res.json({ ...settings, reminderDaysBefore: JSON.parse(settings.reminderDaysBefore) });
});

export default router;
