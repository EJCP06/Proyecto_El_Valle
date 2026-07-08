import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegistroAuditoria } from '../models/usuario.model';
import { PaginatedResponse } from '../interfaces/api-response.interface';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly url = `${environment.apiUrl}/auditoria`;

  constructor(private http: HttpClient) {}

  getLogs(
    page = 1,
    limit = 20,
    filters: { usuarioId?: number; entidad?: string; desde?: string; hasta?: string } = {}
  ): Observable<PaginatedResponse<RegistroAuditoria>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (filters.usuarioId) params = params.set('usuarioId', filters.usuarioId);
    if (filters.entidad)   params = params.set('entidad', filters.entidad);
    if (filters.desde)     params = params.set('desde', filters.desde);
    if (filters.hasta)     params = params.set('hasta', filters.hasta);

    return this.http.get<PaginatedResponse<RegistroAuditoria>>(this.url, { params });
  }
}
