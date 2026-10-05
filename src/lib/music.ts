import { desc, eq, like, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { albums, artists, music } from "@/lib/db/schema";

export async function getTracks(query?: string) {
  const search = query?.trim();
  const rows = await db
    .select({
      id: music.id,
      title: music.title,
      durationSeconds: music.durationSeconds,
      audioUrl: music.audioUrl,
      albumId: albums.id,
      albumTitle: albums.title,
      coverUrl: albums.coverUrl,
      artistId: artists.id,
      artistName: artists.name,
    })
    .from(music)
    .innerJoin(albums, eq(music.albumId, albums.id))
    .innerJoin(artists, eq(albums.artistId, artists.id))
    .where(
      search
        ? or(
            like(music.title, `%${search}%`),
            like(albums.title, `%${search}%`),
            like(artists.name, `%${search}%`),
          )
        : undefined,
    )
    .orderBy(desc(music.id))
    .limit(100);

  return rows;
}

export async function getTrackById(id: number) {
  const [track] = await getTracks().then((tracks) => tracks.filter((item) => item.id === id));
  return track ?? null;
}
