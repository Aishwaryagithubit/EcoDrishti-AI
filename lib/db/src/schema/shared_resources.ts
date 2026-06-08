import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sharedResourcesTable = pgTable("shared_resources", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  resourceType: text("resource_type").notNull(),
  condition: text("condition").notNull().default("good"),
  donorName: text("donor_name").notNull(),
  available: boolean("available").notNull().default(true),
  requestedBy: text("requested_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSharedResourceSchema = createInsertSchema(sharedResourcesTable).omit({ id: true, createdAt: true });
export type InsertSharedResource = z.infer<typeof insertSharedResourceSchema>;
export type SharedResource = typeof sharedResourcesTable.$inferSelect;
