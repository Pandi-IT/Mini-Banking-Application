package com.bankease.service;

import com.bankease.exception.ResourceNotFoundException;
import com.bankease.model.Account;
import com.bankease.model.User;
import com.bankease.repository.AccountRepository;
import com.bankease.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.*;

@Service
public class AccountService {
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public AccountService(AccountRepository accountRepository, UserRepository userRepository) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
    }

    @CacheEvict(value = "user_accounts", key = "#userId")
    public Account createAccount(Long userId, String accountType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        
        Account acct = Account.builder()
                .accountType(accountType)
                .accountNumber(generateAccountNumber())
                .balance(BigDecimal.ZERO)
                .status("ACTIVE")
                .user(user)
                .build();
        return accountRepository.save(acct);
    }

    @Cacheable(value = "user_accounts", key = "#userId")
    public List<Account> getAccountsByUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with ID: " + userId);
        }
        return accountRepository.findByUserId(userId);
    }

    @Cacheable(value = "accounts", key = "#accountNumber")
    public Account getByAccountNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountNumber));
    }

    public Optional<Account> findById(Long id){ 
        return accountRepository.findById(id); 
    }

    private String generateAccountNumber() {
        String prefix = "BA";
        long rand = (long)(Math.random() * 1_000_000_000L);
        return prefix + String.format("%010d", rand);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "accounts", key = "#account.accountNumber"),
        @CacheEvict(value = "user_accounts", key = "#account.user.id")
    })
    public void updateBalance(Account account, BigDecimal newBalance) {
        account.setBalance(newBalance);
        accountRepository.save(account);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "accounts", key = "#accountNumber"),
        @CacheEvict(value = "user_accounts", allEntries = true)
    })
    public Account toggleAccountStatus(String accountNumber, String status) {
        Account account = getByAccountNumber(accountNumber);
        if (!status.equals("ACTIVE") && !status.equals("BLOCKED")) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }
        account.setStatus(status);
        return accountRepository.save(account);
    }

    public Page<Account> getAllAccounts(Pageable pageable) {
        return accountRepository.findAll(pageable);
    }
}
