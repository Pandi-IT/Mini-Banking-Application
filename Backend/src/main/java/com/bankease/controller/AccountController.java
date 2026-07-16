package com.bankease.controller;

import com.bankease.dto.AccountDto;
import com.bankease.dto.ApiResponse;
import com.bankease.mapper.AccountMapper;
import com.bankease.model.Account;
import com.bankease.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    private final AccountService accountService;
    private final AccountMapper accountMapper;

    public AccountController(AccountService accountService, AccountMapper accountMapper) {
        this.accountService = accountService;
        this.accountMapper = accountMapper;
    }

    @PostMapping("/{userId}")
    public ResponseEntity<?> createAccount(@PathVariable Long userId, @RequestParam(defaultValue = "SAVINGS") String type) {
        Account a = accountService.createAccount(userId, type);
        AccountDto dto = accountMapper.toDto(a);
        return ResponseEntity.ok(new ApiResponse(true, "Account created successfully", dto));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserAccounts(@PathVariable Long userId) {
        List<Account> accounts = accountService.getAccountsByUser(userId);
        List<AccountDto> dtos = accounts.stream()
                .map(accountMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{accountNumber}/balance")
    public ResponseEntity<?> getBalance(@PathVariable String accountNumber) {
        Account a = accountService.getByAccountNumber(accountNumber);
        return ResponseEntity.ok(new ApiResponse(true, "Balance fetched successfully", a.getBalance()));
    }
}
