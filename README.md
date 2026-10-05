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
4. In PowerShell, from this folder:

   ```powershell
   npm install
   npm run db:setup
   npm run db:seed
   npm run dev
   ```

5. Open `http://localhost:3000`.

The development server must remain running while you use the app. For a
production build, use `npm run build` then `npm run start`.

## Features

- Responsive web player and browse/search catalogue.
- Account registration/login with hashed passwords and HTTP-only JWT cookie.
- Favorites and personal playlists.
- Listening history and listening statistics.
- MySQL schema setup and sample catalogue seed script.

The initial sample catalogue references externally hosted preview audio. Replace
those URLs with audio you have permission to stream. Catalogue administration,
uploads, and a production deployment are not included in this first web version.

## Design

The interface uses a quiet ink, warm-paper and muted-sage palette, restrained
corners, a responsive layout and a persistent player bar. No external imagery
or copyrighted tracks are bundled.
