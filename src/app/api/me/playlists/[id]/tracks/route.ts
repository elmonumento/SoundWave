import { and, asc, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { albums, artists, music, playlistMusic, playlists } from "@/lib/db/schema";
import { apiError, readJson } from "@/lib/http";
import { z } from "zod";

const addTrackSchema = z.object({ musicId: z.number().int().positive() });

async function ownedPlaylist(id: number, userId: number) {
  const [playlist] = await db
    .select({ id: playlists.id })
    .from(playlists)
    .where(and(eq(playlists.id, id), eq(playlists.userId, userId)))
    .limit(1);
  return playlist;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Connecte-toi pour consulter ta playlist.", 401);
  const id = Number((await context.params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return apiError("Playlist introuvable.", 404);
  const playlist = await ownedPlaylist(id, user.id);
  if (!playlist) return apiError("Playlist introuvable.", 404);

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
    .from(playlistMusic)
    .innerJoin(music, eq(playlistMusic.musicId, music.id))
    .innerJoin(albums, eq(music.albumId, albums.id))
    .innerJoin(artists, eq(albums.artistId, artists.id))
    .where(eq(playlistMusic.playlistId, id))
    .orderBy(asc(playlistMusic.position));
  return NextResponse.json({ tracks });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Connecte-toi pour modifier ta playlist.", 401);
  const id = Number((await context.params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return apiError("Playlist introuvable.", 404);
  const playlist = await ownedPlaylist(id, user.id);
  if (!playlist) return apiError("Playlist introuvable.", 404);
  const parsed = addTrackSchema.safeParse(await readJson(request));
  if (!parsed.success) return apiError("Titre invalide.");

  const [existing] = await db
    .select({ id: playlistMusic.id })
    .from(playlistMusic)
    .where(and(eq(playlistMusic.playlistId, id), eq(playlistMusic.musicId, parsed.data.musicId)))
    .limit(1);
  if (existing) return NextResponse.json({ ok: true });

  const [last] = await db
    .select({ position: playlistMusic.position })
    .from(playlistMusic)
    .where(eq(playlistMusic.playlistId, id))
    .orderBy(desc(playlistMusic.position))
    .limit(1);

  const lastPosition = last?.position ?? -1;
  const inserted = await db.insert(playlistMusic).values({
    playlistId: id,
    musicId: parsed.data.musicId,
    position: lastPosition + 1,
  });
  return NextResponse.json({ ok: true, id: Number(inserted[0].insertId) }, { status: 201 });
}
