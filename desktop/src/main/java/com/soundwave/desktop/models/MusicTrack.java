package com.soundwave.desktop.models;

public record MusicTrack(
    long id,
    String title,
    int durationSeconds,
    String audioUrl,
    String artistName,
    String albumTitle,
    String coverUrl
) {
    @Override
    public String toString() {
        return title + " — " + artistName;
    }
}
