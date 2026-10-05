import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listeningHistory, music } from "@/lib/db/schema";
import { apiError } from "@/lib/http";
import { eq } from "drizzle-orm";

export async function POST(_request: Request, context: { params: Promise<{ musicId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Connecte-toi pour enregistrer ton écoute.", 401);
  const musicId = Number((await context.params).musicId);
  if (!Number.isSafeInteger(musicId) || musicId <= 0) return apiError("Titre invalide.");
  const [track] = await db.select({ id: music.id }).from(music).where(eq(music.id, musicId)).limit(1);
  if (!track) return apiError("Titre introuvable.", 404);
  await db.insert(listeningHistory).values({ userId: user.id, musicId });
  return NextResponse.json({ ok: true }, { status: 201 });
}
