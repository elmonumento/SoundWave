import {
  bigint,
  date,
  foreignKey,
  index,
  int,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable(
  "app_user",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    displayName: varchar("display_name", { length: 80 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    passwordHash: varchar("password_hash", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { fsp: 6 }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("email").on(table.email)],
);

export const artists = mysqlTable("artist", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  biography: text("biography"),
});

export const albums = mysqlTable(
  "album",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    releaseDate: date("release_date", { mode: "string" }),
    coverUrl: text("cover_url"),
    artistId: bigint("artist_id", { mode: "number", unsigned: true }).notNull(),
  },
  (table) => [
    index("idx_album_artist").on(table.artistId),
    foreignKey({ name: "fk_album_artist", columns: [table.artistId], foreignColumns: [artists.id] }),
  ],
);

export const music = mysqlTable(
  "music",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    durationSeconds: int("duration_seconds").notNull(),
    audioUrl: text("audio_url").notNull(),
    albumId: bigint("album_id", { mode: "number", unsigned: true }).notNull(),
  },
  (table) => [
    index("idx_music_title").on(table.title),
    foreignKey({ name: "fk_music_album", columns: [table.albumId], foreignColumns: [albums.id] }),
  ],
);

export const playlists = mysqlTable(
  "playlist",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    description: varchar("description", { length: 500 }),
    createdAt: timestamp("created_at", { fsp: 6 }).defaultNow().notNull(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  },
  (table) => [
    foreignKey({ name: "fk_playlist_user", columns: [table.userId], foreignColumns: [users.id] }).onDelete("cascade"),
  ],
);

export const playlistMusic = mysqlTable(
  "playlist_music",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    playlistId: bigint("playlist_id", { mode: "number", unsigned: true }).notNull(),
    musicId: bigint("music_id", { mode: "number", unsigned: true }).notNull(),
    position: int("position").notNull(),
    addedAt: timestamp("added_at", { fsp: 6 }).defaultNow().notNull(),
  },
  (table) => [
    unique("uq_playlist_music").on(table.playlistId, table.musicId),
    unique("uq_playlist_position").on(table.playlistId, table.position),
    foreignKey({ name: "fk_playlist_music_playlist", columns: [table.playlistId], foreignColumns: [playlists.id] }).onDelete("cascade"),
    foreignKey({ name: "fk_playlist_music_music", columns: [table.musicId], foreignColumns: [music.id] }).onDelete("cascade"),
  ],
);

export const favoriteMusic = mysqlTable(
  "favorite_music",
  {
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    musicId: bigint("music_id", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("created_at", { fsp: 6 }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.musicId] }),
    foreignKey({ name: "fk_favorite_user", columns: [table.userId], foreignColumns: [users.id] }).onDelete("cascade"),
    foreignKey({ name: "fk_favorite_music", columns: [table.musicId], foreignColumns: [music.id] }).onDelete("cascade"),
  ],
);

export const listeningHistory = mysqlTable(
  "listening_history",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    listenedAt: timestamp("listened_at", { fsp: 6 }).defaultNow().notNull(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    musicId: bigint("music_id", { mode: "number", unsigned: true }).notNull(),
  },
  (table) => [
    index("idx_history_user_date").on(table.userId, table.listenedAt),
    foreignKey({ name: "fk_history_user", columns: [table.userId], foreignColumns: [users.id] }).onDelete("cascade"),
    foreignKey({ name: "fk_history_music", columns: [table.musicId], foreignColumns: [music.id] }).onDelete("cascade"),
  ],
);
