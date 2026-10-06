"use client";

import {
  Activity, ArrowDownToLine, ArrowLeft, ArrowRight, AudioLines, Disc3, Heart,
  History, Library, ListMusic, LogIn, Menu, Music2, Pause,
  Play, Plus, Search, SkipBack, SkipForward, Sparkles, Volume2, X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Track = {
  id: number;
  title: string;
  durationSeconds: number;
  audioUrl: string;
  albumId?: number;
  albumTitle: string;
  coverUrl: string | null;
  artistId?: number;
  artistName: string;
};

type SpotifyTrack = {
  id: string;
  title: string;
  artistName: string;
  albumTitle: string;
  coverUrl: string | null;
  durationMs: number;
  spotifyUrl: string;
};

type User = { id: number; displayName: string; email: string };
type Playlist = { id: number; name: string; description: string | null; trackCount: number };
type View = "home" | "search" | "playlistTracks" | "favorites" | "playlists" | "history" | "statistics";
type AuthMode = "login" | "register";

const views: { id: View; label: string; icon: typeof Music2 }[] = [
  { id: "home", label: "Accueil", icon: Music2 },
  { id: "search", label: "Explorer", icon: Search },
  { id: "favorites", label: "Mes favoris", icon: Heart },
  { id: "playlists", label: "Playlists", icon: ListMusic },
  { id: "history", label: "Historique", icon: History },
  { id: "statistics", label: "Mon écoute", icon: Activity },
];

const colors = ["cover-olive", "cover-slate", "cover-clay", "cover-sand", "cover-forest", "cover-ink"];

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function coverColor(id: number) {
  return colors[Math.abs(id) % colors.length];
}

async function responseError(response: Response) {
  try {
    const body = await response.json();
    return typeof body.error === "string" ? body.error : "Une erreur est survenue.";
  } catch {
    return "Une erreur est survenue.";
  }
}

export function SoundWaveApp({ initialTracks }: { initialTracks: Track[] }) {
  const [tracks] = useState(initialTracks);
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [activePlaylistName, setActivePlaylistName] = useState("");
  const [selectedSpotifyTrack, setSelectedSpotifyTrack] = useState<SpotifyTrack | null>(null);
  const [searchError, setSearchError] = useState("");
  const [view, setView] = useState<View>("home");
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [playlistDialog, setPlaylistDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestId = useRef(0);

  const announce = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3600);
  }, []);

  const refreshLibrary = useCallback(async () => {
    const [favoriteResponse, playlistResponse, historyResponse] = await Promise.all([
      fetch("/api/me/favorites"),
      fetch("/api/me/playlists"),
      fetch("/api/me/history"),
    ]);
    if (favoriteResponse.ok) {
      const data = await favoriteResponse.json();
      setFavorites(data.tracks.map((track: Track) => track.id));
    }
    if (playlistResponse.ok) {
      const data = await playlistResponse.json();
      setPlaylists(data.playlists);
    }
    if (historyResponse.ok) {
      const data = await historyResponse.json();
      setHistory(data.history.map((item: { id: number } & Track) => item));
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then(async (data) => {
        if (data.user) {
          setUser(data.user);
          await refreshLibrary();
        }
      })
      .catch(() => announce("Impossible de vérifier la session."));
  }, [announce, refreshLibrary]);

  const visibleTracks = useMemo(() => {
    if (view === "favorites") return tracks.filter((track) => favorites.includes(track.id));
    if (view === "history") return history;
    return tracks;
  }, [favorites, history, tracks, view]);

  const setActiveView = (next: View) => {
    setView(next);
    setSidebarOpen(false);
    if (next === "favorites" || next === "playlists" || next === "history") {
      if (!user) {
        setAuthMode("login");
        announce("Connecte-toi pour accéder à ta bibliothèque.");
      } else {
        void refreshLibrary();
      }
    }
  };

  const runSearch = useCallback(async (query: string) => {
    const requestId = ++searchRequestId.current;
    if (query.trim().length < 2) {
      setSearchResults([]);
      setSearchError("");
      setLoading(false);
      setView("search");
      return;
    }

    setLoading(true);
    setSearchError("");
    setView("search");
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query.trim())}`);
      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json();
      if (requestId === searchRequestId.current) setSearchResults(data.tracks);
    } catch (error) {
      if (requestId === searchRequestId.current) {
        setSearchError(error instanceof Error ? error.message : "La recherche Spotify a échoué.");
      }
    } finally {
      if (requestId === searchRequestId.current) setLoading(false);
    }
  }, []);

  const onSearchChange = (value: string) => {
    setSearch(value);
    setView("search");
    setSearchError("");
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.trim().length < 2) {
      ++searchRequestId.current;
      setSearchResults([]);
      setLoading(false);
      return;
    }
    searchTimer.current = setTimeout(() => void runSearch(value), 400);
  };

  useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }, []);

  const selectSpotifyTrack = (track: SpotifyTrack) => {
    audioRef.current?.pause();
    setCurrentTrack(null);
    setIsPlaying(false);
    setSelectedSpotifyTrack(track);
  };

  const playTrack = async (track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;
    setSelectedSpotifyTrack(null);
    if (currentTrack?.id === track.id) {
      if (audio.paused) {
        await audio.play().catch(() => announce("Ce fichier audio ne peut pas être lu."));
        setIsPlaying(!audio.paused);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
      return;
    }
    setCurrentTrack(track);
    setProgress(0);
    audio.src = track.audioUrl;
    audio.load();
    try {
      await audio.play();
      setIsPlaying(true);
      if (user) {
        await fetch(`/api/me/history/${track.id}`, { method: "POST" }).catch(() => undefined);
        void refreshLibrary();
      }
    } catch {
      setIsPlaying(false);
      announce("Lecture impossible pour ce titre. Vérifie la source audio.");
    }
  };

  const playNext = () => {
    if (!currentTrack || !visibleTracks.length) return;
    const index = visibleTracks.findIndex((track) => track.id === currentTrack.id);
    void playTrack(visibleTracks[(index + 1 + visibleTracks.length) % visibleTracks.length]);
  };

  const playPrevious = () => {
    if (!currentTrack || !visibleTracks.length) return;
    const index = visibleTracks.findIndex((track) => track.id === currentTrack.id);
    void playTrack(visibleTracks[(index - 1 + visibleTracks.length) % visibleTracks.length]);
  };

  const toggleFavorite = async (track: Track) => {
    if (!user) {
      setAuthMode("login");
      announce("Connecte-toi pour enregistrer tes favoris.");
      return;
    }
    const isFavorite = favorites.includes(track.id);
    const response = await fetch(isFavorite ? `/api/me/favorites?musicId=${track.id}` : "/api/me/favorites", {
      method: isFavorite ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: isFavorite ? undefined : JSON.stringify({ musicId: track.id }),
    });
    if (!response.ok) {
      announce(await responseError(response));
      return;
    }
    setFavorites((current) => isFavorite ? current.filter((id) => id !== track.id) : [...current, track.id]);
    announce(isFavorite ? "Retiré de tes favoris." : "Ajouté à tes favoris.");
  };

  const addToPlaylist = async (track: Track) => {
    if (!user) {
      setAuthMode("login");
      return;
    }
    let available = playlists;
    if (!available.length) {
      const name = window.prompt("Nom de ta nouvelle playlist");
      if (!name?.trim()) return;
      const create = await fetch("/api/me/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!create.ok) {
        announce(await responseError(create));
        return;
      }
      const data = await create.json();
      available = [data.playlist];
      setPlaylists(available);
    }
    const chosen = available.length === 1
      ? available[0]
      : available.find((playlist) => playlist.name === window.prompt(
          `Ajouter à quelle playlist ?\n${available.map((item) => item.name).join("\n")}`,
        ));
    if (!chosen) return;
    const response = await fetch(`/api/me/playlists/${chosen.id}/tracks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ musicId: track.id }),
    });
    if (!response.ok) announce(await responseError(response));
    else {
      announce(`Ajouté à « ${chosen.name} ».`);
      void refreshLibrary();
    }
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setFavorites([]);
    setPlaylists([]);
    setHistory([]);
    announce("Tu es déconnecté.");
  };

  return (
    <div className={`app-frame ${selectedSpotifyTrack ? "app-frame-spotify" : ""}`}>
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <Link className="brand" href="/" onClick={() => setActiveView("home")}>
          <span className="brand-mark"><Image src="/soundwave-mark.svg" alt="" width={42} height={42} priority /></span>
          <span className="brand-wordmark"><span>Sound</span><span>Wave</span></span>
        </Link>

        <div className="side-caption">ESPACE MUSICAL</div>
        <nav className="primary-nav" aria-label="Navigation principale">
          {views.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${view === id ? "nav-item-active" : ""}`}
              onClick={() => setActiveView(id)}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {id === "favorites" && favorites.length > 0 && <span className="nav-count">{favorites.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-rule" />
        <div className="side-caption">TA COLLECTION</div>
        <button className="collection-create" onClick={() => user ? setPlaylistDialog(true) : setAuthMode("login")}>
          <span className="create-icon"><Plus size={16} /></span>
          <span>Créer une playlist</span>
        </button>
        {playlists.slice(0, 5).map((playlist) => (
          <button key={playlist.id} className="collection-link" onClick={() => {
            setView("playlists");
            void refreshLibrary();
          }}>
            <Disc3 size={16} strokeWidth={1.7} />
            <span>{playlist.name}</span>
          </button>
        ))}

        <div className="sidebar-footer">
          <div className="listening-note">
            <span className="note-dot" />
            <span>FAIT POUR LES MOMENTS À SOI</span>
          </div>
          <div className="profile-row">
            <div className="avatar">{user ? user.displayName.slice(0, 1).toUpperCase() : <Music2 size={16} />}</div>
            <div className="profile-copy">
              <strong>{user?.displayName ?? "Invité"}</strong>
              <span>{user ? "Compte personnel" : "Découverte libre"}</span>
            </div>
            {user
              ? <button className="icon-button subtle" title="Se déconnecter" aria-label="Se déconnecter" onClick={signOut}><ArrowDownToLine size={16} /></button>
              : <button className="icon-button subtle" title="Se connecter" aria-label="Se connecter" onClick={() => setAuthMode("login")}><LogIn size={16} /></button>}
          </div>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" aria-label="Fermer le menu" onClick={() => setSidebarOpen(false)} />}

      <main className="main-shell">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Ouvrir le menu" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="history-controls">
            <button className="round-control" aria-label="Retour" onClick={() => setActiveView("home")}><ArrowLeft size={16} /></button>
            <button className="round-control" aria-label="Explorer" onClick={() => setActiveView("search")}><ArrowRight size={16} /></button>
          </div>
          <label className="search-box" aria-label="Rechercher un titre sur Spotify">
            <Search size={17} />
            <input value={search} onFocus={() => setView("search")} onChange={(event) => onSearchChange(event.target.value)} placeholder="Rechercher sur Spotify…" />
            {search && <button type="button" className="search-clear" aria-label="Effacer la recherche" onClick={() => { setSearch(""); void runSearch(""); }}><X size={15} /></button>}
            {!search && <kbd>⌘ K</kbd>}
          </label>
          <div className="topbar-actions">
            {user
              ? <button className="account-button" onClick={signOut}><span className="account-avatar">{user.displayName.slice(0, 1).toUpperCase()}</span><span>{user.displayName}</span></button>
              : <><button className="signin-link" onClick={() => setAuthMode("login")}>Connexion</button><button className="signup-button" onClick={() => setAuthMode("register")}>Créer un compte</button></>}
          </div>
        </header>

        <div className="page-content">
          {view === "home" && (
            <>
              <section className="welcome-line">
                <div>
                  <p className="eyebrow">LUNDI 5 OCTOBRE · TON ESPACE MUSICAL</p>
                  <h1>La musique trouve<br /><span>sa place ici.</span></h1>
                  <p className="welcome-copy">Recherche dans le catalogue Spotify et lance l’écoute depuis son lecteur officiel, directement ici.</p>
                </div>
                <div className="hero-art" aria-label="Illustration abstraite d'un disque">
                  <div className="art-index">COLLECTION<br />NO. 01</div>
                  <div className="record-disc"><div className="record-label"><Image src="/soundwave-mark.svg" alt="Logo SoundWave" width={38} height={38} /></div></div>
                  <div className="art-meta"><span>UNE ÉCOUTE À LA FOIS</span><span>VOL. 01 / 2026</span></div>
                </div>
              </section>

              <section className="quick-choices" aria-label="Accès rapides">
                <button className="quick-card quick-card-favorites" onClick={() => setActiveView("favorites")}>
                  <span className="quick-card-icon"><Heart size={17} /></span><span><strong>Tes favoris</strong><small>Les titres à garder près de toi</small></span><ArrowRight className="quick-arrow" size={17} />
                </button>
                <button className="quick-card quick-card-playlists" onClick={() => setActiveView("playlists")}>
                  <span className="quick-card-icon"><ListMusic size={17} /></span><span><strong>Tes playlists</strong><small>Des morceaux, dans ton ordre</small></span><ArrowRight className="quick-arrow" size={17} />
                </button>
                <button className="quick-card quick-card-history" onClick={() => setActiveView("history")}>
                  <span className="quick-card-icon"><History size={17} /></span><span><strong>Reprendre l’écoute</strong><small>Retrouve tes derniers titres</small></span><ArrowRight className="quick-arrow" size={17} />
                </button>
              </section>
              <SpotifyAlbumFeature />
              <section className="music-section">
                <div className="section-heading">
                  <div><p className="eyebrow">TON ESPACE PERSONNEL</p><h2>Ta bibliothèque</h2></div>
                  <button className="text-action" onClick={() => setActiveView("search")}>Rechercher sur Spotify <ArrowRight size={15} /></button>
                </div>
                <TrackTable tracks={tracks.slice(0, 8)} currentTrack={currentTrack} isPlaying={isPlaying} favorites={favorites} onPlay={playTrack} onFavorite={toggleFavorite} onAddToPlaylist={addToPlaylist} />
              </section>
            </>
          )}

          {view !== "home" && (
            <section className="library-view">
              <div className="library-heading">
                <div>
                  <p className="eyebrow">{view === "search" ? "CATALOGUE SPOTIFY" : "TON ESPACE PERSONNEL"}</p>
                  <h1>{view === "search" ? "Explorer" : view === "playlistTracks" ? activePlaylistName : view === "favorites" ? "Tes favoris" : view === "playlists" ? "Tes playlists" : view === "history" ? "Historique" : "Mon écoute"}</h1>
                  <p>{view === "search" ? "Les résultats viennent de Spotify. La lecture se fait dans son lecteur officiel." : view === "playlistTracks" ? "Les morceaux de cette playlist SoundWave." : "Une collection qui se construit au fil des écoutes."}</p>
                </div>
                {view === "playlists" && user && <button className="signup-button" onClick={() => setPlaylistDialog(true)}><Plus size={16} /> Nouvelle playlist</button>}
                {view === "statistics" && <span className="library-feature-icon"><Activity size={24} /></span>}
              </div>

              {view === "statistics"
                ? <StatisticsPanel user={user} openLogin={() => setAuthMode("login")} />
                : view === "playlists"
                  ? <PlaylistPanel playlists={playlists} user={user} tracks={tracks} currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playTrack} onSelectPlaylist={(playlist) => {
                    void fetch(`/api/me/playlists/${playlist.id}/tracks`).then((response) => response.json()).then((data) => {
                      setPlaylistTracks(data.tracks);
                      setActivePlaylistName(playlist.name);
                      setView("playlistTracks");
                    }).catch(() => announce("Cette playlist n’a pas pu être ouverte."));
                  }} />
                  : view === "search"
                    ? <SpotifyResults tracks={searchResults} query={search} error={searchError} loading={loading} selectedId={selectedSpotifyTrack?.id ?? null} onSelect={selectSpotifyTrack} />
                    : <TrackTable tracks={view === "playlistTracks" ? playlistTracks : visibleTracks} currentTrack={currentTrack} isPlaying={isPlaying} favorites={favorites} onPlay={playTrack} onFavorite={toggleFavorite} onAddToPlaylist={addToPlaylist} />}
            </section>
          )}
        </div>
      </main>

      {selectedSpotifyTrack
        ? <SpotifyPlayer track={selectedSpotifyTrack} />
        : <PlayerBar track={currentTrack} playing={isPlaying} progress={progress} duration={duration} onToggle={() => currentTrack && void playTrack(currentTrack)} onPrevious={playPrevious} onNext={playNext} onSeek={(value) => {
          const audio = audioRef.current;
          if (audio && Number.isFinite(audio.duration)) {
            audio.currentTime = value;
            setProgress(value);
          }
        }} />}
      <audio
        ref={audioRef}
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
        onEnded={() => { setIsPlaying(false); playNext(); }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      {notice && <div className="toast-note" role="status"><Sparkles size={16} />{notice}</div>}
      {authMode && <AuthDialog mode={authMode} onClose={() => setAuthMode(null)} onSwitch={setAuthMode} onSuccess={(nextUser) => {
        setUser(nextUser);
        setAuthMode(null);
        announce(`Bienvenue, ${nextUser.displayName}.`);
        void refreshLibrary();
      }} />}
      {playlistDialog && <PlaylistDialog onClose={() => setPlaylistDialog(false)} onCreated={(playlist) => {
        setPlaylists((current) => [playlist, ...current]);
        setPlaylistDialog(false);
        announce(`La playlist « ${playlist.name} » est créée.`);
      }} />}
    </div>
  );
}

const spotifyAlbums = [
  { id: "7gGJ9rNtigRF53dsFo48Wp", title: "Welcome to O'Block" },
  { id: "6ciIG1XKTlVIn0Yl8rvsce", title: "Almost Healed" },
  { id: "6lb9q7QZwjMj9EE7M664sK", title: "The Voice (Deluxe)" },
  { id: "0s8hpk11n5gpgAR0Sxth8S", title: "FLOATER" },
  { id: "7hcmFVB5Pclui5v2kXDePS", title: "FREELYM" },
  { id: "2jkrBfnQoV4eDTaoXWnVhg", title: "MASA" },
  { id: "1nzUj7VkiaytMmf2KrhK2L", title: "AI YoungBoy 2" },
  { id: "0LZndJKxVb0oY3qGUpxqQQ", title: "Marcory Trap Shit REEDITION" },
  { id: "2P3c2J4NJzrksbKN2WIuRd", title: "NOUCHI TRAP VOL 1" },
  { id: "6MPNZug9oqtpRulDoDyZOY", title: "WELCOME TO MY HOOD" },
];

function SpotifyAlbumFeature() {
  return (
    <section className="spotify-album-section" aria-labelledby="spotify-album-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ÉCOUTE VIA LE LECTEUR OFFICIEL</p>
          <h2 id="spotify-album-heading">Albums à écouter</h2>
        </div>
        <span className="spotify-album-count">{spotifyAlbums.length} albums</span>
      </div>
      <p className="spotify-album-copy">Sélection d’albums partagés par toi · lecture assurée par Spotify.</p>
      <div className="spotify-album-grid">
        {spotifyAlbums.map((album) => (
          <article className="spotify-album-card" key={album.id}>
            <div className="spotify-album-card-heading">
              <h3>{album.title}</h3>
              <a
                className="spotify-album-link"
                href={`https://open.spotify.com/intl-fr/album/${album.id}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Ouvrir ${album.title} sur Spotify`}
              >
                <ArrowRight size={15} />
              </a>
            </div>
            <iframe
              className="spotify-album-embed"
              title={`Lecteur Spotify officiel — ${album.title}`}
              src={`https://open.spotify.com/embed/album/${album.id}?utm_source=generator`}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </article>
        ))}
      </div>
    </section>
  );
}

function SpotifyResults({
  tracks, query, error, loading, selectedId, onSelect,
}: {
  tracks: SpotifyTrack[];
  query: string;
  error: string;
  loading: boolean;
  selectedId: string | null;
  onSelect: (track: SpotifyTrack) => void;
}) {
  if (loading) return <div className="empty-state"><span className="loading-mark" /><p>Recherche dans Spotify…</p></div>;
  if (error) return <div className="empty-state" role="alert"><Disc3 size={27} /><strong>Recherche Spotify indisponible</strong><p>{error}</p></div>;
  if (query.trim().length < 2) return <div className="empty-state"><Search size={27} /><strong>Recherche dans Spotify</strong><p>Saisis au moins deux caractères pour trouver un titre ou un artiste.</p></div>;
  if (!tracks.length) return <div className="empty-state"><Disc3 size={27} /><strong>Aucun résultat</strong><p>Essaie un autre titre ou nom d’artiste.</p></div>;

  return (
    <div className="spotify-results">
      <p className="spotify-attribution">Résultats fournis par Spotify · sélectionne un titre pour ouvrir son lecteur officiel.</p>
      {tracks.map((track) => (
        <article className={`spotify-result ${selectedId === track.id ? "spotify-result-selected" : ""}`} key={track.id}>
          <button className="spotify-result-select" onClick={() => onSelect(track)} aria-label={`Écouter ${track.title} par ${track.artistName} avec le lecteur Spotify`}>
            <span
              className="spotify-result-cover"
              role="img"
              aria-label={`Pochette de l’album ${track.albumTitle}`}
              style={track.coverUrl ? { backgroundImage: `url("${track.coverUrl}")` } : undefined}
            >
              {!track.coverUrl && <Disc3 size={20} />}
            </span>
            <span className="spotify-result-copy">
              <strong>{track.title}</strong>
              <small>{track.artistName} · {track.albumTitle}</small>
            </span>
            <span className="spotify-result-duration">{formatTime(Math.floor(track.durationMs / 1000))}</span>
          </button>
          <a className="spotify-result-link" href={track.spotifyUrl} target="_blank" rel="noreferrer">
            Spotify <ArrowRight size={13} />
          </a>
        </article>
      ))}
    </div>
  );
}

function SpotifyPlayer({ track }: { track: SpotifyTrack }) {
  return (
    <footer className="spotify-player-bar">
      <div className="spotify-player-heading">
        <span><span className="spotify-indicator" /> Lecteur officiel Spotify</span>
        <a href={track.spotifyUrl} target="_blank" rel="noreferrer">Ouvrir dans Spotify <ArrowRight size={13} /></a>
      </div>
      <iframe
        key={track.id}
        title={`Lecteur Spotify : ${track.title} — ${track.artistName}`}
        src={`https://open.spotify.com/embed/track/${encodeURIComponent(track.id)}?utm_source=generator`}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </footer>
  );
}

function TrackTable({
  tracks, currentTrack, isPlaying, favorites, loading = false, onPlay, onFavorite, onAddToPlaylist,
}: {
  tracks: Track[]; currentTrack: Track | null; isPlaying: boolean; favorites: number[];
  loading?: boolean; onPlay: (track: Track) => void; onFavorite: (track: Track) => void; onAddToPlaylist: (track: Track) => void;
}) {
  if (loading) return <div className="empty-state"><span className="loading-mark" /><p>On cherche dans le catalogue…</p></div>;
  if (!tracks.length) return <div className="empty-state"><Disc3 size={27} /><strong>Aucun morceau dans cette sélection</strong><p>Utilise la recherche en haut de la page pour trouver des titres et les écouter avec le lecteur officiel Spotify.</p></div>;

  return (
    <div className="track-table">
      <div className="track-row track-header"><span>#</span><span>TITRE</span><span>ALBUM</span><span>DURÉE</span><span /></div>
      {tracks.map((track, index) => {
        const isCurrent = currentTrack?.id === track.id;
        return (
          <div className={`track-row ${isCurrent ? "track-row-current" : ""}`} key={track.id}>
            <button className="row-number" aria-label={`Écouter ${track.title}`} onClick={() => onPlay(track)}>
              {isCurrent && isPlaying ? <AudioLines size={16} /> : <><span className="track-index">{String(index + 1).padStart(2, "0")}</span><Play className="row-play" size={15} fill="currentColor" /></>}
            </button>
            <button className="track-main" onClick={() => onPlay(track)}>
              <span className={`track-cover ${coverColor(track.id)}`}><Disc3 size={19} strokeWidth={1.5} /></span>
              <span className="track-copy"><strong>{track.title}</strong><small>{track.artistName}</small></span>
            </button>
            <span className="track-album">{track.albumTitle}</span>
            <span className="track-duration">{formatTime(track.durationSeconds)}</span>
            <span className="track-actions">
              <button className={`icon-button ${favorites.includes(track.id) ? "favorite-active" : ""}`} title={favorites.includes(track.id) ? "Retirer des favoris" : "Ajouter aux favoris"} aria-label="Favori" onClick={() => onFavorite(track)}><Heart size={16} fill={favorites.includes(track.id) ? "currentColor" : "none"} /></button>
              <button className="icon-button" title="Ajouter à une playlist" aria-label="Ajouter à une playlist" onClick={() => onAddToPlaylist(track)}><Plus size={17} /></button>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PlayerBar({
  track, playing, progress, duration, onToggle, onPrevious, onNext, onSeek,
}: {
  track: Track | null; playing: boolean; progress: number; duration: number;
  onToggle: () => void; onPrevious: () => void; onNext: () => void; onSeek: (value: number) => void;
}) {
  const time = duration || track?.durationSeconds || 0;
  return (
    <footer className="player-bar">
      <div className="player-track">
        {track ? <span className={`track-cover player-cover ${coverColor(track.id)}`}><Disc3 size={19} /></span> : <span className="player-placeholder"><Music2 size={19} /></span>}
        <span className="track-copy"><strong>{track?.title ?? "Choisis un morceau"}</strong><small>{track?.artistName ?? "SoundWave"}</small></span>
        {track && <span className="player-favorite"><Heart size={15} /></span>}
      </div>
      <div className="player-center">
        <div className="player-controls">
          <button className="player-side" aria-label="Titre précédent" onClick={onPrevious}><SkipBack size={17} fill="currentColor" /></button>
          <button className="play-control" aria-label={playing ? "Mettre en pause" : "Lire"} onClick={onToggle}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button>
          <button className="player-side" aria-label="Titre suivant" onClick={onNext}><SkipForward size={17} fill="currentColor" /></button>
        </div>
        <div className="seek-row">
          <span>{formatTime(Math.floor(progress || 0))}</span>
          <input aria-label="Position de lecture" type="range" min={0} max={Math.max(time, 1)} value={Math.min(progress, time || 1)} onChange={(event) => onSeek(Number(event.target.value))} style={{ "--seek-progress": `${time ? progress / time * 100 : 0}%` } as React.CSSProperties} />
          <span>{formatTime(Math.floor(time))}</span>
        </div>
      </div>
      <div className="player-volume"><Volume2 size={17} /><input aria-label="Volume" type="range" min={0} max={1} step={0.01} defaultValue={0.72} onChange={(event) => {
        const audio = document.querySelector("audio");
        if (audio) audio.volume = Number(event.target.value);
      }} /></div>
    </footer>
  );
}

function AuthDialog({
  mode, onClose, onSwitch, onSuccess,
}: {
  mode: AuthMode; onClose: () => void; onSwitch: (mode: AuthMode) => void; onSuccess: (user: User) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = {
      displayName: String(form.get("displayName") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json();
      onSuccess(data.user);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Impossible de terminer la demande.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="dialog-close icon-button" aria-label="Fermer" onClick={onClose}><X size={18} /></button>
        <div className="dialog-brand"><span className="brand-mark"><Image src="/soundwave-mark.svg" alt="SoundWave" width={42} height={42} /></span></div>
        <p className="eyebrow">TON ESPACE MUSICAL</p>
        <h2 id="auth-title">{mode === "login" ? "Heureux de te revoir." : "Une place pour toi."}</h2>
        <p className="dialog-intro">{mode === "login" ? "Retrouve tes favoris et tes playlists." : "Crée ton compte et compose ta collection."}</p>
        <form onSubmit={submit} className="auth-form">
          {mode === "register" && <label>Nom affiché<input name="displayName" required minLength={2} maxLength={80} autoComplete="name" placeholder="Comment t’appelles-tu ?" /></label>}
          <label>Adresse e-mail<input name="email" required type="email" autoComplete="email" placeholder="toi@exemple.com" /></label>
          <label>Mot de passe<input name="password" required type="password" minLength={8} maxLength={72} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="8 caractères minimum" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="signup-button auth-submit" disabled={busy}>{busy ? "Un instant…" : mode === "login" ? "Se connecter" : "Créer mon compte"}</button>
        </form>
        <p className="switch-auth">{mode === "login" ? "Pas encore de compte ?" : "Déjà inscrit ?"} <button onClick={() => onSwitch(mode === "login" ? "register" : "login")}>{mode === "login" ? "Créer un compte" : "Se connecter"}</button></p>
      </section>
    </div>
  );
}

function PlaylistDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (playlist: Playlist) => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/me/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.get("name"), description: form.get("description") }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json();
      onCreated({ ...data.playlist, trackCount: 0 });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "La playlist n’a pas pu être créée.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="playlist-title">
        <button className="dialog-close icon-button" aria-label="Fermer" onClick={onClose}><X size={18} /></button>
        <div className="dialog-brand"><span className="brand-mark"><ListMusic size={19} /></span></div>
        <p className="eyebrow">TA COLLECTION</p>
        <h2 id="playlist-title">Nouvelle playlist.</h2>
        <p className="dialog-intro">Donne-lui un nom, les morceaux viendront ensuite.</p>
        <form onSubmit={submit} className="auth-form">
          <label>Nom<input name="name" required minLength={1} maxLength={100} placeholder="Par exemple, dimanche matin" /></label>
          <label>Description <span className="optional-label">FACULTATIF</span><textarea name="description" maxLength={500} rows={3} placeholder="Quelques mots pour t’en souvenir…" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="signup-button auth-submit" disabled={busy}>{busy ? "Création…" : "Créer la playlist"}</button>
        </form>
      </section>
    </div>
  );
}

function PlaylistPanel({
  playlists, user, tracks, currentTrack, isPlaying, onPlay, onSelectPlaylist,
}: {
  playlists: Playlist[]; user: User | null; tracks: Track[]; currentTrack: Track | null; isPlaying: boolean;
  onPlay: (track: Track) => void; onSelectPlaylist: (playlist: Playlist) => void;
}) {
  if (!user) return <div className="empty-state"><Library size={27} /><strong>Ta musique t’attend</strong><p>Connecte-toi pour créer et retrouver tes playlists.</p></div>;
  if (!playlists.length) return <div className="empty-state"><ListMusic size={27} /><strong>Commence ta première playlist</strong><p>Rassemble les morceaux selon ton humeur ou ton moment.</p></div>;
  return (
    <div className="playlist-grid">
      {playlists.map((playlist, index) => (
        <button className="playlist-card" key={playlist.id} onClick={() => onSelectPlaylist(playlist)}>
          <span className={`playlist-art ${coverColor(index + playlist.id)}`}><Disc3 size={31} /></span>
          <span className="playlist-title">{playlist.name}</span>
          <span className="playlist-subtitle">{playlist.trackCount} morceau{playlist.trackCount === 1 ? "" : "x"}</span>
          <span className="playlist-play" onClick={(event) => { event.stopPropagation(); if (tracks[0]) onPlay(tracks[0]); }}>{currentTrack && isPlaying ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}</span>
        </button>
      ))}
    </div>
  );
}

function StatisticsPanel({ user, openLogin }: { user: User | null; openLogin: () => void }) {
  const [stats, setStats] = useState<{ totalListens: number; uniqueTracks: number; listenedSeconds: number; listensLast30Days: number } | null>(null);
  useEffect(() => {
    if (user) fetch("/api/me/statistics").then((response) => response.ok ? response.json() : null).then(setStats).catch(() => setStats(null));
  }, [user]);
  if (!user) return <div className="empty-state"><Activity size={27} /><strong>Une écoute, une histoire</strong><p>Connecte-toi pour voir tes statistiques.</p><button className="text-action" onClick={openLogin}>Se connecter <ArrowRight size={15} /></button></div>;
  const hours = Math.floor((stats?.listenedSeconds ?? 0) / 3600);
  const minutes = Math.floor(((stats?.listenedSeconds ?? 0) % 3600) / 60);
  return (
    <div className="stat-grid">
      <article className="stat-card"><span>TITRES ÉCOUTÉS</span><strong>{stats?.totalListens ?? "—"}</strong><small>depuis la création du compte</small></article>
      <article className="stat-card"><span>TITRES DIFFÉRENTS</span><strong>{stats?.uniqueTracks ?? "—"}</strong><small>dans tes découvertes</small></article>
      <article className="stat-card"><span>TEMPS D’ÉCOUTE</span><strong>{hours} h {minutes} min</strong><small>au fil de tes sessions</small></article>
      <article className="stat-card"><span>CES 30 DERNIERS JOURS</span><strong>{stats?.listensLast30Days ?? "—"}</strong><small>titres lancés récemment</small></article>
    </div>
  );
}
