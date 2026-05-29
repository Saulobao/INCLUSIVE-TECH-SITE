import { Router } from "express";
import { db } from "@workspace/db";
import { deviceTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateDeviceConfigBody } from "@workspace/api-zod";

const router = Router();

router.get("/device/status", async (req, res) => {
  try {
    const devices = await db.select().from(deviceTable).limit(1);
    if (devices.length === 0) {
      return res.status(404).json({ error: "Device not found" });
    }
    const device = devices[0];
    return res.json({
      ...device,
      createdAt: device.createdAt.toISOString(),
      updatedAt: device.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get device status");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/device/status", async (req, res) => {
  try {
    const parsed = UpdateDeviceConfigBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const devices = await db.select().from(deviceTable).limit(1);
    if (devices.length === 0) {
      return res.status(404).json({ error: "Device not found" });
    }

    const updates: Partial<typeof deviceTable.$inferInsert> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.nightModeEnabled !== undefined) updates.nightModeEnabled = parsed.data.nightModeEnabled;
    if (parsed.data.sensitivityLevel !== undefined) updates.sensitivityLevel = parsed.data.sensitivityLevel;
    if (parsed.data.streamUrl !== undefined) updates.streamUrl = parsed.data.streamUrl;
    updates.updatedAt = new Date();

    const updated = await db
      .update(deviceTable)
      .set(updates)
      .where(eq(deviceTable.id, devices[0].id))
      .returning();

    const device = updated[0];
    return res.json({
      ...device,
      createdAt: device.createdAt.toISOString(),
      updatedAt: device.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update device config");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
