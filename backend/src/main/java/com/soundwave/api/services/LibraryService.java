package com.soundwave.api.services;

import com.soundwave.api.dto.ApiDtos.*;
import com.soundwave.api.dto.ApiDtos.PlaylistRequest;
import com.soundwave.api.entities.*;
import com.soundwave.api.repositories.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LibraryService {
    private final UserRepository users;
    private final MusicRepository music;
    private final PlaylistRepository playlists;
    private final PlaylistMusicRepository playlistMusic;
    private final ListeningHistoryRepository history;

    public LibraryService(
        UserRepository users,
        MusicRepository music,
        PlaylistRepository playlists,
        PlaylistMusicRepository playlistMusic,
        ListeningHistoryRepository history
    ) {
        this.users = users;
        this.music = music;
        this.playlists = playlists;
        this.playlistMusic = playlistMusic;
        this.history = history;
    }

    @Transactional(readOnly = true)
    public List<MusicResponse> favorites(String email) {
        return user(email).getFavorites().stream().map(MusicService::toResponse).toList();
    }

    @Transactional
    public List<MusicResponse> addFavorite(String email, Long musicId) {
        User user = user(email);
        Music track = track(musicId);
        user.getFavorites().add(track);
        return favorites(email);
    }

    @Transactional
    public List<MusicResponse> removeFavorite(String email, Long musicId) {
        User user = user(email);
        user.getFavorites().removeIf(track -> track.getId().equals(musicId));
        return favorites(email);
    }

    @Transactional(readOnly = true)
    public List<PlaylistResponse> playlists(String email) {
        return playlists.findAllByUser_EmailOrderByCreatedAtDesc(email).stream()
            .map(this::playlistResponse).toList();
    }

    @Transactional
    public PlaylistResponse createPlaylist(String email, PlaylistRequest request) {
        String name = request.name() == null ? "" : request.name().trim();
        if (name.isBlank() || name.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Playlist name must contain 1 to 100 characters.");
        }
        String description = request.description() == null ? null : request.description().trim();
        if (description != null && description.length() > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Playlist description must not exceed 500 characters.");
        }
        return playlistResponse(playlists.save(new Playlist(name, description, user(email))));
    }

    @Transactional(readOnly = true)
    public List<MusicResponse> playlistTracks(String email, Long playlistId) {
        Playlist playlist = ownedPlaylist(email, playlistId);
        return playlistMusic.findAllByPlaylistIdOrderByPosition(playlist.getId()).stream()
            .map(item -> MusicService.toResponse(item.getMusic())).toList();
    }

    @Transactional
    public PlaylistResponse addTrack(String email, Long playlistId, Long musicId) {
        Playlist playlist = ownedPlaylist(email, playlistId);
        Music track = track(musicId);
        if (!playlistMusic.existsByPlaylistIdAndMusicId(playlistId, musicId)) {
            int nextPosition = playlistMusic.findFirstByPlaylistIdOrderByPositionDesc(playlistId)
                .map(item -> item.getPosition() + 1).orElse(0);
            playlistMusic.save(new PlaylistMusic(playlist, track, nextPosition));
        }
        return playlistResponse(playlist);
    }

    @Transactional
    public void recordListening(String email, Long musicId) {
        history.save(new ListeningHistory(user(email), track(musicId)));
    }

    @Transactional(readOnly = true)
    public List<HistoryResponse> history(String email) {
        return history.findTop50ByUser_EmailOrderByListenedAtDesc(email).stream()
            .map(item -> new HistoryResponse(item.getListenedAt(), MusicService.toResponse(item.getMusic())))
            .toList();
    }

    @Transactional(readOnly = true)
    public StatisticsResponse statistics(String email) {
        Instant since = Instant.now().minus(30, ChronoUnit.DAYS);
        return new StatisticsResponse(
            history.countListensByUser(email),
            history.countDistinctMusicByUser(email),
            history.sumListenedSecondsByUser(email),
            history.countListensSince(email, since)
        );
    }

    private PlaylistResponse playlistResponse(Playlist playlist) {
        int count = playlistMusic.findAllByPlaylistIdOrderByPosition(playlist.getId()).size();
        return new PlaylistResponse(playlist.getId(), playlist.getName(), playlist.getDescription(), count);
    }

    private Playlist ownedPlaylist(String email, Long playlistId) {
        return playlists.findByIdAndUser_Email(playlistId, email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Playlist not found."));
    }

    private User user(String email) {
        return users.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found."));
    }

    private Music track(Long id) {
        return music.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Track not found."));
    }
}
