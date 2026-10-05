package com.soundwave.api.services;

import com.soundwave.api.dto.ApiDtos.MusicResponse;
import com.soundwave.api.entities.Music;
import com.soundwave.api.repositories.MusicRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class MusicService {
    private final MusicRepository musicRepository;

    public MusicService(MusicRepository musicRepository) {
        this.musicRepository = musicRepository;
    }

    @Transactional(readOnly = true)
    public List<MusicResponse> search(String query) {
        String normalized = query == null || query.isBlank() ? null : query.trim();
        return musicRepository.search(normalized).stream().map(MusicService::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public MusicResponse get(Long id) {
        Music music = musicRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Track not found."));
        return toResponse(music);
    }

    public static MusicResponse toResponse(Music music) {
        return new MusicResponse(
            music.getId(),
            music.getTitle(),
            music.getDurationSeconds(),
            music.getAudioUrl(),
            music.getAlbum().getArtist().getName(),
            music.getAlbum().getTitle(),
            music.getAlbum().getCoverUrl()
        );
    }
}
