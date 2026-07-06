package com.bankease.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class TransferRequest {
    @NotBlank
    private String fromAccount;
    @NotBlank
    private String toAccount;
    @NotNull @Positive
    private Double amount;
    // getters/setters
    public String getFromAccount(){return fromAccount;}
    public void setFromAccount(String a){this.fromAccount=a;}
    public String getToAccount(){return toAccount;}
    public void setToAccount(String a){this.toAccount=a;}
    public Double getAmount(){return amount;}
    public void setAmount(Double a){this.amount=a;}
}

