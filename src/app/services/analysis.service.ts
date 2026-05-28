import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { AuthService } from './auth.service';

export interface AnalysisResultDto {
  id: string;
  label: string;
  confidence: number;
  confidencePercent?: string;
  modelVersion: string;
  recommendation?: string;
  createdAt: string;
}

type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';

@Injectable({ providedIn: 'root' })
export class AnalysisService {
  private readonly _result = signal<AnalysisResultDto | null>(null);
  private readonly _status = signal<AnalysisStatus>('idle');
  private readonly _errorMessage = signal<string | null>(null);

  readonly result = this._result.asReadonly();
  readonly status = this._status.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  constructor(private http: HttpClient, private auth: AuthService) {}

  analyze(file: File): Observable<AnalysisResultDto> {
    if (!this.auth.isAuthenticated()) {
      const error = new Error('Analiz için giriş yapmanız gerekiyor.');
      this._status.set('error');
      this._errorMessage.set(error.message);
      return throwError(() => error);
    }

    const formData = new FormData();
    formData.append('file', file, file.name);

    const token = this.auth.token();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this._status.set('loading');
    this._result.set(null);
    this._errorMessage.set(null);

    return this.http
      .post<AnalysisResultDto>(`${API_BASE_URL}/api/analysis/analyze`, formData, { headers })
      .pipe(
        tap((result) => {
          this._result.set(result);
          this._status.set('success');
        }),
        catchError((error) => {
          this._status.set('error');
          this._result.set(null);
          this._errorMessage.set(this.toMessage(error));
          return throwError(() => error);
        })
      );
  }

  reset(): void {
    this._result.set(null);
    this._status.set('idle');
    this._errorMessage.set(null);
  }

  private toMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const payload = (error as { error?: unknown }).error;
      if (typeof payload === 'string') {
        return payload;
      }

      if (payload && typeof payload === 'object' && 'message' in payload) {
        const message = (payload as { message?: unknown }).message;
        if (typeof message === 'string') {
          return message;
        }
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Analiz işlemi başarısız oldu.';
  }
}
