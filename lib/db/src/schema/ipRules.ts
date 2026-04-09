import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ipRulesTable = pgTable("ip_rules", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  ip: text("ip").notNull(),
  reason: text("reason").notNull().default(""),
  country: text("country"),
  addedBy: text("added_by").notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertIpRuleSchema = createInsertSchema(ipRulesTable).omit({ id: true, createdAt: true });
export type InsertIpRule = z.infer<typeof insertIpRuleSchema>;
export type IpRule = typeof ipRulesTable.$inferSelect;
