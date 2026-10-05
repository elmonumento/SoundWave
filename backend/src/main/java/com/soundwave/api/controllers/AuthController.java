package com.soundwave.api.controllers;

import com.soundwave.api.dto.ApiDtos.TokenResponse;
import com.soundwave.api.dto.AuthRequests.Login;
import com.soundwave.api.dto.AuthRequests.Register;
import com.soundwave.api.services.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public TokenResponse register(@Valid @RequestBody Register request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody Login request) {
        return authService.login(request);
    }
}
