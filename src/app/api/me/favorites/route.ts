import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { albums, artists, favoriteMusic, music } from "@/lib/db/schema";
import { apiError, readJson } from "@/lib/http";
import { z } from "zod";

const favoriteSchema = z.object({ musicId: z.number().int().positive() });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Connecte-toi pour consulter tes favoris.", 401);

  const tracks = await db
    .select({
      id: music.id,
      title: music.title,
      durationSeconds: music.durationSeconds,
      audioUrl: music.audioUrl,
      albumTitle: albums.title,
      coverUrl: albums.coverUrl,
      artistName: artists.name,
    })
    .from(favoriteMusic)
    .innerJoin(music, eq(favoriteMusic.musicId, music.id))
    .innerJoin(albums, eq(music.albumId, albums.id))
    .innerJoin(artists, eq(albums.artistId, artists.id))
    .where(eq(favoriteMusic.userId, user.id));
  return NextResponse.json({ tracks });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Connecte-toi pour ajouter un favori.", 401);
  const parsed = favoriteSchema.safeParse(await readJson(request));
  if (!parsed.success) return apiError("Titre invalide.");
  await db
    .insert(favoriteMusic)
    .values({ userId: user.id, musicId: parsed.data.musicId })
    .onDuplicateKeyUpdate({ set: { userId: user.id } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Connecte-toi pour modifier tes favoris.", 401);
  const id = Number(new URL(request.url).searchParams.get("musicId"));
  if (!Number.isSafeInteger(id) || id <= 0) return apiError("Titre invalide.");
  await db
    .delete(favoriteMusic)
    .where(and(eq(favoriteMusic.userId, user.id), eq(favoriteMusic.musicId, id)));
  return NextResponse.json({ ok: true });
}
