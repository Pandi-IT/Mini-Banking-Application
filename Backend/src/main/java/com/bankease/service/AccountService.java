package com.bankease.service;

import com.bankease.exception.ResourceNotFoundException;
import com.bankease.model.Account;
import com.bankease.model.User;
import com.bankease.repository.AccountRepository;
import com.bankease.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        Account acct = new Account();
        acct.setAccountType(accountType);
        acct.setAccountNumber(generateAccountNumber());
        acct.setBalance(0.0);
        acct.setUser(user);
        return accountRepository.save(acct);
    }

    @Cacheable(value = "user_accounts", key = "#userId")
    public List<Account> getAccountsByUser(Long userId) {
        // optionally confirm user exists
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

    public Optional<Account> findById(Long id){ return accountRepository.findById(id); }

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
    public void updateBalance(Account account, double newBalance) {
        account.setBalance(newBalance);
        accountRepository.save(account);
    }
}
