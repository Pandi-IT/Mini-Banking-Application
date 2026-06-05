package com.bankease.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    @NotBlank
    private String fullName;

    @Email @NotBlank
    private String email;

    @NotBlank @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    // getters/setters...
    public String getFullName(){return fullName;}
    public void setFullName(String n){this.fullName=n;}
    public String getEmail(){return email;}
    public void setEmail(String e){this.email=e;}
    public String getPassword(){return password;}
    public void setPassword(String p){this.password=p;}
}


