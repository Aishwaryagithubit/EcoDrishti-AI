import { Router } from "express";
import { db, communityPostsTable, sharedResourcesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getUserId, getUser } from "./middleware";

const router = Router();

router.get("/community/posts", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const posts = await db.select().from(communityPostsTable)
    .orderBy(desc(communityPostsTable.createdAt))
    .limit(50);

  return res.json(posts.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })));
});

router.post("/community/posts", async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { content, category, imageUrl } = req.body;
  if (!content || !category) return res.status(400).json({ error: "content and category required" });

  const ecoPointsEarned = 5;

  const [post] = await db.insert(communityPostsTable).values({
    userId: user.id,
    authorName: user.name,
    authorRole: user.role,
    content,
    category,
    imageUrl: imageUrl ?? null,
    ecoPointsEarned,
    likes: 0,
  }).returning();

  // Award eco points
  await db.update(usersTable)
    .set({ ecoPoints: user.ecoPoints + ecoPointsEarned })
    .where(eq(usersTable.id, user.id));

  return res.status(201).json({ ...post, createdAt: post.createdAt.toISOString() });
});

router.post("/community/posts/:id/like", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = parseInt(req.params.id);
  const [post] = await db.select().from(communityPostsTable).where(eq(communityPostsTable.id, id)).limit(1);
  if (!post) return res.status(404).json({ error: "Not found" });

  const [updated] = await db.update(communityPostsTable)
    .set({ likes: post.likes + 1 })
    .where(eq(communityPostsTable.id, id))
    .returning();

  return res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.get("/community/resources", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const resources = await db.select().from(sharedResourcesTable)
    .orderBy(desc(sharedResourcesTable.createdAt))
    .limit(50);

  return res.json(resources.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/community/resources", async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { title, description, resourceType, condition } = req.body;
  if (!title || !resourceType) return res.status(400).json({ error: "title and resourceType required" });

  const [resource] = await db.insert(sharedResourcesTable).values({
    userId: user.id,
    title,
    description: description ?? "",
    resourceType,
    condition: condition ?? "good",
    donorName: user.name,
    available: true,
  }).returning();

  return res.status(201).json({ ...resource, createdAt: resource.createdAt.toISOString() });
});

export default router;
