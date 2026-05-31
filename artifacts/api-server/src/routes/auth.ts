import { Router } from "express";
import { db } from "@workspace/db";
import { userTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";
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

// GET /auth/me
router.get("/auth/me", (req, res) => {
  const session = (req as any).session;
  if (!session?.userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  return res.json({ ok: true, user: { id: session.userId, username: session.username } });
});

// PUT /auth/change-password — troca a senha do usuário logado
router.put("/auth/change-password", async (req, res) => {
  const session = (req as any).session;
  if (!session?.userId) return res.status(401).json({ error: "Não autenticado" });

  try {
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "A nova senha deve ter ao menos 6 caracteres" });
    }

    const users = await db.select().from(userTable).where(eq(userTable.id, session.userId)).limit(1);
    if (users.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });

    const valid = await bcrypt.compare(currentPassword, users[0].passwordHash);
    if (!valid) return res.status(401).json({ error: "Senha atual incorreta" });

    const hash = await bcrypt.hash(newPassword, 12);
    await db.update(userTable).set({ passwordHash: hash }).where(eq(userTable.id, session.userId));

    req.log.info({ userId: session.userId }, "Password changed");
    return res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Change password failed");
    return res.status(500).json({ error: "Erro interno" });
  }
});

// GET /users — lista todos os usuários
router.get("/users", async (req, res) => {
  const session = (req as any).session;
  if (!session?.userId) return res.status(401).json({ error: "Não autenticado" });

  try {
    const users = await db
      .select({ id: userTable.id, username: userTable.username, displayName: userTable.displayName, createdAt: userTable.createdAt })
      .from(userTable)
      .orderBy(userTable.createdAt);

    return res.json({ ok: true, users: users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })) });
  } catch (err) {
    req.log.error({ err }, "List users failed");
    return res.status(500).json({ error: "Erro interno" });
  }
});

// POST /users — cria novo usuário
router.post("/users", async (req, res) => {
  const session = (req as any).session;
  if (!session?.userId) return res.status(401).json({ error: "Não autenticado" });

  try {
    const { username, password, displayName } = req.body as { username?: string; password?: string; displayName?: string };
    if (!username || !password) {
      return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "A senha deve ter ao menos 6 caracteres" });
    }
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!clean) return res.status(400).json({ error: "Nome de usuário inválido" });

    const existing = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.username, clean)).limit(1);
    if (existing.length > 0) return res.status(409).json({ error: "Esse usuário já existe" });

    const hash = await bcrypt.hash(password, 12);
    const inserted = await db.insert(userTable).values({
      username: clean,
      passwordHash: hash,
      displayName: displayName?.trim() || null,
    }).returning({ id: userTable.id, username: userTable.username, displayName: userTable.displayName, createdAt: userTable.createdAt });

    req.log.info({ newUserId: inserted[0].id }, "User created");
    return res.status(201).json({ ok: true, user: { ...inserted[0], createdAt: inserted[0].createdAt.toISOString() } });
  } catch (err) {
    req.log.error({ err }, "Create user failed");
    return res.status(500).json({ error: "Erro interno" });
  }
});

// DELETE /users/:id — remove um usuário (não pode remover a si mesmo)
router.delete("/users/:id", async (req, res) => {
  const session = (req as any).session;
  if (!session?.userId) return res.status(401).json({ error: "Não autenticado" });

  const targetId = Number(req.params.id);
  if (isNaN(targetId)) return res.status(400).json({ error: "ID inválido" });
  if (targetId === session.userId) return res.status(400).json({ error: "Você não pode remover seu próprio usuário" });

  try {
    const deleted = await db.delete(userTable).where(eq(userTable.id, targetId)).returning({ id: userTable.id });
    if (deleted.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });

    req.log.info({ deletedUserId: targetId }, "User deleted");
    return res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Delete user failed");
    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
