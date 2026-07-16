package com.bankease.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStatsDto {
    private long totalUsers;
    private long totalAccounts;
    private long totalTransactions;
    private BigDecimal totalBalance;
    private long activeAccounts;
    private long blockedUsers;
    private Map<String, Long> transactionsByType;
}
