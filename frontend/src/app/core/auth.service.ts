import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  id: number;
  email: string;
  fullName: string;
  role: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Core state using Angular Signals
  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor() {
    this.loadSession();
  }

  register(fullName: string, email: string, password: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>('/api/auth/register', { fullName, email, password });
  }

  login(email: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>('/api/auth/login', { email, password }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.saveSession(res.data);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private saveSession(data: AuthResponse): void {
    localStorage.setItem('token', data.token);
    const user: User = {
      id: data.id,
      email: data.email,
      fullName: data.fullName,
      role: data.role
    };
    localStorage.setItem('user', JSON.stringify(user));
    this._currentUser.set(user);
  }

  private loadSession(): void {
    const token = this.getToken();
    const userJson = localStorage.getItem('user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this._currentUser.set(user);
      } catch (e) {
        this.logout();
      }
    }
  }
}
