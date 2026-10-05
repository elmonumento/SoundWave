import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { apiError, readJson } from "@/lib/http";

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(72),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) return apiError("Adresse e-mail ou mot de passe invalide.");

  const email = parsed.data.email.trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return apiError("Adresse e-mail ou mot de passe incorrect.", 401);
  }

  await createSession(user.id);
  return NextResponse.json({
    user: { id: user.id, displayName: user.displayName, email: user.email },
  });
}
