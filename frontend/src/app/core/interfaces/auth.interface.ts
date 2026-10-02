export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserPermission {
  id: number;
  modulo: string;
  accion: 'ver' | 'crear' | 'editar' | 'eliminar' | 'exportar';
}

export interface UserCouncil {
  id: number;
  nombre: string;
  rif?: string | null;
  activo?: boolean;
  createdAt?: string;
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
  permisos?: UserPermission[];
  consejos?: UserCouncil[];
}

export interface JwtPayload {
  sub: number;
  email: string;
  rol: string;
  iat: number;
  exp: number;
}