import { Router } from "express";
import { db, leagueSchoolsTable, usersTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { getUserId, getUser } from "./middleware";

const router = Router();

router.get("/league/rankings", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await getUser(req);
  const rankings = await db.select().from(leagueSchoolsTable).orderBy(asc(leagueSchoolsTable.rank));

  return res.json(rankings.map(s => ({
    ...s,
    isCurrentSchool: s.schoolName === user?.schoolName,
    updatedAt: s.updatedAt.toISOString(),
  })));
});

router.get("/league/my-school", async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const [mySchool] = await db.select().from(leagueSchoolsTable)
    .where(eq(leagueSchoolsTable.schoolName, user.schoolName)).limit(1);

  if (!mySchool) {
    // Return default entry
    const all = await db.select().from(leagueSchoolsTable).orderBy(asc(leagueSchoolsTable.rank));
    return res.json({
      id: 0,
      schoolName: user.schoolName,
      rank: all.length + 1,
      sustainabilityScore: 0,
      carbonReductionPercent: 0,
      participationRate: 0,
      challengeCompletionRate: 0,
      dataConfidenceScore: 0,
      tier: "Climate Starter",
      schoolType: "government",
      location: "Nepal",
      isCurrentSchool: true,
    });
  }

  return res.json({ ...mySchool, isCurrentSchool: true, updatedAt: mySchool.updatedAt.toISOString() });
});

export default router;
