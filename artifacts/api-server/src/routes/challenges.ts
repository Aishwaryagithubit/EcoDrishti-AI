import { Router } from "express";
import { db, challengesTable, userChallengesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getUserId, getUser } from "./middleware";

const router = Router();

router.get("/challenges", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const challenges = await db.select().from(challengesTable);
  const userChallenges = await db.select().from(userChallengesTable)
    .where(eq(userChallengesTable.userId, userId));

  const ucMap = new Map(userChallenges.map(uc => [uc.challengeId, uc]));

  return res.json(challenges.map(c => ({
    ...c,
    isJoined: ucMap.has(c.id),
    isCompleted: ucMap.get(c.id)?.isCompleted === 1,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
  })));
});

router.post("/challenges/:id/join", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = parseInt(req.params.id);
  const [challenge] = await db.select().from(challengesTable).where(eq(challengesTable.id, id)).limit(1);
  if (!challenge) return res.status(404).json({ error: "Not found" });

  const existing = await db.select().from(userChallengesTable)
    .where(and(eq(userChallengesTable.userId, userId), eq(userChallengesTable.challengeId, id)));

  if (existing.length === 0) {
    await db.insert(userChallengesTable).values({ userId, challengeId: id, isCompleted: 0 });
    await db.update(challengesTable)
      .set({ participantCount: challenge.participantCount + 1 })
      .where(eq(challengesTable.id, id));
  }

  const [updated] = await db.select().from(challengesTable).where(eq(challengesTable.id, id));
  return res.json({ ...updated, isJoined: true, isCompleted: false, startDate: updated.startDate.toISOString(), endDate: updated.endDate.toISOString() });
});

router.post("/challenges/:id/complete", async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const id = parseInt(req.params.id);
  const [challenge] = await db.select().from(challengesTable).where(eq(challengesTable.id, id)).limit(1);
  if (!challenge) return res.status(404).json({ error: "Not found" });

  await db.update(userChallengesTable)
    .set({ isCompleted: 1, completedAt: new Date() })
    .where(and(eq(userChallengesTable.userId, user.id), eq(userChallengesTable.challengeId, id)));

  await db.update(challengesTable)
    .set({ co2AvoidedKg: challenge.co2AvoidedKg + 10 })
    .where(eq(challengesTable.id, id));

  // Award points
  await db.update(usersTable)
    .set({ ecoPoints: user.ecoPoints + challenge.ecoPointsReward })
    .where(eq(usersTable.id, user.id));

  const [updated] = await db.select().from(challengesTable).where(eq(challengesTable.id, id));
  return res.json({ ...updated, isJoined: true, isCompleted: true, startDate: updated.startDate.toISOString(), endDate: updated.endDate.toISOString() });
});

export default router;
