import { Router } from "express";
import { db } from "@workspace/db";
import { eventTable } from "@workspace/db";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { ListEventsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/events", async (req, res) => {
  try {
    const parsed = ListEventsQueryParams.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query parameters" });
    }

    const { limit = 100, offset = 0, type, from, to } = parsed.data;

    const conditions = [];
    if (type) conditions.push(eq(eventTable.type, type));
    if (from) conditions.push(gte(eventTable.createdAt, new Date(from)));
    if (to) conditions.push(lte(eventTable.createdAt, new Date(to)));

    const rows = await db
      .select()
      .from(eventTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(eventTable.createdAt))
      .limit(limit)
      .offset(offset);

    return res.json(
      rows.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list events");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
