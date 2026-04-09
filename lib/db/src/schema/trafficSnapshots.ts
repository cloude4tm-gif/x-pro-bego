import { pgTable, serial, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trafficSnapshotsTable = pgTable("traffic_snapshots", {
  id: serial("id").primaryKey(),
  uploadBytes: real("upload_bytes").notNull().default(0),
  downloadBytes: real("download_bytes").notNull().default(0),
  activeUsers: integer("active_users").notNull().default(0),
  totalUsers: integer("total_users").notNull().default(0),
  cpuUsage: real("cpu_usage").notNull().default(0),
  memUsage: real("mem_usage").notNull().default(0),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

export const insertSnapshotSchema = createInsertSchema(trafficSnapshotsTable).omit({ id: true, recordedAt: true });
export type InsertSnapshot = z.infer<typeof insertSnapshotSchema>;
export type TrafficSnapshot = typeof trafficSnapshotsTable.$inferSelect;
