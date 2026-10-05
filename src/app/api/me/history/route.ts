import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { albums, artists, listeningHistory, music } from "@/lib/db/schema";
import { apiError } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Connecte-toi pour consulter ton historique.", 401);

  const history = await db
    .select({
      listenedAt: listeningHistory.listenedAt,
      id: music.id,
      title: music.title,
      durationSeconds: music.durationSeconds,
      audioUrl: music.audioUrl,
      albumTitle: albums.title,
      coverUrl: albums.coverUrl,
      artistName: artists.name,
    })
    .from(listeningHistory)
    .innerJoin(music, eq(listeningHistory.musicId, music.id))
    .innerJoin(albums, eq(music.albumId, albums.id))
    .innerJoin(artists, eq(albums.artistId, artists.id))
    .where(eq(listeningHistory.userId, user.id))
    .orderBy(desc(listeningHistory.listenedAt))
    .limit(50);
  return NextResponse.json({ history });
}
