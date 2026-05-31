import { Router } from "express";
import { db } from "@workspace/db";
import { deviceTable, alertTable, eventTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const ALERT_TYPES = ["motion", "crying", "temperature", "sound", "offline", "online"] as const;
const SEVERITIES = ["low", "medium", "high", "critical"] as const;
const EVENT_TYPES = [
  "motion_detected", "baby_crying", "temperature_alert",
  "device_online", "device_offline", "night_mode_on",
  "night_mode_off", "sound_detected",
] as const;

// ── Simple API key auth ───────────────────────────────────────────────────────
function requireApiKey(req: any, res: any, next: any) {
  const apiKey = process.env.ESP32_API_KEY;
  if (!apiKey) return next(); // key not configured → open (dev mode)
  const provided = (req.headers["x-api-key"] as string) ?? (req.query.api_key as string);
  if (provided !== apiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ── POST /esp32/telemetry ─────────────────────────────────────────────────────
// ESP32 calls this periodically (e.g. every 10-30s) to push sensor readings.
// Body: { temperature?, humidity?, wifiSignal?, online?, streamUrl? }
router.post("/esp32/telemetry", requireApiKey, async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const devices = await db.select().from(deviceTable).limit(1);
    if (devices.length === 0) {
      return res.status(404).json({ error: "Device not found in database" });
    }

    const updates: Partial<typeof deviceTable.$inferInsert> = { updatedAt: new Date() };
    if (typeof body.temperature === "number") updates.temperature = body.temperature;
    if (typeof body.humidity === "number") updates.humidity = body.humidity;
    if (typeof body.wifiSignal === "number") updates.wifiSignal = Math.round(body.wifiSignal);
    if (typeof body.online === "boolean") updates.online = body.online;
    if (typeof body.streamUrl === "string") updates.streamUrl = body.streamUrl;

    const updated = await db
      .update(deviceTable)
      .set(updates)
      .where(eq(deviceTable.id, devices[0].id))
      .returning();

    const device = updated[0];
    req.log.info({ deviceId: device.id }, "ESP32 telemetry received");

    return res.json({
      ok: true,
      device: {
        ...device,
        createdAt: device.createdAt.toISOString(),
        updatedAt: device.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to process telemetry");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /esp32/alert ─────────────────────────────────────────────────────────
// ESP32 calls this when AI detects motion, crying, temperature spike, etc.
// Body: { type, severity?, message, confidence? }
router.post("/esp32/alert", requireApiKey, async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;

    if (!body.type || !ALERT_TYPES.includes(body.type as any)) {
      return res.status(400).json({ error: `Field 'type' must be one of: ${ALERT_TYPES.join(", ")}` });
    }
    if (!body.message || typeof body.message !== "string") {
      return res.status(400).json({ error: "Field 'message' is required (string)" });
    }
    const severity = (SEVERITIES.includes(body.severity as any) ? body.severity : "low") as string;
    const confidence = typeof body.confidence === "number" ? body.confidence : null;

    const inserted = await db
      .insert(alertTable)
      .values({
        type: body.type as string,
        severity,
        message: body.message as string,
        confidence,
        acknowledged: false,
      })
      .returning();

    const alert = inserted[0];
    req.log.info({ alertId: alert.id, type: alert.type }, "ESP32 alert received");

    return res.status(201).json({
      ok: true,
      alert: {
        ...alert,
        acknowledgedAt: null,
        createdAt: alert.createdAt.toISOString(),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create alert from ESP32");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /esp32/event ─────────────────────────────────────────────────────────
// ESP32 calls this to log a lifecycle event.
// Body: { type, description, metadata? }
router.post("/esp32/event", requireApiKey, async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;

    if (!body.type || !EVENT_TYPES.includes(body.type as any)) {
      return res.status(400).json({ error: `Field 'type' must be one of: ${EVENT_TYPES.join(", ")}` });
    }
    if (!body.description || typeof body.description !== "string") {
      return res.status(400).json({ error: "Field 'description' is required (string)" });
    }
    const metadata =
      body.metadata && typeof body.metadata === "object"
        ? JSON.stringify(body.metadata)
        : null;

    const inserted = await db
      .insert(eventTable)
      .values({
        type: body.type as string,
        description: body.description as string,
        metadata,
      })
      .returning();

    const event = inserted[0];
    req.log.info({ eventId: event.id, type: event.type }, "ESP32 event received");

    return res.status(201).json({
      ok: true,
      event: {
        ...event,
        createdAt: event.createdAt.toISOString(),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create event from ESP32");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /esp32/config ─────────────────────────────────────────────────────────
// ESP32 polls this to read its own configuration (sensitivity, night mode, etc).
router.get("/esp32/config", requireApiKey, async (req, res) => {
  try {
    const devices = await db.select().from(deviceTable).limit(1);
    if (devices.length === 0) {
      return res.status(404).json({ error: "Device not found" });
    }
    const device = devices[0];
    return res.json({
      ok: true,
      config: {
        sensitivityLevel: device.sensitivityLevel,
        nightModeEnabled: device.nightModeEnabled,
        name: device.name,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get ESP32 config");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
