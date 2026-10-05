package com.soundwave.api.entities;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "listening_history")
public class ListeningHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "listened_at", nullable = false, updatable = false)
    private Instant listenedAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "music_id", nullable = false)
    private Music music;

    protected ListeningHistory() {}

    public ListeningHistory(User user, Music music) {
        this.user = user;
        this.music = music;
    }

    public Long getId() { return id; }
    public Instant getListenedAt() { return listenedAt; }
    public User getUser() { return user; }
    public Music getMusic() { return music; }
}
