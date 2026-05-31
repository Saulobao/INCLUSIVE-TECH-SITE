import { Request, Response, NextFunction } from "express";

// Routes that the ESP32 uses (protected by API key, not session)
const ESP32_PATHS = ["/api/esp32/"];
// Public routes (no auth needed)
const PUBLIC_PATHS = ["/api/auth/login", "/api/healthz"];

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const path = req.path;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => path.startsWith(p))) return next();

  // Allow ESP32 endpoints (they use x-api-key instead)
  if (ESP32_PATHS.some((p) => path.startsWith(p))) return next();

  // Check session
  const session = (req as any).session;
  if (session?.userId) return next();

  return res.status(401).json({ error: "Não autenticado" });
}
