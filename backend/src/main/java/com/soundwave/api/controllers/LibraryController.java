package com.soundwave.api.controllers;

import com.soundwave.api.dto.ApiDtos.*;
import com.soundwave.api.dto.ApiDtos.PlaylistRequest;
import com.soundwave.api.services.LibraryService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me")
public class LibraryController {
    private final LibraryService library;

    public LibraryController(LibraryService library) {
        this.library = library;
    }

    @GetMapping("/favorites")
    public List<MusicResponse> favorites(@AuthenticationPrincipal String email) {
        return library.favorites(email);
    }

    @PutMapping("/favorites/{musicId}")
    public List<MusicResponse> addFavorite(@AuthenticationPrincipal String email, @PathVariable("musicId") Long musicId) {
        return library.addFavorite(email, musicId);
    }

    @DeleteMapping("/favorites/{musicId}")
    public List<MusicResponse> removeFavorite(@AuthenticationPrincipal String email, @PathVariable("musicId") Long musicId) {
        return library.removeFavorite(email, musicId);
    }

    @GetMapping("/playlists")
    public List<PlaylistResponse> playlists(@AuthenticationPrincipal String email) {
        return library.playlists(email);
    }

    @PostMapping("/playlists")
    @ResponseStatus(HttpStatus.CREATED)
    public PlaylistResponse createPlaylist(
        @AuthenticationPrincipal String email,
        @Valid @RequestBody PlaylistRequest request
    ) {
        return library.createPlaylist(email, request);
    }

    @GetMapping("/playlists/{playlistId}/tracks")
    public List<MusicResponse> playlistTracks(
        @AuthenticationPrincipal String email,
        @PathVariable("playlistId") Long playlistId
    ) {
        return library.playlistTracks(email, playlistId);
    }

    @PutMapping("/playlists/{playlistId}/tracks/{musicId}")
    public PlaylistResponse addTrack(
        @AuthenticationPrincipal String email,
        @PathVariable("playlistId") Long playlistId,
        @PathVariable("musicId") Long musicId
    ) {
        return library.addTrack(email, playlistId, musicId);
    }

    @PostMapping("/history/{musicId}")
    @ResponseStatus(HttpStatus.CREATED)
    public void recordListening(@AuthenticationPrincipal String email, @PathVariable("musicId") Long musicId) {
        library.recordListening(email, musicId);
    }

    @GetMapping("/history")
    public List<HistoryResponse> history(@AuthenticationPrincipal String email) {
        return library.history(email);
    }

    @GetMapping("/statistics")
    public StatisticsResponse statistics(@AuthenticationPrincipal String email) {
        return library.statistics(email);
    }
}
