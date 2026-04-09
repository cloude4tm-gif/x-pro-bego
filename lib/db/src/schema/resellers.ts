import { pgTable, serial, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resellersTable = pgTable("resellers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().default(""),
  role: text("role").notNull().default("reseller"),
  parent: text("parent"),
  balance: real("balance").notNull().default(0),
  usersCreated: integer("users_created").notNull().default(0),
  usersLimit: integer("users_limit").notNull().default(50),
  commissionRate: real("commission_rate").notNull().default(15),
  totalEarned: real("total_earned").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertResellerSchema = createInsertSchema(resellersTable).omit({ id: true, createdAt: true });
export type InsertReseller = z.infer<typeof insertResellerSchema>;
export type Reseller = typeof resellersTable.$inferSelect;
