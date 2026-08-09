import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConfiguracionSistema } from '../models/usuario.model';
import { ApiResponse } from '../interfaces/api-response.interface';

export interface IpIntento {
  ip: string;
  intentos_fallidos: number;
  bloqueada_hasta: string | null;
  creado_en: string;
  actualizado_en: string;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private readonly url = `${environment.apiUrl}/configuracion`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<ConfiguracionSistema[]>> {
    return this.http.get<ApiResponse<ConfiguracionSistema[]>>(this.url);
  }

  update(clave: string, valor: string): Observable<ApiResponse<ConfiguracionSistema>> {
    return this.http.patch<ApiResponse<ConfiguracionSistema>>(
      `${this.url}/${clave}`,
      { valor }
    );
  }

  getIpIntentos(): Observable<ApiResponse<IpIntento[]>> {
    return this.http.get<ApiResponse<IpIntento[]>>(`${this.url}/ip-intentos`);
  }

  desbloquearIp(ip: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.url}/ip-intentos/${ip}`);
  }
}
