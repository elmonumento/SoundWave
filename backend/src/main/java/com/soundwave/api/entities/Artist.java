package com.soundwave.api.entities;

import jakarta.persistence.*;

@Entity
public class Artist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(columnDefinition = "text")
    private String biography;

    protected Artist() {}

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getBiography() { return biography; }
}
