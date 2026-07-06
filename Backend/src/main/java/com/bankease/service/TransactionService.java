package com.bankease.service;

import com.bankease.exception.ResourceNotFoundException;
import com.bankease.model.Account;
import com.bankease.model.Transaction;
import com.bankease.repository.TransactionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final AccountService accountService;

    public TransactionService(TransactionRepository transactionRepository, AccountService accountService) {
        this.transactionRepository = transactionRepository;
        this.accountService = accountService;
    }

    @Transactional
    public Transaction deposit(String accountNumber, Double amount, String desc) {
        if (amount == null || amount <= 0) throw new IllegalArgumentException("Amount must be positive");
        Account acc = accountService.getByAccountNumber(accountNumber);
        acc.setBalance(acc.getBalance() + amount);
        accountService.updateBalance(acc, acc.getBalance());
        Transaction tx = new Transaction("DEPOSIT", amount, acc, desc);
        return transactionRepository.save(tx);
    }

    @Transactional
    public Transaction withdraw(String accountNumber, Double amount, String desc) {
        if (amount == null || amount <= 0) throw new IllegalArgumentException("Amount must be positive");
        Account acc = accountService.getByAccountNumber(accountNumber);
        if (acc.getBalance() < amount) throw new IllegalArgumentException("Insufficient balance");
        acc.setBalance(acc.getBalance() - amount);
        accountService.updateBalance(acc, acc.getBalance());
        Transaction tx = new Transaction("WITHDRAWAL", amount, acc, desc);
        return transactionRepository.save(tx);
    }

    @Transactional
    public Transaction transfer(String fromAccount, String toAccount, Double amount, String desc) {
        if (amount == null || amount <= 0) throw new IllegalArgumentException("Amount must be positive");
        Account src = accountService.getByAccountNumber(fromAccount);
        Account dst = accountService.getByAccountNumber(toAccount);
        if (src.getBalance() < amount) throw new IllegalArgumentException("Insufficient balance");
        src.setBalance(src.getBalance() - amount);
        dst.setBalance(dst.getBalance() + amount);
        accountService.updateBalance(src, src.getBalance());
        accountService.updateBalance(dst, dst.getBalance());

        Transaction outTx = new Transaction("TRANSFER_OUT", amount, src, "transfer to " + toAccount);
        Transaction inTx = new Transaction("TRANSFER_IN", amount, dst, "transfer from " + fromAccount);
        transactionRepository.save(outTx);
        transactionRepository.save(inTx);

        Transaction tx = new Transaction("TRANSFER", amount, src, desc);
        return transactionRepository.save(tx);
    }

    public Page<Transaction> getByAccountId(Long accountId, Pageable pageable) {
        // confirm account exists
        accountService.findById(accountId).orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));
        return transactionRepository.findByAccountIdOrderByTimestampDesc(accountId, pageable);
    }
}
