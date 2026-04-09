import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const botSettingsTable = pgTable("bot_settings", {
  id: serial("id").primaryKey(),
  botToken: text("bot_token").notNull().default(""),
  chatIds: text("chat_ids").notNull().default(""),
  adminChatId: text("admin_chat_id").notNull().default(""),
  botActive: boolean("bot_active").notNull().default(false),
  enabledEvents: text("enabled_events").notNull().default("[]"),
  eventTemplates: text("event_templates").notNull().default("{}"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBotSettingsSchema = createInsertSchema(botSettingsTable).omit({ id: true, updatedAt: true });
export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;
export type BotSettings = typeof botSettingsTable.$inferSelect;
