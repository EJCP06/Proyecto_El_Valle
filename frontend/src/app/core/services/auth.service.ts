import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, AuthUser } from '../interfaces/auth.interface';
import { ApiResponse } from '../interfaces/api-response.interface';

const TOKEN_KEY = 'ev_token';
const USER_KEY  = 'ev_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;

  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private _user  = signal<AuthUser | null>(
    JSON.parse(localStorage.getItem(USER_KEY) ?? 'null')
  );

  /** Publicly readable signals */
  readonly currentUser = this._user.asReadonly();
  readonly isAdmin = computed(() => this._user()?.rol === 'admin');
  readonly isVocero = computed(() => this._user()?.rol === 'vocero');

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.api}/auth/login`, credentials)
      .pipe(
        tap((res) => {
          if (res.success) {
            this._token.set(res.data.token);
            this._user.set(res.data.user);
            localStorage.setItem(TOKEN_KEY, res.data.token);
            localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
          }
        })
      );
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  isAuthenticated(): boolean {
    const token = this._token();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    return this._token();
  }
}
