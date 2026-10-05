import { eq } from "drizzle-orm";
import { db, pool } from "../src/lib/db";
import { albums, artists, music } from "../src/lib/db/schema";

async function seed() {
  const [existing] = await db.select({ id: music.id }).from(music).limit(1);
  if (existing) {
    console.log("SoundWave already has tracks; the sample catalogue was left unchanged.");
    return;
  }

  const artistSeeds = [
    { name: "Aster Vale", biography: "Compositions instrumentales pour prendre le temps." },
    { name: "Lina Moreau", biography: "Piano, cordes et paysages intérieurs." },
    { name: "Northbound", biography: "Textures électroniques et rythmes apaisés." },
  ];

  for (const [index, artistSeed] of artistSeeds.entries()) {
    await db.insert(artists).values(artistSeed);
    const [artist] = await db.select({ id: artists.id }).from(artists).where(eq(artists.name, artistSeed.name)).limit(1);
    if (!artist) throw new Error(`Could not create sample artist ${artistSeed.name}.`);

    const albumTitle = ["Quiet Hours", "Lignes claires", "Between stations"][index];
    await db.insert(albums).values({
      title: albumTitle,
      artistId: artist.id,
      releaseDate: ["2025-03-14", "2024-10-04", "2025-06-20"][index],
      coverUrl: null,
    });
    const [album] = await db.select({ id: albums.id }).from(albums).where(eq(albums.title, albumTitle)).limit(1);
    if (!album) throw new Error(`Could not create sample album ${albumTitle}.`);

    await db.insert(music).values([
      {
        title: ["First Light", "La chambre calme", "Platform 04"][index],
        durationSeconds: [245, 208, 232][index],
        audioUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${index + 1}.mp3`,
        albumId: album.id,
      },
      {
        title: ["Open Window", "Au bord du jour", "Night service"][index],
        durationSeconds: [219, 251, 196][index],
        audioUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${index + 4}.mp3`,
        albumId: album.id,
      },
    ]);
  }

  console.log("Added 6 sample tracks. Replace preview URLs with audio you are authorized to stream.");
}

seed()
  .catch((error: unknown) => {
    console.error("SoundWave seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
