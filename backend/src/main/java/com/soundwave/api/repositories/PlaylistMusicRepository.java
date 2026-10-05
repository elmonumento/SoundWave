package com.soundwave.api.repositories;

import com.soundwave.api.entities.PlaylistMusic;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaylistMusicRepository extends JpaRepository<PlaylistMusic, Long> {
    List<PlaylistMusic> findAllByPlaylistIdOrderByPosition(Long playlistId);
    Optional<PlaylistMusic> findFirstByPlaylistIdOrderByPositionDesc(Long playlistId);
    boolean existsByPlaylistIdAndMusicId(Long playlistId, Long musicId);
}
