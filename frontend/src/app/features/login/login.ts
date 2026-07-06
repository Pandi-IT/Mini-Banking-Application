import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="auth-container fade-in">
      <div class="auth-card glass">
        <div class="auth-header">
          <div class="logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1>ThemeForest</h1>
          <p>Access your enterprise banking account</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              class="form-input" 
              placeholder="name@company.com" 
              [(ngModel)]="email" 
              required 
              email
              #emailInput="ngModel"
            />
            @if (emailInput.invalid && (emailInput.dirty || emailInput.touched)) {
              <span class="error-text">Please enter a valid email address</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              class="form-input" 
              placeholder="••••••••" 
              [(ngModel)]="password" 
              required
              #passInput="ngModel"
            />
            @if (passInput.invalid && (passInput.dirty || passInput.touched)) {
              <span class="error-text">Password is required</span>
            }
          </div>

          <button 
            type="submit" 
            class="btn btn-primary w-full" 
            [disabled]="loginForm.invalid || isLoading()"
          >
            @if (isLoading()) {
              <span class="spinner"></span> Logging in...
            } @else {
              Sign In
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>Don't have an account? <a routerLink="/register">Register here</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent),
                  radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.15), transparent);
      padding: 1.5rem;
    }
    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 2.5rem;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .logo {
      display: inline-flex;
      padding: 0.75rem;
      border-radius: var(--radius-md);
      background: rgba(99, 102, 241, 0.1);
      color: var(--primary);
      margin-bottom: 1rem;
    }
    .auth-header h1 {
      font-family: var(--font-display);
      font-size: 1.875rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      letter-spacing: -0.025em;
    }
    .auth-header p {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .error-text {
      font-size: 0.75rem;
      color: var(--error);
      margin-top: 0.35rem;
    }
    .w-full {
      width: 100%;
    }
    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    .auth-footer a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }
    .auth-footer a:hover {
      text-decoration: underline;
    }
    .spinner {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
      margin-right: 0.5rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  isLoading = signal(false);

  onSubmit(): void {
    if (!this.email || !this.password) return;

    this.isLoading.set(true);
    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.notificationService.success('Welcome back, ' + res.data.fullName + '!');
          this.router.navigate(['/dashboard']);
        } else {
          this.notificationService.error(res.message || 'Login failed.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Invalid credentials or server unavailable.';
        this.notificationService.error(msg);
      }
    });
  }
}
