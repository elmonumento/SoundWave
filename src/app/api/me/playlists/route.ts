import { and, count, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { playlistMusic, playlists } from "@/lib/db/schema";
import { apiError, readJson } from "@/lib/http";
import { z } from "zod";

const playlistSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Connecte-toi pour consulter tes playlists.", 401);

  const rows = await db
    .select({ id: playlists.id, name: playlists.name, description: playlists.description, createdAt: playlists.createdAt, trackCount: count(playlistMusic.id) })
    .from(playlists)
    .leftJoin(playlistMusic, eq(playlists.id, playlistMusic.playlistId))
    .where(eq(playlists.userId, user.id))
    .groupBy(playlists.id, playlists.name, playlists.description, playlists.createdAt)
    .orderBy(desc(playlists.createdAt));
  return NextResponse.json({ playlists: rows });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Connecte-toi pour créer une playlist.", 401);
  const parsed = playlistSchema.safeParse(await readJson(request));
  if (!parsed.success) return apiError("Choisis un nom de playlist (1 à 100 caractères).");

  const inserted = await db.insert(playlists).values({
    userId: user.id,
    name: parsed.data.name,
    description: parsed.data.description || null,
  });
  const [playlist] = await db
    .select({ id: playlists.id, name: playlists.name, description: playlists.description })
    .from(playlists)
    .where(and(eq(playlists.id, Number(inserted[0].insertId)), eq(playlists.userId, user.id)))
    .limit(1);
  return NextResponse.json({ playlist }, { status: 201 });
}
