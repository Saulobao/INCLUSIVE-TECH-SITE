import { Router } from "express";
import { db } from "@workspace/db";
import { alertTable, eventTable, deviceTable } from "@workspace/db";
import { eq, desc, and, gte, count, avg, sql } from "drizzle-orm";
import { GetActivityFeedQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/dashboard/summary", async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [devices, alertsToday, unacknowledged, critical, motion, crying, lastEvent, tempHumidity] =
      await Promise.all([
        db.select().from(deviceTable).limit(1),
        db
          .select({ count: count() })
          .from(alertTable)
          .where(gte(alertTable.createdAt, todayStart)),
        db
          .select({ count: count() })
          .from(alertTable)
          .where(eq(alertTable.acknowledged, false)),
        db
          .select({ count: count() })
          .from(alertTable)
          .where(and(eq(alertTable.severity, "critical"), gte(alertTable.createdAt, todayStart))),
        db
          .select({ count: count() })
          .from(alertTable)
          .where(and(eq(alertTable.type, "motion"), gte(alertTable.createdAt, todayStart))),
        db
          .select({ count: count() })
          .from(alertTable)
          .where(and(eq(alertTable.type, "crying"), gte(alertTable.createdAt, todayStart))),
        db.select().from(eventTable).orderBy(desc(eventTable.createdAt)).limit(1),
        db
          .select({
            avgTemp: avg(deviceTable.temperature),
            avgHumidity: avg(deviceTable.humidity),
          })
          .from(deviceTable),
      ]);

    const device = devices[0];

    return res.json({
      totalAlertsToday: alertsToday[0]?.count ?? 0,
      unacknowledgedAlerts: unacknowledged[0]?.count ?? 0,
      deviceOnline: device?.online ?? false,
      averageTemperature: parseFloat(tempHumidity[0]?.avgTemp ?? "22.5"),
      averageHumidity: parseFloat(tempHumidity[0]?.avgHumidity ?? "55"),
      lastEventAt: lastEvent[0]?.createdAt?.toISOString() ?? null,
      criticalAlerts: critical[0]?.count ?? 0,
      motionEvents: motion[0]?.count ?? 0,
      cryingEvents: crying[0]?.count ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard summary");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/activity-feed", async (req, res) => {
  try {
    const parsed = GetActivityFeedQueryParams.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query parameters" });
    }
    const limit = parsed.data.limit ?? 20;

    const [alerts, events] = await Promise.all([
      db
        .select()
        .from(alertTable)
        .orderBy(desc(alertTable.createdAt))
        .limit(limit),
      db
        .select()
        .from(eventTable)
        .orderBy(desc(eventTable.createdAt))
        .limit(limit),
    ]);

    const combined = [
      ...alerts.map((a) => ({
        id: `alert-${a.id}`,
        kind: "alert" as const,
        type: a.type,
        message: a.message,
        severity: a.severity,
        acknowledged: a.acknowledged,
        timestamp: a.createdAt.toISOString(),
      })),
      ...events.map((e) => ({
        id: `event-${e.id}`,
        kind: "event" as const,
        type: e.type,
        message: e.description,
        severity: null,
        acknowledged: null,
        timestamp: e.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return res.json(combined);
  } catch (err) {
    req.log.error({ err }, "Failed to get activity feed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/alert-stats", async (req, res) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const rows = await db
      .select({
        type: alertTable.type,
        count: count(),
      })
      .from(alertTable)
      .where(gte(alertTable.createdAt, last24h))
      .groupBy(alertTable.type);

    const labelMap: Record<string, string> = {
      motion: "Movimento",
      crying: "Choro",
      temperature: "Temperatura",
      sound: "Som",
      offline: "Offline",
      online: "Online",
    };

    return res.json(
      rows.map((r) => ({
        type: r.type,
        count: r.count,
        label: labelMap[r.type] ?? r.type,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get alert stats");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
