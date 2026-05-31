import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { userTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const ESP32_PATHS = ["/api/esp32/"];
const PUBLIC_PATHS = ["/api/auth/login", "/api/healthz"];

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const path = req.path;

  if (PUBLIC_PATHS.some((p) => path.startsWith(p))) return next();
  if (ESP32_PATHS.some((p) => path.startsWith(p))) return next();

  // Tenta sessão primeiro
  const session = (req as any).session;
  if (session?.userId) return next();

  // Tenta token no header Authorization
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const users = await db.select().from(userTable).where(eq(userTable.sessionToken as any, token)).limit(1);
      if (users.length > 0) {
        (req as any).tokenUser = { id: users[0].id, username: users[0].username };
        return next();
      }
    } catch {
      // token inválido
    }
  }

  return res.status(401).json({ error: "Não autenticado" });
}