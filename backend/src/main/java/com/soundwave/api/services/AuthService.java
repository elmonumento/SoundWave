package com.soundwave.api.services;

import com.soundwave.api.dto.ApiDtos.TokenResponse;
import com.soundwave.api.dto.ApiDtos.UserResponse;
import com.soundwave.api.dto.AuthRequests.Login;
import com.soundwave.api.dto.AuthRequests.Register;
import com.soundwave.api.entities.User;
import com.soundwave.api.repositories.UserRepository;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokens;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, TokenService tokens) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.tokens = tokens;
    }

    @Transactional
    public TokenResponse register(Register request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        User user = users.save(new User(
            request.displayName().trim(),
            email,
            passwordEncoder.encode(request.password())
        ));
        return tokenResponse(user);
    }

    @Transactional(readOnly = true)
    public TokenResponse login(Login request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        User user = users.findByEmailIgnoreCase(email)
            .filter(candidate -> passwordEncoder.matches(request.password(), candidate.getPasswordHash()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect."));
        return tokenResponse(user);
    }

    private TokenResponse tokenResponse(User user) {
        TokenService.IssuedToken token = tokens.issue(user.getEmail());
        return new TokenResponse(
            token.value(),
            "Bearer",
            token.expiresAt(),
            new UserResponse(user.getId(), user.getDisplayName(), user.getEmail())
        );
    }
}
