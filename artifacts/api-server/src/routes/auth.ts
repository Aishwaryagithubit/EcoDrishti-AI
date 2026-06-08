import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import * as crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "eco_salt_2025").digest("hex");
}

function generateToken(userId: number, email: string): string {
  return Buffer.from(`${userId}:${email}:${Date.now()}`).toString("base64");
}

function userToDto(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    schoolName: user.schoolName,
    role: user.role,
    ecoPoints: user.ecoPoints,
    badge: user.badge,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res) => {
  const parse = RegisterBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });

  const { name, email, password, schoolName, role } = parse.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) return res.status(400).json({ error: "Email already registered" });

  const [user] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash: hashPassword(password),
    schoolName,
    role,
    ecoPoints: 0,
    badge: null,
  }).returning();

  const token = generateToken(user.id, user.email);
  return res.status(201).json({ user: userToDto(user), token });
});

router.post("/auth/login", async (req, res) => {
  const parse = LoginBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });

  const { email, password } = parse.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = generateToken(user.id, user.email);
  return res.json({ user: userToDto(user), token });
});

router.post("/auth/logout", (_req, res) => {
  return res.json({ success: true });
});

router.get("/auth/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = Buffer.from(auth.slice(7), "base64").toString();
    const userId = parseInt(decoded.split(":")[0]);
    if (isNaN(userId)) return res.status(401).json({ error: "Invalid token" });

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return res.status(401).json({ error: "User not found" });

    return res.json(userToDto(user));
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
