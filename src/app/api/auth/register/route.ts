import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { apiError, readJson } from "@/lib/http";

const registerSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Vérifie les champs saisis.");
  }

  const displayName = parsed.data.displayName;
  const email = parsed.data.email.trim().toLowerCase();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return apiError("Cette adresse e-mail possède déjà un compte.", 409);

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const inserted = await db.insert(users).values({ displayName, email, passwordHash });
  const userId = Number(inserted[0].insertId);
  await createSession(userId);

  return NextResponse.json({ user: { id: userId, displayName, email } }, { status: 201 });
}
