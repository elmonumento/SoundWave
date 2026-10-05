package com.soundwave.api.repositories;

import com.soundwave.api.entities.Music;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MusicRepository extends JpaRepository<Music, Long> {
    @EntityGraph(attributePaths = {"album", "album.artist"})
    @Query("""
        select m from Music m
        where :query is null
           or lower(m.title) like lower(concat('%', :query, '%'))
           or lower(m.album.title) like lower(concat('%', :query, '%'))
           or lower(m.album.artist.name) like lower(concat('%', :query, '%'))
        order by m.title
        """)
    List<Music> search(@Param("query") String query);

    @EntityGraph(attributePaths = {"album", "album.artist"})
    List<Music> findAllByIdIn(Iterable<Long> ids);
}
