import { Router } from "express";
import { db, trafficSnapshotsTable } from "@workspace/db";
import { desc, gte } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/analytics/snapshots", requireAuth, async (req, res) => {
  const days = Number(req.query.days ?? 30);
  const since = new Date();
  since.setDate(since.getDate() - days);
  const snaps = await db.select().from(trafficSnapshotsTable)
    .where(gte(trafficSnapshotsTable.recordedAt, since))
    .orderBy(desc(trafficSnapshotsTable.recordedAt))
    .limit(days * 24);
  res.json(snaps);
});

router.post("/analytics/snapshot", requireAuth, async (req, res) => {
  const { uploadBytes, downloadBytes, activeUsers, totalUsers, cpuUsage, memUsage } = req.body;
  const [snap] = await db.insert(trafficSnapshotsTable).values({
    uploadBytes: uploadBytes ?? 0,
    downloadBytes: downloadBytes ?? 0,
    activeUsers: activeUsers ?? 0,
    totalUsers: totalUsers ?? 0,
    cpuUsage: cpuUsage ?? 0,
    memUsage: memUsage ?? 0,
  }).returning();
  res.status(201).json(snap);
});

export default router;
