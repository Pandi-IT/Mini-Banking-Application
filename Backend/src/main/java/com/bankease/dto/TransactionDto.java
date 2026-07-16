package com.bankease.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionDto {
    private Long id;
    private String transactionType;
    private BigDecimal amount;
    private LocalDateTime timestamp;
    private String description;
    private String sourceAccountNumber;
    private String destinationAccountNumber;
    private String accountNumber;
}
