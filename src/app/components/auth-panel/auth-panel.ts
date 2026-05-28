import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService, LoginRequest, RegisterRequest } from '../../services/auth.service';

@Component({
  selector: 'app-auth-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-panel.html',
  styleUrl: './auth-panel.scss',
})
export class AuthPanel {
  readonly mode = signal<'login' | 'register'>('login');
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly noticeMessage = signal<string | null>(null);

  email = '';
  password = '';
  fullName = '';

  constructor(public auth: AuthService) {}

  setMode(mode: 'login' | 'register'): void {
    this.mode.set(mode);
    this.errorMessage.set(null);
    this.noticeMessage.set(null);
  }

  submit(form: NgForm): void {
    if (this.isSubmitting() || form.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.noticeMessage.set(null);

    const request: LoginRequest | RegisterRequest = this.mode() === 'login'
      ? { email: this.email.trim(), password: this.password }
      : { email: this.email.trim(), password: this.password, fullName: this.fullName.trim() || undefined };

    const action = this.mode() === 'login'
      ? this.auth.login(request as LoginRequest)
      : this.auth.register(request as RegisterRequest);

    action.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.password = '';
        if (this.mode() === 'register' && !this.auth.isAuthenticated()) {
          this.noticeMessage.set('Kaydınız tamamlandı. Giriş yaparak devam edebilirsiniz.');
        }
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(this.toMessage(error));
      },
    });
  }

  private toMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
    }

    return 'Giriş işlemi başarısız oldu. Bilgilerinizi kontrol edip tekrar deneyin.';
  }
}
