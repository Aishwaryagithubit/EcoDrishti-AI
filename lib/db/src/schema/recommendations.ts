import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recommendationsTable = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  submissionId: integer("submission_id"),
  category: text("category").notNull(),
  title: text("title").notNull(),
  titleNp: text("title_np").notNull(),
  description: text("description").notNull(),
  descriptionNp: text("description_np").notNull(),
  estimatedCarbonReductionKg: real("estimated_carbon_reduction_kg").notNull().default(0),
  difficulty: text("difficulty").notNull().default("medium"),
  impact: text("impact").notNull().default("medium"),
  timeline: text("timeline").notNull().default("1 month"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRecommendationSchema = createInsertSchema(recommendationsTable).omit({ id: true, createdAt: true });
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendationsTable.$inferSelect;
