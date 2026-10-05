package com.soundwave.api.dto;

import java.time.Instant;
import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class ApiDtos {
    private ApiDtos() {}

    public record TokenResponse(String accessToken, String tokenType, Instant expiresAt, UserResponse user) {}
    public record UserResponse(Long id, String displayName, String email) {}
    public record MusicResponse(
        Long id, String title, int durationSeconds, String audioUrl,
        String artistName, String albumTitle, String coverUrl
    ) {}
    public record PlaylistRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 500) String description
    ) {}
    public record PlaylistResponse(Long id, String name, String description, int trackCount) {}
    public record HistoryResponse(Instant listenedAt, MusicResponse music) {}
    public record StatisticsResponse(long totalListens, long uniqueTracks, long listenedSeconds, long listensLast30Days) {}
    public record ErrorResponse(String message, List<String> details, Instant timestamp) {}
}
