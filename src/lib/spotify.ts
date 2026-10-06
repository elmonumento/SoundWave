type SpotifyTokenResponse = {
  access_token: string;
  expires_in: number;
};

type SpotifyApiTrack = {
  id: string;
  name: string;
  duration_ms: number;
  external_urls?: { spotify?: string };
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  artists: Array<{ name: string }>;
};

export type SpotifySearchTrack = {
  id: string;
  title: string;
  artistName: string;
  albumTitle: string;
  coverUrl: string | null;
  durationMs: number;
  spotifyUrl: string;
};

export class SpotifyRequestError extends Error {
  constructor(message: string, readonly status: number, readonly retryAfter?: string) {
    super(message);
    this.name = "SpotifyRequestError";
  }
}

let cachedToken: { value: string; expiresAt: number } | undefined;
let tokenRequest: Promise<string> | undefined;

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  if (tokenRequest) return tokenRequest;

  tokenRequest = (async () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new SpotifyRequestError("Configure SPOTIFY_CLIENT_ID et SPOTIFY_CLIENT_SECRET dans .env.local.", 503);
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new SpotifyRequestError("Spotify n'a pas autorisé la recherche. Vérifie les identifiants de l'application.", 502);
    }

    const token = (await response.json()) as SpotifyTokenResponse;
    cachedToken = {
      value: token.access_token,
      expiresAt: Date.now() + Math.max(token.expires_in - 60, 0) * 1000,
    };
    return token.access_token;
  })();

  try {
    return await tokenRequest;
  } finally {
    tokenRequest = undefined;
  }
}

export async function searchSpotifyTracks(query: string): Promise<SpotifySearchTrack[]> {
  const accessToken = await getAccessToken();
  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "track");
  url.searchParams.set("limit", "12");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new SpotifyRequestError("Spotify limite temporairement les recherches. Réessaie dans un instant.", 429, response.headers.get("Retry-After") ?? undefined);
    }
    if (response.status === 403) {
      throw new SpotifyRequestError("Spotify refuse la recherche : le compte propriétaire de l’application doit avoir un abonnement Premium actif en mode développement.", 403);
    }
    throw new SpotifyRequestError("La recherche Spotify a échoué. Réessaie dans un instant.", 502);
  }

  const data = (await response.json()) as { tracks?: { items?: SpotifyApiTrack[] | null } };
  return (data.tracks?.items ?? [])
    .filter((track) => /^[A-Za-z0-9]{1,64}$/.test(track.id))
    .map((track) => {
      const fallbackSpotifyUrl = `https://open.spotify.com/track/${track.id}`;
      const providedSpotifyUrl = track.external_urls?.spotify;
      let spotifyUrl = fallbackSpotifyUrl;
      if (providedSpotifyUrl) {
        try {
          const candidate = new URL(providedSpotifyUrl);
          if (candidate.protocol === "https:" && candidate.hostname === "open.spotify.com") {
            spotifyUrl = candidate.toString();
          }
        } catch {
          spotifyUrl = fallbackSpotifyUrl;
        }
      }

      const imageUrl = track.album.images[0]?.url;
      let coverUrl: string | null = null;
      if (imageUrl) {
        try {
          const candidate = new URL(imageUrl);
          if (candidate.protocol === "https:" && candidate.hostname === "i.scdn.co") {
            coverUrl = candidate.toString();
          }
        } catch {
          coverUrl = null;
        }
      }

      return {
        id: track.id,
        title: track.name,
        artistName: track.artists.map((artist) => artist.name).join(", "),
        albumTitle: track.album.name,
        coverUrl,
        durationMs: track.duration_ms,
        spotifyUrl,
      };
    });
}
