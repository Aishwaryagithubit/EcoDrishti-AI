import { Router } from "express";
import { db, carbonSubmissionsTable, challengesTable, userChallengesTable, usersTable, leagueSchoolsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { getUserId } from "./middleware";

const router = Router();

router.get("/dashboard/summary", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const submissions = await db.select().from(carbonSubmissionsTable)
    .where(eq(carbonSubmissionsTable.userId, userId))
    .orderBy(desc(carbonSubmissionsTable.createdAt))
    .limit(2);

  const latest = submissions[0];
  const previous = submissions[1];

  const completedChallenges = await db.select().from(userChallengesTable)
    .where(and(eq(userChallengesTable.userId, userId), eq(userChallengesTable.isCompleted, 1)));

  const allSchools = await db.select().from(leagueSchoolsTable).orderBy(leagueSchoolsTable.rank);

  const mySchool = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const schoolName = mySchool[0]?.schoolName ?? "";
  const leagueEntry = allSchools.find(s => s.schoolName === schoolName);

  const carbonReductionPercent = latest && previous && previous.totalEmissionsKg > 0
    ? ((previous.totalEmissionsKg - latest.totalEmissionsKg) / previous.totalEmissionsKg) * 100
    : 0;

  return res.json({
    totalEmissionsKg: latest?.totalEmissionsKg ?? 0,
    sustainabilityScore: latest?.sustainabilityScore ?? 0,
    activeStudents: latest?.studentCount ?? 0,
    challengesCompleted: completedChallenges.length,
    carbonReductionPercent: Math.round(carbonReductionPercent * 10) / 10,
    dataConfidenceScore: latest?.dataConfidenceScore ?? 0,
    ecoLeagueRank: leagueEntry?.rank ?? allSchools.length + 1,
    totalSchools: allSchools.length,
    transportEmissionsKg: latest?.transportEmissionsKg ?? 0,
    electricityEmissionsKg: latest?.electricityEmissionsKg ?? 0,
    waterEmissionsKg: latest?.waterEmissionsKg ?? 0,
    wasteEmissionsKg: latest?.wasteEmissionsKg ?? 0,
  });
});

router.get("/dashboard/emissions-trend", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const submissions = await db.select().from(carbonSubmissionsTable)
    .where(eq(carbonSubmissionsTable.userId, userId))
    .orderBy(carbonSubmissionsTable.year, carbonSubmissionsTable.month)
    .limit(12);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return res.json(submissions.map(s => ({
    month: MONTHS[s.month - 1],
    year: s.year,
    totalKg: s.totalEmissionsKg,
    transportKg: s.transportEmissionsKg,
    electricityKg: s.electricityEmissionsKg,
    waterKg: s.waterEmissionsKg,
    wasteKg: s.wasteEmissionsKg,
  })));
});

router.get("/dashboard/category-breakdown", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [latest] = await db.select().from(carbonSubmissionsTable)
    .where(eq(carbonSubmissionsTable.userId, userId))
    .orderBy(desc(carbonSubmissionsTable.createdAt))
    .limit(1);

  if (!latest) return res.json([]);

  const total = latest.totalEmissionsKg || 1;
  return res.json([
    { category: "Transport", emissionsKg: latest.transportEmissionsKg, percentage: Math.round((latest.transportEmissionsKg / total) * 100), color: "#059669" },
    { category: "Electricity", emissionsKg: latest.electricityEmissionsKg, percentage: Math.round((latest.electricityEmissionsKg / total) * 100), color: "#0d9488" },
    { category: "Water", emissionsKg: latest.waterEmissionsKg, percentage: Math.round((latest.waterEmissionsKg / total) * 100), color: "#3b82f6" },
    { category: "Waste", emissionsKg: latest.wasteEmissionsKg, percentage: Math.round((latest.wasteEmissionsKg / total) * 100), color: "#8b5cf6" },
  ]);
});

export default router;
