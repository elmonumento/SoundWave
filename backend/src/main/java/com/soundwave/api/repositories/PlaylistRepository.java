package com.soundwave.api.repositories;

import com.soundwave.api.entities.Playlist;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaylistRepository extends JpaRepository<Playlist, Long> {
    List<Playlist> findAllByUser_EmailOrderByCreatedAtDesc(String email);
    Optional<Playlist> findByIdAndUser_Email(Long id, String email);
}
