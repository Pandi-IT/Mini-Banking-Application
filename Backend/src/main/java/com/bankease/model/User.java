package com.bankease.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password; // BCrypt hashed

    @Builder.Default
    @Column(nullable = false)
    private String role = "USER"; // USER or ADMIN

    @Builder.Default
    @Column(nullable = false)
    private boolean enabled = true; // For block/unblock

    private String profilePictureUrl;

    private String passwordResetToken;

    private LocalDateTime passwordResetExpiry;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    @Builder.Default
    private List<Account> accounts = new ArrayList<>();
}
