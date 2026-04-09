import { Router } from "express";
import { db, botSettingsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router = Router();

async function getOrCreate() {
  const rows = await db.select().from(botSettingsTable).limit(1);
  if (rows.length > 0) return rows[0];
  const [created] = await db.insert(botSettingsTable).values({ botToken: "", chatIds: "", adminChatId: "", botActive: false, enabledEvents: "[]", eventTemplates: "{}" }).returning();
  return created;
}

router.get("/bot-settings", requireAuth, async (_req, res) => {
  const settings = await getOrCreate();
  res.json({
    ...settings,
    enabledEvents: JSON.parse(settings.enabledEvents),
    eventTemplates: JSON.parse(settings.eventTemplates),
  });
});

router.put("/bot-settings", requireAuth, async (req, res) => {
  const { botToken, chatIds, adminChatId, botActive, enabledEvents, eventTemplates } = req.body;
  const existing = await getOrCreate();
  const [updated] = await db.update(botSettingsTable).set({
    botToken: botToken ?? existing.botToken,
    chatIds: chatIds ?? existing.chatIds,
    adminChatId: adminChatId ?? existing.adminChatId,
    botActive: botActive ?? existing.botActive,
    enabledEvents: JSON.stringify(enabledEvents ?? []),
    eventTemplates: JSON.stringify(eventTemplates ?? {}),
    updatedAt: new Date(),
  }).returning();
  res.json({ ...updated, enabledEvents: JSON.parse(updated.enabledEvents), eventTemplates: JSON.parse(updated.eventTemplates) });
});

router.post("/bot-settings/test", requireAuth, async (_req, res) => {
  const settings = await getOrCreate();
  if (!settings.botToken || !settings.adminChatId) {
    res.status(400).json({ error: "Bot token ve admin chat ID gerekli" }); return;
  }
  try {
    const resp = await fetch(`https://api.telegram.org/bot${settings.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: settings.adminChatId, text: "✅ X-Pro Bego bağlantısı başarılı! Bot aktif.", parse_mode: "Markdown" }),
    });
    const data = await resp.json() as { ok: boolean; description?: string };
    if (!data.ok) { res.status(400).json({ error: data.description }); return; }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export async function sendTelegramNotification(message: string) {
  const rows = await db.select().from(botSettingsTable).limit(1);
  if (!rows.length || !rows[0].botActive || !rows[0].botToken) return;
  const settings = rows[0];
  const chatIds = settings.chatIds.split(",").map(s => s.trim()).filter(Boolean);
  for (const chatId of chatIds) {
    try {
      await fetch(`https://api.telegram.org/bot${settings.botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" }),
      });
    } catch { /* ignore */ }
  }
}

export default router;
