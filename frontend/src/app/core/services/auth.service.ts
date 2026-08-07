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

  private _token = signal<string | null>(sessionStorage.getItem(TOKEN_KEY));
  private _user  = signal<AuthUser | null>(
    JSON.parse(sessionStorage.getItem(USER_KEY) ?? 'null')
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
            sessionStorage.setItem(TOKEN_KEY, res.data.token);
            sessionStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
          }
        })
      );
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
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

  changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/auth/password`, { currentPassword, newPassword });
  }

  solicitarRecuperacion(email: string, canal: 'email' | 'telegram' = 'email'): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/auth/recuperacion/solicitar`, { email, canal });
  }

  verificarOTP(email: string, codigo: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/auth/recuperacion/verificar`, { email, codigo });
  }

  restablecerPassword(email: string, codigo: string, newPassword: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/auth/recuperacion/restablecer`, { email, codigo, newPassword });
  }

  verificarPreguntas(email: string, respuestas: { preguntaId: number; respuesta: string }[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/preguntas-seguridad/verify`, { email, respuestas });
  }

  resetPorPreguntas(email: string, respuestas: { preguntaId: number; respuesta: string }[], newPassword: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/preguntas-seguridad/reset-password`, { email, respuestas, newPassword });
  }

  getPreguntasByUsuario(usuarioId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/preguntas-seguridad/usuario/${usuarioId}`);
  }

  // Sesiones
  getSessions(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/sesiones`);
  }

  revokeSession(sessionId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.api}/sesiones/${sessionId}`);
  }

  revokeAllOtherSessions(): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.api}/sesiones`);
  }
}
