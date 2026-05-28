import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
}

interface AuthResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'skin_cancer_jwt';
  private readonly _token = signal<string | null>(this.readToken());

  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this._token()));

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<void> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/api/auth/login`, request).pipe(
      map((response) => this.extractToken(response, false)),
      tap((token) => this.setToken(token)),
      map(() => void 0)
    );
  }

  register(request: RegisterRequest): Observable<void> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/api/auth/register`, request).pipe(
      map((response) => this.extractToken(response, true)),
      tap((token) => {
        if (token) {
          this.setToken(token);
        }
      }),
      map(() => void 0)
    );
  }

  logout(): void {
    this.clearToken();
  }

  private readToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const token = localStorage.getItem(this.storageKey);
    return token && token.trim().length > 0 ? token : null;
  }

  private setToken(token: string | null): void {
    if (!token) {
      this.clearToken();
      return;
    }

    this._token.set(token);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, token);
    }
  }

  private clearToken(): void {
    this._token.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  private extractToken(response: AuthResponse | null | undefined, allowEmpty: boolean): string | null {
    const token = response?.token ?? response?.accessToken ?? response?.jwt ?? null;
    if (!token && !allowEmpty) {
      throw new Error('Oturum anahtarı alınamadı.');
    }

    return token;
  }
}
