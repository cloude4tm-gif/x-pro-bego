import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const webhooksTable = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  secret: text("secret").notNull().default(""),
  events: text("events").notNull().default("[]"),
  method: text("method").notNull().default("POST"),
  active: boolean("active").notNull().default(true),
  triggerCount: integer("trigger_count").notNull().default(0),
  lastTriggered: timestamp("last_triggered"),
  lastStatus: integer("last_status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWebhookSchema = createInsertSchema(webhooksTable).omit({ id: true, createdAt: true, triggerCount: true, lastTriggered: true, lastStatus: true });
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type Webhook = typeof webhooksTable.$inferSelect;
