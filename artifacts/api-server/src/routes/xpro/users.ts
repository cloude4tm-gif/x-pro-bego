import { Router } from "express";
import { db, vpnUsersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "./middleware.js";
import { writeConfigToFile, restartCore, readConfig } from "../../lib/xray.js";
import { generateLinksForUser, encodeSubscription } from "../../lib/subscription.js";
import crypto from "crypto";

const router = Router();

function formatUser(u: any) {
  return {
    username: u.username,
    uuid: u.uuid,
    proxies: { vless: { id: u.uuid }, shadowsocks: { password: u.uuid } },
    inbounds: u.inbounds || {},
    expire: u.expireDate ? Math.floor(new Date(u.expireDate).getTime() / 1000) : null,
    data_limit: u.dataLimit,
    data_limit_reset_strategy: u.dataLimitResetStrategy || "no_reset",
    status: computeStatus(u),
    used_traffic: u.usedTraffic || 0,
    lifetime_used_traffic: u.lifetimeUsedTraffic || 0,
    created_at: u.createdAt?.toISOString?.() || u.createdAt,
    note: u.note || "",
    sub_url: `/api/sub/${u.subToken}`,
    online_at: u.onlineAt ? (u.onlineAt?.toISOString?.() || u.onlineAt) : null,
    on_hold_expire_duration: null,
    on_hold_timeout: null,
  };
}

function computeStatus(u: any): string {
  if (u.status === "disabled") return "disabled";
  if (u.dataLimit && (u.usedTraffic || 0) >= u.dataLimit) return "limited";
  if (u.expireDate && new Date(u.expireDate) < new Date()) return "expired";
  return u.status || "active";
}

router.get("/users", requireAuth, async (req, res): Promise<void> => {
  try {
    const offset = parseInt(req.query.offset as string || "0");
    const limit = parseInt(req.query.limit as string || "50");
    const users = await db.select().from(vpnUsersTable).orderBy(desc(vpnUsersTable.createdAt)).offset(offset).limit(limit);
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(vpnUsersTable);
    const total = Number(countResult[0].count);
    res.json({ users: users.map(formatUser), total });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

router.post("/user", requireAuth, async (req, res): Promise<void> => {
  try {
    const body = req.body as any;
    const username = body.username;
    if (!username) { res.status(422).json({ detail: "username required" }); return; }

    const uuid = crypto.randomUUID();
    const subToken = crypto.randomBytes(16).toString("hex");
    const expireDate = body.expire ? new Date(body.expire * 1000) : null;
    const inbounds = body.inbounds || {};

    const [user] = await db.insert(vpnUsersTable).values({
      username,
      uuid,
      status: "active",
      dataLimit: body.data_limit || null,
      dataLimitResetStrategy: body.data_limit_reset_strategy || "no_reset",
      expireDate,
      inbounds: inbounds,
      note: body.note || "",
      subToken,
    }).returning();

    try { await writeConfigToFile(); await restartCore(); } catch (e: any) { req.log?.warn({ err: e.message }, "Xray config write/restart skipped"); }

    res.status(201).json(formatUser(user));
  } catch (err: any) {
    if (err.code === "23505") { res.status(409).json({ detail: "User already exists" }); return; }
    res.status(500).json({ detail: err.message });
  }
});

router.get("/user/:username", requireAuth, async (req, res): Promise<void> => {
  try {
    const user = await db.select().from(vpnUsersTable).where(eq(vpnUsersTable.username, req.params.username)).limit(1).then(r => r[0]);
    if (!user) { res.status(404).json({ detail: "User not found" }); return; }
    res.json(formatUser(user));
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

router.put("/user/:username", requireAuth, async (req, res): Promise<void> => {
  try {
    const body = req.body as any;
    const updates: Record<string, any> = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.inbounds !== undefined) updates.inbounds = body.inbounds;
    if (body.expire !== undefined) updates.expireDate = body.expire ? new Date(body.expire * 1000) : null;
    if (body.data_limit !== undefined) updates.dataLimit = body.data_limit;
    if (body.data_limit_reset_strategy !== undefined) updates.dataLimitResetStrategy = body.data_limit_reset_strategy;
    if (body.note !== undefined) updates.note = body.note;

    const [user] = await db.update(vpnUsersTable).set(updates).where(eq(vpnUsersTable.username, req.params.username)).returning();
    if (!user) { res.status(404).json({ detail: "User not found" }); return; }

    try { await writeConfigToFile(); await restartCore(); } catch (e: any) { req.log?.warn({ err: e.message }, "Xray config write/restart skipped"); }

    res.json(formatUser(user));
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

router.delete("/user/:username", requireAuth, async (req, res): Promise<void> => {
  try {
    await db.delete(vpnUsersTable).where(eq(vpnUsersTable.username, req.params.username));
    try { await writeConfigToFile(); await restartCore(); } catch (e: any) { req.log?.warn({ err: e.message }, "Xray config write/restart skipped"); }
    res.json({ detail: "User deleted" });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

router.post("/user/:username/reset-usage", requireAuth, async (req, res): Promise<void> => {
  try {
    const [user] = await db.update(vpnUsersTable).set({ usedTraffic: 0 }).where(eq(vpnUsersTable.username, req.params.username)).returning();
    if (!user) { res.status(404).json({ detail: "User not found" }); return; }
    res.json(formatUser(user));
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

router.get("/user/:username/usage", requireAuth, async (req, res): Promise<void> => {
  try {
    const user = await db.select().from(vpnUsersTable).where(eq(vpnUsersTable.username, req.params.username)).limit(1).then(r => r[0]);
    if (!user) { res.status(404).json({ detail: "User not found" }); return; }
    res.json({ username: user.username, used_traffic: user.usedTraffic || 0 });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

router.get("/user/:username/subscription", async (req, res): Promise<void> => {
  try {
    const user = await db.select().from(vpnUsersTable).where(eq(vpnUsersTable.username, req.params.username)).limit(1).then(r => r[0]);
    if (!user) { res.status(404).json({ detail: "User not found" }); return; }
    const config = await readConfig();
    const links = generateLinksForUser(user, config);
    const encoded = encodeSubscription(links);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${user.username}"`);
    res.send(encoded);
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

router.get("/sub/:token", async (req, res): Promise<void> => {
  try {
    const user = await db.select().from(vpnUsersTable).where(eq(vpnUsersTable.subToken, req.params.token)).limit(1).then(r => r[0]);
    if (!user) { res.status(404).send("Not found"); return; }
    const config = await readConfig();
    const links = generateLinksForUser(user, config);
    const encoded = encodeSubscription(links);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${user.username}"`);
    res.send(encoded);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

export default router;
