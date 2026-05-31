// Run once: npx tsx seed-admin.ts
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { userTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const DEFAULT_USER = "admin";
const DEFAULT_PASS = "babywatch123";

async function main() {
  const existing = await db.select().from(userTable).where(eq(userTable.username, DEFAULT_USER));
  if (existing.length > 0) {
    console.log("Usuário admin já existe.");
    process.exit(0);
  }
  const hash = await bcrypt.hash(DEFAULT_PASS, 12);
  await db.insert(userTable).values({
    username: DEFAULT_USER,
    passwordHash: hash,
    displayName: "Administrador",
  });
  console.log(`Usuário criado: ${DEFAULT_USER} / ${DEFAULT_PASS}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
