import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface Account {
  id: number;
  accountNumber: string;
  accountType: string;
  balance: number;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly http = inject(HttpClient);

  getUserAccounts(userId: number): Observable<Account[]> {
    return this.http.get<Account[]>(`/api/accounts/user/${userId}`);
  }

  createAccount(userId: number, type: string): Observable<ApiResponse<Account>> {
    return this.http.post<ApiResponse<Account>>(`/api/accounts/${userId}?type=${type}`, {});
  }

  getBalance(accountNumber: string): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`/api/accounts/${accountNumber}/balance`);
  }
}
