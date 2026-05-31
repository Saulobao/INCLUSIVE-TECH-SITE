import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const ESP32_PATHS = ["/api/esp32/"];
const PUBLIC_PATHS = ["/api/auth/login", "/api/healthz"];
const JWT_SECRET = process.env.JWT_SECRET ?? "babywatch-jwt-secret";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const path = req.path;

  if (PUBLIC_PATHS.some((p) => path.startsWith(p))) return next();
  if (ESP32_PATHS.some((p) => path.startsWith(p))) return next();

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as {
        id: number;
        username: string;
      };
      (req as any).tokenUser = { id: payload.id, username: payload.username };
      return next();
    } catch {
      // token inválido
    }
  }

  return res.status(401).json({ error: "Não autenticado" });
}
