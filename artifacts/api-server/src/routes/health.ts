import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { userTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/setup-admin", async (_req, res) => {
  const existing = await db
    .select()
    .from(userTable)
    .where(eq(userTable.username, "admin"));
  if (existing.length > 0) {
    return res.json({ ok: true, message: "Admin já existe" });
  }
  const hash = await bcrypt.hash("babywatch123", 12);
  await db.insert(userTable).values({
    username: "admin",
    passwordHash: hash,
    displayName: "Administrador",
  });
  return res.json({ ok: true, message: "Admin criado com sucesso!" });
});

export default router;
