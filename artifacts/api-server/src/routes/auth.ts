import { Router } from "express";
import { db } from "@workspace/db";
import { userTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? "babywatch-jwt-secret";

router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body as {
      username?: string;
      password?: string;
    };
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Usuário e senha são obrigatórios" });
    }
    const users = await db
      .select()
      .from(userTable)
      .where(eq(userTable.username, username.trim()))
      .limit(1);
    if (users.length === 0) {
      return res.status(401).json({ error: "Usuário ou senha incorretos" });
    }
    const user = users[0];
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Usuário ou senha incorretos" });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" },
    );
    return res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    return res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/auth/logout", (req, res) => {
  res.json({ ok: true });
});

router.get("/auth/me", (req, res) => {
  const me = (req as any).tokenUser;
  if (!me) return res.status(401).json({ error: "Não autenticado" });
  return res.json({ ok: true, user: me });
});

export default router;
