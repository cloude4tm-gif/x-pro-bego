import { Router } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { eq, desc, like, and, SQL } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/audit-logs", requireAuth, async (req, res) => {
  const { admin, action, search, limit = "50", offset = "0" } = req.query;
  const conditions: SQL[] = [];
  if (admin && admin !== "all") conditions.push(eq(auditLogsTable.admin, String(admin)));
  if (action && action !== "all") conditions.push(eq(auditLogsTable.action, String(action)));
  if (search) conditions.push(like(auditLogsTable.target, `%${search}%`));

  const logs = conditions.length > 0
    ? await db.select().from(auditLogsTable).where(and(...conditions)).orderBy(desc(auditLogsTable.createdAt)).limit(Number(limit)).offset(Number(offset))
    : await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(Number(limit)).offset(Number(offset));

  const admins = await db.selectDistinct({ admin: auditLogsTable.admin }).from(auditLogsTable);
  res.json({ logs, admins: admins.map(a => a.admin) });
});

router.post("/audit-logs", requireAuth, async (req, res) => {
  const { admin, action, target, ip, detail } = req.body;
  const [log] = await db.insert(auditLogsTable).values({
    admin: admin ?? "system",
    action: action ?? "unknown",
    target: target ?? "",
    ip: ip ?? req.ip ?? "",
    detail: detail ?? "",
  }).returning();
  res.status(201).json(log);
});

export default router;
