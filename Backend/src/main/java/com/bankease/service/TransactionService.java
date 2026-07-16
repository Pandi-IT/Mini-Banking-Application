package com.bankease.service;

import com.bankease.exception.ResourceNotFoundException;
import com.bankease.model.Account;
import com.bankease.model.Transaction;
import com.bankease.repository.TransactionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final AccountService accountService;

    public TransactionService(TransactionRepository transactionRepository, AccountService accountService) {
        this.transactionRepository = transactionRepository;
        this.accountService = accountService;
    }

    private void validateAccountStatus(Account account) {
        if (!"ACTIVE".equals(account.getStatus())) {
            throw new IllegalArgumentException("Account is inactive or blocked: " + account.getAccountNumber());
        }
        if (account.getUser() != null && !account.getUser().isEnabled()) {
            throw new IllegalArgumentException("User account is blocked: " + account.getUser().getEmail());
        }
    }

    @Transactional
    public Transaction deposit(String accountNumber, BigDecimal amount, String desc) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        Account acc = accountService.getByAccountNumber(accountNumber);
        validateAccountStatus(acc);

        acc.setBalance(acc.getBalance().add(amount));
        accountService.updateBalance(acc, acc.getBalance());

        Transaction tx = Transaction.builder()
                .transactionType("DEPOSIT")
                .amount(amount)
                .account(acc)
                .description(desc)
                .sourceAccountNumber(null)
                .destinationAccountNumber(accountNumber)
                .build();
        return transactionRepository.save(tx);
    }

    @Transactional
    public Transaction withdraw(String accountNumber, BigDecimal amount, String desc) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        Account acc = accountService.getByAccountNumber(accountNumber);
        validateAccountStatus(acc);

        if (acc.getBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient balance");
        }
        
        acc.setBalance(acc.getBalance().subtract(amount));
        accountService.updateBalance(acc, acc.getBalance());

        Transaction tx = Transaction.builder()
                .transactionType("WITHDRAWAL")
                .amount(amount)
                .account(acc)
                .description(desc)
                .sourceAccountNumber(accountNumber)
                .destinationAccountNumber(null)
                .build();
        return transactionRepository.save(tx);
    }

    @Transactional
    public Transaction transfer(String fromAccount, String toAccount, BigDecimal amount, String desc) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        if (fromAccount.equals(toAccount)) {
            throw new IllegalArgumentException("Cannot transfer to the same account");
        }

        Account src = accountService.getByAccountNumber(fromAccount);
        Account dst = accountService.getByAccountNumber(toAccount);
        
        validateAccountStatus(src);
        validateAccountStatus(dst);

        if (src.getBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient balance");
        }

        src.setBalance(src.getBalance().subtract(amount));
        dst.setBalance(dst.getBalance().add(amount));
        
        accountService.updateBalance(src, src.getBalance());
        accountService.updateBalance(dst, dst.getBalance());

        Transaction outTx = Transaction.builder()
                .transactionType("TRANSFER_OUT")
                .amount(amount)
                .account(src)
                .description(desc != null ? desc : "Transfer to " + toAccount)
                .sourceAccountNumber(fromAccount)
                .destinationAccountNumber(toAccount)
                .build();

        Transaction inTx = Transaction.builder()
                .transactionType("TRANSFER_IN")
                .amount(amount)
                .account(dst)
                .description(desc != null ? desc : "Transfer from " + fromAccount)
                .sourceAccountNumber(fromAccount)
                .destinationAccountNumber(toAccount)
                .build();

        transactionRepository.save(inTx);
        return transactionRepository.save(outTx);
    }

    public Page<Transaction> getByAccountId(Long accountId, Pageable pageable) {
        accountService.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));
        return transactionRepository.findByAccountIdOrderByTimestampDesc(accountId, pageable);
    }

    public Page<Transaction> getHistoryWithFilters(
            Long accountId,
            String type,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String search,
            Pageable pageable) {
        
        accountService.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));
        return transactionRepository.findHistoryWithFilters(accountId, type, startDate, endDate, search, pageable);
    }

    public Page<Transaction> getAllTransactions(Pageable pageable) {
        return transactionRepository.findAll(pageable);
    }
}
