package com.bankease.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AuthRequest {
    @Email @NotBlank
    private String email;
    @NotBlank
    private String password;
    // getters/setters
    public String getEmail(){return email;}
    public void setEmail(String e){this.email=e;}
    public String getPassword(){return password;}
    public void setPassword(String p){this.password=p;}
}
