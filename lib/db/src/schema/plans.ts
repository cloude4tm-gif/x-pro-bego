import { pgTable, serial, text, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const plansTable = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("⭐"),
  color: text("color").notNull().default("blue"),
  price: real("price").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  dataLimitGB: integer("data_limit_gb").notNull().default(0),
  durationDays: integer("duration_days").notNull().default(30),
  userLimit: integer("user_limit").notNull().default(1),
  description: text("description").notNull().default(""),
  popular: boolean("popular").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPlanSchema = createInsertSchema(plansTable).omit({ id: true, createdAt: true });
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plansTable.$inferSelect;
