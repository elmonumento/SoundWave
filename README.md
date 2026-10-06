# SoundWave

SoundWave is a modern web music library built with Next.js, React, TypeScript,
Drizzle ORM and the MySQL server included with XAMPP.

## Requirements

- Node.js 20.9 or newer.
- XAMPP with MySQL/MariaDB.

## Run locally

1. Start **MySQL** in the XAMPP Control Panel.
2. Create an empty database called `soundwave` in phpMyAdmin
   (`http://localhost/phpmyadmin`), using `utf8mb4_unicode_ci`.
3. Copy `.env.example` to `.env.local`. The default URL is suitable for a
   standard local XAMPP installation with `root` and no password. Replace
   `JWT_SECRET` with a random secret of at least 32 characters.
4. Create an app at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard),
   then copy its client ID and client secret into `SPOTIFY_CLIENT_ID` and
   `SPOTIFY_CLIENT_SECRET` in `.env.local`. Never expose or commit the client secret.
5. In PowerShell, from this folder:

   ```powershell
   npm install
   npm run db:setup
   npm run dev
   ```

6. Open `http://localhost:3000`.

The development server must remain running while you use the app. For a
production build, use `npm run build` then `npm run start`.

## Features

- Responsive web player and browse/search catalogue.
- Account registration/login with hashed passwords and HTTP-only JWT cookie.
- Favorites and personal playlists.
- Listening history and listening statistics.
- MySQL schema setup. The catalogue starts empty so only real, authorized listening sources are added.
- Spotify track search with official embedded playback and links back to Spotify.
- A Spotify album embed can be shared directly without enabling Spotify API search.

Playback is provided by Spotify's official embed. Users may need to be signed
in to Spotify, and playback availability depends on their account, location and
Spotify's terms. Spotify development-mode apps require the app owner to have an
active Premium subscription for Web API search, and allow only a small allowlist
of Spotify users. The manually shared album embed does not use the Web API.
SoundWave does not download or rehost Spotify audio.

## Design

The interface uses a quiet ink, warm-paper and muted-sage palette, restrained
corners, a responsive layout and a persistent player bar. No external imagery
or copyrighted tracks are bundled.
