import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConfiguracionSistema } from '../models/usuario.model';
import { ApiResponse } from '../interfaces/api-response.interface';

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
}
