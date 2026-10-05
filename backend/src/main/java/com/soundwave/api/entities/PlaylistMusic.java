package com.soundwave.api.entities;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "playlist_music", uniqueConstraints = {
    @UniqueConstraint(name = "uq_playlist_music", columnNames = {"playlist_id", "music_id"}),
    @UniqueConstraint(name = "uq_playlist_position", columnNames = {"playlist_id", "position"})
})
public class PlaylistMusic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "playlist_id", nullable = false)
    private Playlist playlist;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "music_id", nullable = false)
    private Music music;

    @Column(nullable = false)
    private int position;

    @Column(name = "added_at", nullable = false, updatable = false)
    private Instant addedAt = Instant.now();

    protected PlaylistMusic() {}

    public PlaylistMusic(Playlist playlist, Music music, int position) {
        this.playlist = playlist;
        this.music = music;
        this.position = position;
    }

    public Long getId() { return id; }
    public Playlist getPlaylist() { return playlist; }
    public Music getMusic() { return music; }
    public int getPosition() { return position; }
    public Instant getAddedAt() { return addedAt; }
}
