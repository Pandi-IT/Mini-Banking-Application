package com.bankease.controller;

import com.bankease.dto.AccountDto;
import com.bankease.dto.AdminStatsDto;
import com.bankease.dto.ApiResponse;
import com.bankease.dto.TransactionDto;
import com.bankease.dto.UserDto;
import com.bankease.mapper.AccountMapper;
import com.bankease.mapper.TransactionMapper;
import com.bankease.mapper.UserMapper;
import com.bankease.model.Account;
import com.bankease.model.Transaction;
import com.bankease.model.User;
import com.bankease.repository.AccountRepository;
import com.bankease.repository.TransactionRepository;
import com.bankease.repository.UserRepository;
import com.bankease.service.AccountService;
import com.bankease.service.TransactionService;
import com.bankease.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final UserService userService;
    private final AccountService accountService;
    private final TransactionService transactionService;
    
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    private final UserMapper userMapper;
    private final AccountMapper accountMapper;
    private final TransactionMapper transactionMapper;

    public AdminController(UserService userService, AccountService accountService, TransactionService transactionService,
                           UserRepository userRepository, AccountRepository accountRepository, TransactionRepository transactionRepository,
                           UserMapper userMapper, AccountMapper accountMapper, TransactionMapper transactionMapper) {
        this.userService = userService;
        this.accountService = accountService;
        this.transactionService = transactionService;
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.userMapper = userMapper;
        this.accountMapper = accountMapper;
        this.transactionMapper = transactionMapper;
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(Pageable pageable) {
        Page<User> users = userService.getAllUsers(pageable);
        Page<UserDto> dtos = users.map(userMapper::toDto);
        return ResponseEntity.ok(new ApiResponse(true, "Users list fetched successfully", dtos));
    }

    @GetMapping("/accounts")
    public ResponseEntity<?> getAccounts(Pageable pageable) {
        Page<Account> accounts = accountService.getAllAccounts(pageable);
        Page<AccountDto> dtos = accounts.map(accountMapper::toDto);
        return ResponseEntity.ok(new ApiResponse(true, "Accounts list fetched successfully", dtos));
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(Pageable pageable) {
        Page<Transaction> transactions = transactionService.getAllTransactions(pageable);
        Page<TransactionDto> dtos = transactions.map(transactionMapper::toDto);
        return ResponseEntity.ok(new ApiResponse(true, "Transactions list fetched successfully", dtos));
    }

    @PutMapping("/users/{userId}/status")
    public ResponseEntity<?> toggleUserBlock(
            @PathVariable Long userId,
            @RequestParam boolean enabled) {
        User user = userService.toggleUserBlockStatus(userId, enabled);
        UserDto dto = userMapper.toDto(user);
        String action = enabled ? "unblocked" : "blocked";
        return ResponseEntity.ok(new ApiResponse(true, "User " + action + " successfully", dto));
    }

    @PutMapping("/accounts/{accountNumber}/status")
    public ResponseEntity<?> toggleAccountBlock(
            @PathVariable String accountNumber,
            @RequestParam String status) {
        Account account = accountService.toggleAccountStatus(accountNumber, status);
        AccountDto dto = accountMapper.toDto(account);
        return ResponseEntity.ok(new ApiResponse(true, "Account status updated to " + status + " successfully", dto));
    }

    @GetMapping("/statistics")
    public ResponseEntity<?> getStatistics() {
        long totalUsers = userRepository.count();
        long totalAccounts = accountRepository.count();
        long totalTransactions = transactionRepository.count();
        java.math.BigDecimal totalBalance = accountRepository.sumAllBalances();
        long activeAccounts = accountRepository.countByStatus("ACTIVE");
        long blockedUsers = userRepository.countByEnabled(false);

        Map<String, Long> txTypeCount = new HashMap<>();
        txTypeCount.put("DEPOSIT", transactionRepository.countByTransactionType("DEPOSIT"));
        txTypeCount.put("WITHDRAWAL", transactionRepository.countByTransactionType("WITHDRAWAL"));
        txTypeCount.put("TRANSFER_OUT", transactionRepository.countByTransactionType("TRANSFER_OUT"));
        txTypeCount.put("TRANSFER_IN", transactionRepository.countByTransactionType("TRANSFER_IN"));

        AdminStatsDto stats = AdminStatsDto.builder()
                .totalUsers(totalUsers)
                .totalAccounts(totalAccounts)
                .totalTransactions(totalTransactions)
                .totalBalance(totalBalance)
                .activeAccounts(activeAccounts)
                .blockedUsers(blockedUsers)
                .transactionsByType(txTypeCount)
                .build();

        return ResponseEntity.ok(new ApiResponse(true, "Statistics fetched successfully", stats));
    }
}
