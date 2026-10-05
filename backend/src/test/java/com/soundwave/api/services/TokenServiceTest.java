package com.soundwave.api.services;

import static org.junit.jupiter.api.Assertions.*;

import java.time.Duration;
import org.junit.jupiter.api.Test;

class TokenServiceTest {
    private static final String SECRET = "test-only-secret-key-with-at-least-32-bytes";

    @Test
    void issuedTokenContainsTheAccountEmailAndExpiry() {
        TokenService service = new TokenService(SECRET, Duration.ofHours(1));

        TokenService.IssuedToken issued = service.issue("listener@example.com");

        assertEquals("listener@example.com", service.parseSubject(issued.value()));
        assertTrue(issued.expiresAt().isAfter(java.time.Instant.now()));
    }

    @Test
    void rejectsSecretsThatCannotSecureAnHmacKey() {
        assertThrows(IllegalArgumentException.class, () -> new TokenService("too-short", Duration.ofHours(1)));
    }
}
