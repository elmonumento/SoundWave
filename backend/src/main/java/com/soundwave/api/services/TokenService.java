package com.soundwave.api.services;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TokenService {
    private final SecretKey key;
    private final Duration tokenTtl;

    public TokenService(
        @Value("${soundwave.security.jwt-secret}") String secret,
        @Value("${soundwave.security.token-ttl}") Duration tokenTtl
    ) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalArgumentException("JWT_SECRET must contain at least 32 UTF-8 bytes.");
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.tokenTtl = tokenTtl;
    }

    public IssuedToken issue(String email) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(tokenTtl);
        String token = Jwts.builder()
            .subject(email)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiresAt))
            .signWith(key)
            .compact();
        return new IssuedToken(token, expiresAt);
    }

    public String parseSubject(String token) {
        return Jwts.parser().verifyWith(key).build()
            .parseSignedClaims(token).getPayload().getSubject();
    }

    public record IssuedToken(String value, Instant expiresAt) {}
}
