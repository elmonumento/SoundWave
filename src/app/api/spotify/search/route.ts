import { NextResponse } from "next/server";
import { searchSpotifyTracks, SpotifyRequestError } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 100) {
    return NextResponse.json({ error: "Saisis entre 2 et 100 caractères pour rechercher sur Spotify." }, { status: 400 });
  }

  try {
    const tracks = await searchSpotifyTracks(query);
    return NextResponse.json({ tracks, provider: "Spotify" }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof SpotifyRequestError) {
      return NextResponse.json(
        { error: error.message },
        {
          status: error.status,
          headers: error.retryAfter ? { "Retry-After": error.retryAfter } : undefined,
        },
      );
    }
    console.error("Spotify search request failed:", error);
    return NextResponse.json({ error: "Spotify est temporairement indisponible." }, { status: 502 });
  }
}
