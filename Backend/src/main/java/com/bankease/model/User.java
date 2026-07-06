package com.bankease.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.*;

@Entity
@Table(name = "users")
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

    @Column(nullable = false)
    private String role = "USER"; // USER or ADMIN

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Account> accounts = new ArrayList<>();

    // constructors, getters, setters
    public User() {
    }

    public User(String fullName, String email, String password, String role) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    // getters & setters ...
    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String n) {
        this.fullName = n;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String e) {
        this.email = e;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String p) {
        this.password = p;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String r) {
        this.role = r;
    }

    public List<Account> getAccounts() {
        return accounts;
    }

    public void setAccounts(List<Account> a) {
        this.accounts = a;
    }
}
