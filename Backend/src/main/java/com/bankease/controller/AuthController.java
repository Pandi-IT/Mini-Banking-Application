package com.bankease.controller;

import com.bankease.dto.*;
import com.bankease.mapper.UserMapper;
import com.bankease.model.RefreshToken;
import com.bankease.model.User;
import com.bankease.security.JwtUtil;
import com.bankease.service.RefreshTokenService;
import com.bankease.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final UserMapper userMapper;

    public AuthController(UserService userService, AuthenticationManager authenticationManager,
                          JwtUtil jwtUtil, RefreshTokenService refreshTokenService, UserMapper userMapper) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.refreshTokenService = refreshTokenService;
        this.userMapper = userMapper;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        User u = userService.register(req.getFullName(), req.getEmail(), req.getPassword());
        UserDto dto = userMapper.toDto(u);
        return ResponseEntity.ok(new ApiResponse(true, "User registered successfully", dto));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest req) {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Invalid credentials", null));
        } catch (DisabledException ex) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "Your account has been blocked by the Administrator", null));
        }

        User user = userService.findByEmail(req.getEmail());
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        AuthResponse resp = AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken.getToken())
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
        return ResponseEntity.ok(new ApiResponse(true, "Login successful", resp));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody TokenRefreshRequest req) {
        String requestRefreshToken = req.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
                    // Generate new refresh token to support sliding session window
                    RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getId());
                    TokenRefreshResponse resp = TokenRefreshResponse.builder()
                            .accessToken(token)
                            .refreshToken(newRefreshToken.getToken())
                            .build();
                    return ResponseEntity.ok(new ApiResponse(true, "Token refreshed successfully", resp));
                })
                .orElseThrow(() -> new IllegalArgumentException("Refresh token is not in database!"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        String token = userService.generatePasswordResetToken(req.getEmail());
        // For a production app we would send an email here.
        // For our junior developer app, we will print it to console and return success message.
        System.out.println("[SMTP Emulator] Sent password reset link. Reset Token: " + token);
        return ResponseEntity.ok(new ApiResponse(true, "Password reset link sent (Console Logged)", token));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        userService.resetPassword(req.getToken(), req.getNewPassword());
        return ResponseEntity.ok(new ApiResponse(true, "Password reset successfully", null));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest req) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }
        User user = userService.findByEmail(userDetails.getUsername());
        userService.changePassword(user.getId(), req.getCurrentPassword(), req.getNewPassword());
        return ResponseEntity.ok(new ApiResponse(true, "Password changed successfully", null));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails != null) {
            User user = userService.findByEmail(userDetails.getUsername());
            refreshTokenService.deleteByUserId(user.getId());
        }
        return ResponseEntity.ok(new ApiResponse(true, "Logout successful", null));
    }
}
