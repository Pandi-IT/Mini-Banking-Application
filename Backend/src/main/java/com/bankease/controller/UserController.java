package com.bankease.controller;

import com.bankease.dto.ApiResponse;
import com.bankease.dto.UserDto;
import com.bankease.dto.UserProfileUpdateDto;
import com.bankease.mapper.UserMapper;
import com.bankease.model.User;
import com.bankease.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import java.io.IOException;
import java.nio.file.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    private final UserMapper userMapper;

    public UserController(UserService userService, UserMapper userMapper) {
        this.userService = userService;
        this.userMapper = userMapper;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }
        User user = userService.findByEmail(userDetails.getUsername());
        UserDto dto = userMapper.toDto(user);
        return ResponseEntity.ok(new ApiResponse(true, "Profile fetched successfully", dto));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UserProfileUpdateDto req) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }
        User user = userService.findByEmail(userDetails.getUsername());
        User updated = userService.updateProfile(user.getId(), req.getFullName());
        UserDto dto = userMapper.toDto(updated);
        return ResponseEntity.ok(new ApiResponse(true, "Profile updated successfully", dto));
    }

    @PostMapping("/profile/picture")
    public ResponseEntity<?> uploadProfilePicture(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized", null));
        }
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "File cannot be empty", null));
        }

        User user = userService.findByEmail(userDetails.getUsername());
        
        try {
            // Setup local uploads folder in project directory
            String uploadDir = "uploads/avatars/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate filename based on user email
            String extension = "";
            String originalFilename = file.getOriginalFilename();
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = "avatar_" + user.getId() + "_" + System.currentTimeMillis() + extension;
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Save relative URL path to database
            String relativeUrl = "/api/users/profile/picture/view/" + filename;
            User updated = userService.updateProfilePicture(user.getId(), relativeUrl);
            UserDto dto = userMapper.toDto(updated);
            
            return ResponseEntity.ok(new ApiResponse(true, "Profile picture uploaded successfully", dto));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(new ApiResponse(false, "Failed to upload file: " + e.getMessage(), null));
        }
    }

    @GetMapping("/profile/picture/view/{filename:.+}")
    public ResponseEntity<org.springframework.core.io.Resource> getProfilePicture(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("uploads/avatars/").resolve(filename).normalize();
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "image/jpeg")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
