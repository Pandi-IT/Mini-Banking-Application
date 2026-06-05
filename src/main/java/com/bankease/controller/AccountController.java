package com.bankease.controller;

import com.bankease.dto.ApiResponse;
import com.bankease.model.Account;
import com.bankease.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    private final AccountService accountService;
    public AccountController(AccountService accountService) { this.accountService = accountService; }

    @PostMapping("/{userId}")
    public ResponseEntity<?> createAccount(@PathVariable Long userId, @RequestParam(defaultValue = "SAVINGS") String type) {
        Account a = accountService.createAccount(userId, type);
        return ResponseEntity.ok(new ApiResponse(true, "Account created", a));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Account>> getUserAccounts(@PathVariable Long userId) {
        List<Account> accounts = accountService.getAccountsByUser(userId);
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/{accountNumber}/balance")
    public ResponseEntity<?> getBalance(@PathVariable String accountNumber) {
        Account a = accountService.getByAccountNumber(accountNumber);
        return ResponseEntity.ok(new ApiResponse(true, "Balance fetched", a.getBalance()));
    }
}
