package com.bankease.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

@Component
public class IdempotencyFilter extends OncePerRequestFilter {

    private final RedisTemplate<String, String> redisTemplate;

    public IdempotencyFilter(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String key = request.getHeader("X-Idempotency-Key");
        if (key == null || !request.getMethod().equals("POST")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
                response.setStatus(HttpServletResponse.SC_CONFLICT);
                response.getWriter().write("Duplicate request detected.");
                return;
            }
            redisTemplate.opsForValue().set(key, "PROCESSED", java.util.Objects.requireNonNull(Duration.ofHours(24)));
        } catch (Exception e) {
            // Log and skip idempotency if Redis is down
            System.err.println("Idempotency check failed (Redis down?): " + e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }
}
