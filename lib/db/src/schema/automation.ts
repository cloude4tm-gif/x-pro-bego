import { pgTable, serial, text, boolean, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const automationTable = pgTable("automation_settings", {
  id: serial("id").primaryKey(),
  autoRenewEnabled: boolean("auto_renew_enabled").notNull().default(false),
  autoRenewDaysBefore: integer("auto_renew_days_before").notNull().default(3),
  autoRenewDays: integer("auto_renew_days").notNull().default(30),
  autoRenewNotify: boolean("auto_renew_notify").notNull().default(true),
  autoDeactivateEnabled: boolean("auto_deactivate_enabled").notNull().default(true),
  autoDeactivateGraceDays: integer("auto_deactivate_grace_days").notNull().default(1),
  autoDeactivateNotify: boolean("auto_deactivate_notify").notNull().default(true),
  autoDeleteAfterDays: integer("auto_delete_after_days").notNull().default(30),
  reminderEnabled: boolean("reminder_enabled").notNull().default(true),
  reminderDaysBefore: text("reminder_days_before").notNull().default("[7,3,1]"),
  reminderTemplate: text("reminder_template").notNull().default("⚠️ Sayın {username}, hesabınızın süresi {days} gün içinde dolacak."),
  suspiciousTrafficEnabled: boolean("suspicious_traffic_enabled").notNull().default(true),
  suspiciousThresholdGB: real("suspicious_threshold_gb").notNull().default(100),
  suspiciousAction: text("suspicious_action").notNull().default("notify"),
  notifyTelegram: boolean("notify_telegram").notNull().default(true),
  notifyDiscord: boolean("notify_discord").notNull().default(false),
  notifyWebhook: boolean("notify_webhook").notNull().default(true),
  notifyEmail: boolean("notify_email").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAutomationSchema = createInsertSchema(automationTable).omit({ id: true, updatedAt: true });
export type InsertAutomation = z.infer<typeof insertAutomationSchema>;
export type Automation = typeof automationTable.$inferSelect;
