import { SoundWaveApp } from "@/components/soundwave-app";
import { getTracks } from "@/lib/music";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tracks = await getTracks();
  return <SoundWaveApp initialTracks={tracks} />;
}
