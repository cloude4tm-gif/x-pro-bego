import { pgTable, serial, jsonb, timestamp } from "drizzle-orm/pg-core";

export const xrayConfigTable = pgTable("xray_config", {
  id: serial("id").primaryKey(),
  configJson: jsonb("config_json").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type XrayConfig = typeof xrayConfigTable.$inferSelect;
