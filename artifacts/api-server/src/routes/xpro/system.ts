import { Router } from "express";
import os from "os";
import { db, vpnUsersTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import { requireAuth } from "./middleware.js";
import { getCoreVersion, getCoreRunning } from "../../lib/xray.js";

const router = Router();

router.get("/system", requireAuth, async (req, res): Promise<void> => {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(vpnUsersTable);
    const totalUsers = Number(countResult[0].count);

    const activeResult = await db.select({ count: sql<number>`count(*)` }).from(vpnUsersTable).where(eq(vpnUsersTable.status, "active"));
    const activeUsers = Number(activeResult[0].count);

    const version = await getCoreVersion();
    const coreRunning = await getCoreRunning();

    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      return acc + ((total - cpu.times.idle) / total) * 100;
    }, 0) / cpus.length;

    res.json({
      version: version,
      mem_total: totalMem,
      mem_used: totalMem - freeMem,
      cpu_cores: cpus.length,
      cpu_usage: Math.round(cpuUsage * 100) / 100,
      total_user: totalUsers,
      users_active: activeUsers,
      incoming_bandwidth: 0,
      outgoing_bandwidth: 0,
      incoming_bandwidth_speed: 0,
      outgoing_bandwidth_speed: 0,
    });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

export default router;
