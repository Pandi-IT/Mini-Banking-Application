package com.bankease.controller;

import com.bankease.dto.ApiResponse;
import com.bankease.dto.TransferRequest;
import com.bankease.dto.TransactionDto;
import com.bankease.mapper.TransactionMapper;
import com.bankease.model.Transaction;
import com.bankease.service.TransactionService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionService txService;
    private final TransactionMapper txMapper;

    public TransactionController(TransactionService txService, TransactionMapper txMapper) {
        this.txService = txService;
        this.txMapper = txMapper;
    }

    @PostMapping("/deposit")
    public ResponseEntity<?> deposit(@RequestParam String accountNumber, @RequestParam BigDecimal amount) {
        Transaction tx = txService.deposit(accountNumber, amount, "Deposit");
        TransactionDto dto = txMapper.toDto(tx);
        return ResponseEntity.ok(new ApiResponse(true, "Deposit successful", dto));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(@RequestParam String accountNumber, @RequestParam BigDecimal amount) {
        Transaction tx = txService.withdraw(accountNumber, amount, "Withdrawal");
        TransactionDto dto = txMapper.toDto(tx);
        return ResponseEntity.ok(new ApiResponse(true, "Withdrawal successful", dto));
    }

    @PostMapping("/transfer")
    public ResponseEntity<?> transfer(@Valid @RequestBody TransferRequest req) {
        Transaction tx = txService.transfer(req.getFromAccount(), req.getToAccount(), req.getAmount(), "Transfer");
        TransactionDto dto = txMapper.toDto(tx);
        return ResponseEntity.ok(new ApiResponse(true, "Transfer successful", dto));
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<?> history(
            @PathVariable Long accountId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        Page<Transaction> history = txService.getHistoryWithFilters(accountId, type, startDate, endDate, search, pageable);
        Page<TransactionDto> dtos = history.map(txMapper::toDto);
        return ResponseEntity.ok(new ApiResponse(true, "Transaction history fetched successfully", dtos));
    }
}
