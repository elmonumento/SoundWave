package com.soundwave.desktop.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.soundwave.desktop.models.MusicTrack;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public class SoundWaveApiClient {
    private final HttpClient http = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5))
        .build();
    private final ObjectMapper json = new ObjectMapper();
    private final URI baseUri = URI.create(
        System.getProperty("soundwave.api.base-url", "http://localhost:8080")
    );
    private volatile String token;

    public CompletableFuture<String> login(String email, String password) {
        return authenticate("/api/auth/login", Map.of("email", email, "password", password));
    }

    public CompletableFuture<String> register(String displayName, String email, String password) {
        return authenticate("/api/auth/register", Map.of(
            "displayName", displayName,
            "email", email,
            "password", password
        ));
    }

    public CompletableFuture<List<MusicTrack>> searchMusic(String query) {
        String path = "/api/music";
        if (query != null && !query.isBlank()) {
            path += "?q=" + URLEncoder.encode(query.trim(), StandardCharsets.UTF_8);
        }
        HttpRequest request = HttpRequest.newBuilder(baseUri.resolve(path)).GET().build();
        return http.sendAsync(request, HttpResponse.BodyHandlers.ofString())
            .thenApply(this::requireSuccess)
            .thenApply(this::readMusic);
    }

    private CompletableFuture<String> authenticate(String path, Map<String, String> body) {
        final String payload;
        try {
            payload = json.writeValueAsString(body);
        } catch (IOException exception) {
            return CompletableFuture.failedFuture(exception);
        }
        HttpRequest request = HttpRequest.newBuilder(baseUri.resolve(path))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();
        return http.sendAsync(request, HttpResponse.BodyHandlers.ofString())
            .thenApply(this::requireSuccess)
            .thenApply(response -> {
                try {
                    String accessToken = json.readTree(response).path("accessToken").asText();
                    if (accessToken.isBlank()) {
                        throw new IllegalStateException("The API returned no access token.");
                    }
                    token = accessToken;
                    return json.readTree(response).path("user").path("displayName").asText();
                } catch (IOException exception) {
                    throw new IllegalStateException("Could not read the authentication response.", exception);
                }
            });
    }

    private List<MusicTrack> readMusic(String response) {
        try {
            return json.readValue(response, new TypeReference<>() {});
        } catch (IOException exception) {
            throw new IllegalStateException("Could not read the music catalogue response.", exception);
        }
    }

    private String requireSuccess(HttpResponse<String> response) {
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            String message;
            try {
                message = json.readTree(response.body()).path("message").asText("Request failed.");
            } catch (IOException exception) {
                message = response.body().isBlank() ? "Request failed." : response.body();
            }
            throw new IllegalStateException(message + " (HTTP " + response.statusCode() + ")");
        }
        return response.body();
    }
}
