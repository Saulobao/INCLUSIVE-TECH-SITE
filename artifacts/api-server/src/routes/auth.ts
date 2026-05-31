import { Router } from "express";
import { db } from "@workspace/db";
import { userTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router = Router();

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username || !password) {
      return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
    }

    const users = await db.select().from(userTable).where(eq(userTable.username, username.trim())).limit(1);
    if (users.length === 0) {
      return res.status(401).json({ error: "Usuário ou senha incorretos" });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Usuário ou senha incorretos" });
    }

    (req as any).session.userId = user.id;
    (req as any).session.username = user.username;

    req.log.info({ userId: user.id }, "User logged in");
    return res.json({ ok: true, user: { id: user.id, username: user.username, displayName: user.displayName } });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    return res.status(500).json({ error: "Erro interno" });
  }
});

// POST /auth/logout
router.post("/auth/logout", (req, res) => {
  (req as any).session.destroy(() => {
    res.json({ ok: true });
  });
});

// GET /auth/me — verifica se está autenticado
router.get("/auth/me", (req, res) => {
  const session = (req as any).session;
  if (!session?.userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  return res.json({ ok: true, user: { id: session.userId, username: session.username } });
});

export default router;
