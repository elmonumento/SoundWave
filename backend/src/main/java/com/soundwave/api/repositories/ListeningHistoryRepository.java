package com.soundwave.api.repositories;

import com.soundwave.api.entities.ListeningHistory;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ListeningHistoryRepository extends JpaRepository<ListeningHistory, Long> {
    List<ListeningHistory> findTop50ByUser_EmailOrderByListenedAtDesc(String email);

    @Query("select count(h) from ListeningHistory h where h.user.email = :email")
    long countListensByUser(@Param("email") String email);

    @Query("""
        select coalesce(sum(h.music.durationSeconds), 0)
        from ListeningHistory h where h.user.email = :email
        """)
    long sumListenedSecondsByUser(@Param("email") String email);

    @Query("select count(distinct h.music.id) from ListeningHistory h where h.user.email = :email")
    long countDistinctMusicByUser(@Param("email") String email);

    @Query("select count(h) from ListeningHistory h where h.user.email = :email and h.listenedAt >= :since")
    long countListensSince(@Param("email") String email, @Param("since") Instant since);
}
