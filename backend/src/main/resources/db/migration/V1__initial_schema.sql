CREATE TABLE app_user (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    display_name VARCHAR(80) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

CREATE TABLE artist (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    biography TEXT
) ENGINE=InnoDB;

CREATE TABLE album (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    release_date DATE,
    cover_url TEXT,
    artist_id BIGINT NOT NULL,
    CONSTRAINT fk_album_artist FOREIGN KEY (artist_id) REFERENCES artist(id)
) ENGINE=InnoDB;

CREATE TABLE music (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
    audio_url TEXT NOT NULL,
    album_id BIGINT NOT NULL,
    CONSTRAINT fk_music_album FOREIGN KEY (album_id) REFERENCES album(id)
) ENGINE=InnoDB;

CREATE INDEX idx_music_title ON music (title);
CREATE INDEX idx_album_artist ON album (artist_id);

CREATE TABLE playlist (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_playlist_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE playlist_music (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    playlist_id BIGINT NOT NULL,
    music_id BIGINT NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 0),
    added_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_playlist_music UNIQUE (playlist_id, music_id),
    CONSTRAINT uq_playlist_position UNIQUE (playlist_id, position),
    CONSTRAINT fk_playlist_music_playlist FOREIGN KEY (playlist_id) REFERENCES playlist(id) ON DELETE CASCADE,
    CONSTRAINT fk_playlist_music_music FOREIGN KEY (music_id) REFERENCES music(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE favorite_music (
    user_id BIGINT NOT NULL,
    music_id BIGINT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, music_id),
    CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorite_music FOREIGN KEY (music_id) REFERENCES music(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE listening_history (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    listened_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    user_id BIGINT NOT NULL,
    music_id BIGINT NOT NULL,
    CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_music FOREIGN KEY (music_id) REFERENCES music(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_history_user_date ON listening_history (user_id, listened_at DESC);
