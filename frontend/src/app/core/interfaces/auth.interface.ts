export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'vocero';
}

export interface JwtPayload {
  sub: number;
  email: string;
  rol: string;
  iat: number;
  exp: number;
}
