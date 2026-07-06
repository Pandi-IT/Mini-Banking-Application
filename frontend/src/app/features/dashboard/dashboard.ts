import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { AccountService, Account } from '../../core/account.service';
import { TransactionService, Transaction } from '../../core/transaction.service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, DatePipe, CurrencyPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  public readonly authService = inject(AuthService);
  private readonly accountService = inject(AccountService);
  private readonly transactionService = inject(TransactionService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  // State Signals
  accounts = signal<Account[]>([]);
  selectedAccount = signal<Account | null>(null);
  transactions = signal<Transaction[]>([]);
  
  // Pagination
  currentPage = signal(0);
  pageSize = signal(5);
  totalPages = signal(0);
  totalElements = signal(0);
  
  // Loading states
  isLoadingAccounts = signal(false);
  isLoadingTransactions = signal(false);
  isSubmittingAction = signal(false);

  // Modal Visibility Signals
  showCreateModal = signal(false);
  showDepositModal = signal(false);
  showWithdrawModal = signal(false);
  showTransferModal = signal(false);

  // Modal Form Inputs
  newAccountType = 'SAVINGS';
  
  depositAmount = 0;
  
  withdrawAmount = 0;
  
  transferTarget = '';
  transferAmount = 0;

  // Computed signals
  totalBalance = computed(() => {
    return this.accounts().reduce((sum, acc) => sum + acc.balance, 0);
  });

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(selectFirst: boolean = true): void {
    const user = this.authService.currentUser();
    if (!user) return;

    this.isLoadingAccounts.set(true);
    this.accountService.getUserAccounts(user.id).subscribe({
      next: (data) => {
        this.isLoadingAccounts.set(false);
        this.accounts.set(data);
        if (data.length > 0) {
          if (selectFirst || !this.selectedAccount()) {
            this.selectAccount(data[0]);
          } else {
            // refresh selected account details
            const currentSelected = this.selectedAccount();
            const updated = data.find(a => a.id === currentSelected?.id);
            if (updated) this.selectedAccount.set(updated);
          }
        } else {
          this.selectedAccount.set(null);
          this.transactions.set([]);
        }
      },
      error: () => {
        this.isLoadingAccounts.set(false);
        this.notificationService.error('Failed to load accounts.');
      }
    });
  }

  selectAccount(account: Account): void {
    this.selectedAccount.set(account);
    this.currentPage.set(0);
    this.loadTransactions();
  }

  loadTransactions(): void {
    const account = this.selectedAccount();
    if (!account) return;

    this.isLoadingTransactions.set(true);
    this.transactionService.getTransactionHistory(account.id, this.currentPage(), this.pageSize()).subscribe({
      next: (res) => {
        this.isLoadingTransactions.set(false);
        if (res && res.success && res.data) {
          this.transactions.set(res.data.content);
          this.totalPages.set(res.data.totalPages);
          this.totalElements.set(res.data.totalElements);
        }
      },
      error: () => {
        this.isLoadingTransactions.set(false);
        this.notificationService.error('Failed to load transaction history.');
      }
    });
  }

  changePage(direction: number): void {
    const next = this.currentPage() + direction;
    if (next >= 0 && next < this.totalPages()) {
      this.currentPage.set(next);
      this.loadTransactions();
    }
  }

  // Create Account Action
  onCreateAccountSubmit(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    this.isSubmittingAction.set(true);
    this.accountService.createAccount(user.id, this.newAccountType).subscribe({
      next: (res) => {
        this.isSubmittingAction.set(false);
        if (res && res.success) {
          this.notificationService.success('Account created successfully!');
          this.showCreateModal.set(false);
          this.loadAccounts(false); // reload accounts but keep selection if possible
        } else {
          this.notificationService.error(res?.message || 'Failed to create account.');
        }
      },
      error: (err) => {
        this.isSubmittingAction.set(false);
        this.notificationService.error(err.error?.message || 'Failed to create account.');
      }
    });
  }

  // Deposit Action
  onDepositSubmit(): void {
    const account = this.selectedAccount();
    if (!account || this.depositAmount <= 0) return;

    this.isSubmittingAction.set(true);
    this.transactionService.deposit(account.accountNumber, this.depositAmount).subscribe({
      next: (res) => {
        this.isSubmittingAction.set(false);
        if (res && res.success) {
          this.notificationService.success(`Successfully deposited $${this.depositAmount}`);
          this.showDepositModal.set(false);
          this.depositAmount = 0;
          this.loadAccounts(false);
          this.loadTransactions();
        } else {
          this.notificationService.error(res?.message || 'Deposit failed.');
        }
      },
      error: (err) => {
        this.isSubmittingAction.set(false);
        this.notificationService.error(err.error?.message || 'Deposit failed.');
      }
    });
  }

  // Withdraw Action
  onWithdrawSubmit(): void {
    const account = this.selectedAccount();
    if (!account || this.withdrawAmount <= 0) return;

    this.isSubmittingAction.set(true);
    this.transactionService.withdraw(account.accountNumber, this.withdrawAmount).subscribe({
      next: (res) => {
        this.isSubmittingAction.set(false);
        if (res && res.success) {
          this.notificationService.success(`Successfully withdrew $${this.withdrawAmount}`);
          this.showWithdrawModal.set(false);
          this.withdrawAmount = 0;
          this.loadAccounts(false);
          this.loadTransactions();
        } else {
          this.notificationService.error(res?.message || 'Withdrawal failed.');
        }
      },
      error: (err) => {
        this.isSubmittingAction.set(false);
        this.notificationService.error(err.error?.message || 'Withdrawal failed.');
      }
    });
  }

  // Transfer Action
  onTransferSubmit(): void {
    const account = this.selectedAccount();
    if (!account || !this.transferTarget || this.transferAmount <= 0) return;

    this.isSubmittingAction.set(true);
    this.transactionService.transfer(account.accountNumber, this.transferTarget, this.transferAmount).subscribe({
      next: (res) => {
        this.isSubmittingAction.set(false);
        if (res && res.success) {
          this.notificationService.success(`Successfully transferred $${this.transferAmount} to ${this.transferTarget}`);
          this.showTransferModal.set(false);
          this.transferTarget = '';
          this.transferAmount = 0;
          this.loadAccounts(false);
          this.loadTransactions();
        } else {
          this.notificationService.error(res?.message || 'Transfer failed.');
        }
      },
      error: (err) => {
        this.isSubmittingAction.set(false);
        this.notificationService.error(err.error?.message || 'Transfer failed.');
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.notificationService.info('Logged out successfully.');
  }
}
