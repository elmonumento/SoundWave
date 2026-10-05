package com.soundwave.api.controllers;

import com.soundwave.api.dto.ApiDtos.MusicResponse;
import com.soundwave.api.services.MusicService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/music")
public class MusicController {
    private final MusicService musicService;

    public MusicController(MusicService musicService) {
        this.musicService = musicService;
    }

    @GetMapping
    public List<MusicResponse> search(@RequestParam(name = "q", required = false) String q) {
        return musicService.search(q);
    }

    @GetMapping("/{id}")
    public MusicResponse get(@PathVariable("id") Long id) {
        return musicService.get(id);
    }
}
