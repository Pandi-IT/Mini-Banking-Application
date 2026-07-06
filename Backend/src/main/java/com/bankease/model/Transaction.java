package com.bankease.model;


import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions", indexes = {
    @Index(name = "idx_account_id", columnList = "account_id"),
    @Index(name = "idx_timestamp", columnList = "timestamp")
})
public class Transaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false)
    private String transactionType; // DEPOSIT, WITHDRAWAL, TRANSFER

    @Column(nullable=false)
    private Double amount;

    @Column(nullable=false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name="account_id")
    @JsonBackReference
    private Account account;

    private String description;

    public Transaction() {}
    public Transaction(String transactionType, Double amount, Account account, String description){
        this.transactionType = transactionType; this.amount = amount; this.account = account; this.description = description;
    }
    // getters/setters
    public Long getId(){return id;}
    public String getTransactionType(){return transactionType;}
    public void setTransactionType(String t){this.transactionType=t;}
    public Double getAmount(){return amount;}
    public void setAmount(Double a){this.amount=a;}
    public LocalDateTime getTimestamp(){return timestamp;}
    public void setTimestamp(LocalDateTime ts){this.timestamp=ts;}
    public Account getAccount(){return account;}
    public void setAccount(Account a){this.account=a;}
    public String getDescription(){return description;}
    public void setDescription(String d){this.description=d;}
}
