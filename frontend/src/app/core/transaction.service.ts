import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly http = inject(HttpClient);

  private createIdempotencyHeader(): HttpHeaders {
    // Generate a unique UUID for idempotency in the browser
    const uuid = crypto.randomUUID();
    return new HttpHeaders({
      'X-Idempotency-Key': uuid
    });
  }

  deposit(accountNumber: string, amount: number): Observable<ApiResponse<Transaction>> {
    const headers = this.createIdempotencyHeader();
    return this.http.post<ApiResponse<Transaction>>(
      `/api/transactions/deposit?accountNumber=${accountNumber}&amount=${amount}`,
      {},
      { headers }
    );
  }

  withdraw(accountNumber: string, amount: number): Observable<ApiResponse<Transaction>> {
    const headers = this.createIdempotencyHeader();
    return this.http.post<ApiResponse<Transaction>>(
      `/api/transactions/withdraw?accountNumber=${accountNumber}&amount=${amount}`,
      {},
      { headers }
    );
  }

  transfer(fromAccount: string, toAccount: string, amount: number): Observable<ApiResponse<Transaction>> {
    const headers = this.createIdempotencyHeader();
    return this.http.post<ApiResponse<Transaction>>(
      '/api/transactions/transfer',
      { fromAccount, toAccount, amount },
      { headers }
    );
  }

  getTransactionHistory(accountId: number, page: number = 0, size: number = 10): Observable<ApiResponse<PaginatedResponse<Transaction>>> {
    return this.http.get<ApiResponse<PaginatedResponse<Transaction>>>(
      `/api/transactions/account/${accountId}?page=${page}&size=${size}`
    );
  }
}
