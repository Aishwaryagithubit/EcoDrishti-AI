import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const challengesTable = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleNp: text("title_np").notNull(),
  description: text("description").notNull(),
  descriptionNp: text("description_np").notNull(),
  category: text("category").notNull().default("general"),
  durationDays: integer("duration_days").notNull().default(7),
  ecoPointsReward: integer("eco_points_reward").notNull().default(50),
  participantCount: integer("participant_count").notNull().default(0),
  co2AvoidedKg: real("co2_avoided_kg").notNull().default(0),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userChallengesTable = pgTable("user_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  challengeId: integer("challenge_id").notNull(),
  isCompleted: integer("is_completed").notNull().default(0),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertChallengeSchema = createInsertSchema(challengesTable).omit({ id: true, createdAt: true });
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challengesTable.$inferSelect;
export type UserChallenge = typeof userChallengesTable.$inferSelect;
