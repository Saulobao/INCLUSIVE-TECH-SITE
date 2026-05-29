import { Router } from "express";
import { db } from "@workspace/db";
import { alertTable } from "@workspace/db";
import { eq, desc, and, isNull } from "drizzle-orm";
import { ListAlertsQueryParams, AcknowledgeAlertParams } from "@workspace/api-zod";

const router = Router();

router.get("/alerts", async (req, res) => {
  try {
    const parsed = ListAlertsQueryParams.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query parameters" });
    }

    const { limit = 50, offset = 0, type, acknowledged } = parsed.data;

    const conditions = [];
    if (type) conditions.push(eq(alertTable.type, type));
    if (acknowledged !== undefined) conditions.push(eq(alertTable.acknowledged, acknowledged));

    const rows = await db
      .select()
      .from(alertTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(alertTable.createdAt))
      .limit(limit)
      .offset(offset);

    return res.json(
      rows.map((a) => ({
        ...a,
        acknowledgedAt: a.acknowledgedAt ? a.acknowledgedAt.toISOString() : null,
        createdAt: a.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list alerts");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/alerts/acknowledge-all", async (req, res) => {
  // This route must be registered before /alerts/:id
  res.status(405).json({ error: "Method not allowed" });
});

router.post("/alerts/acknowledge-all", async (req, res) => {
  try {
    const now = new Date();
    const updated = await db
      .update(alertTable)
      .set({ acknowledged: true, acknowledgedAt: now })
      .where(eq(alertTable.acknowledged, false))
      .returning();

    return res.json({ count: updated.length });
  } catch (err) {
    req.log.error({ err }, "Failed to acknowledge all alerts");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/alerts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const rows = await db.select().from(alertTable).where(eq(alertTable.id, id)).limit(1);
    if (rows.length === 0) return res.status(404).json({ error: "Alert not found" });

    const a = rows[0];
    return res.json({
      ...a,
      acknowledgedAt: a.acknowledgedAt ? a.acknowledgedAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get alert");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/alerts/:id/acknowledge", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const now = new Date();
    const updated = await db
      .update(alertTable)
      .set({ acknowledged: true, acknowledgedAt: now })
      .where(eq(alertTable.id, id))
      .returning();

    if (updated.length === 0) return res.status(404).json({ error: "Alert not found" });

    const a = updated[0];
    return res.json({
      ...a,
      acknowledgedAt: a.acknowledgedAt ? a.acknowledgedAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to acknowledge alert");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
