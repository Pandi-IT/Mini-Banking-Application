package com.bankease.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.*;

@Entity
@Table(name = "accounts", indexes = {
        @Index(name = "idx_user_id", columnList = "user_id")
})
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String accountNumber;

    @Column(nullable = false)
    private String accountType; // SAVINGS, CURRENT

    @Column(nullable = false)
    private Double balance = 0.0;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonBackReference
    private User user;

    @JsonIgnore
    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL)
    private List<Transaction> transactions = new ArrayList<>();

    public Account() {
    }

    public Account(String accountNumber, String accountType, Double balance, User user) {
        this.accountNumber = accountNumber;
        this.accountType = accountType;
        this.balance = balance;
        this.user = user;
    }

    // getters / setters
    public Long getId() {
        return id;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String an) {
        this.accountNumber = an;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String t) {
        this.accountType = t;
    }

    public Double getBalance() {
        return balance;
    }

    public void setBalance(Double b) {
        this.balance = b;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User u) {
        this.user = u;
    }

    public List<Transaction> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<Transaction> t) {
        this.transactions = t;
    }
}
