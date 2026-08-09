import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Auditoria } from '../models/auditoria.model';
import { ApiResponse } from '../interfaces/api-response.interface';

export interface AuditoriaFiltros {
  page?: number;
  limit?: number;
  search?: string;
  entidad?: string;
  accion?: string;
  desde?: string;
  hasta?: string;
}

export interface AuditoriaPaginatedResponse extends ApiResponse<Auditoria[]> {
  pagination: { page: number; limit: number; total: number };
}

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly url = `${environment.apiUrl}/auditoria`;
  private http: HttpClient = inject(HttpClient);

  getAll(filtros: AuditoriaFiltros = {}): Observable<AuditoriaPaginatedResponse> {
    let params = new HttpParams();
    if (filtros.page) params = params.set('page', filtros.page);
    if (filtros.limit) params = params.set('limit', filtros.limit);
    if (filtros.search) params = params.set('search', filtros.search);
    if (filtros.entidad) params = params.set('entidad', filtros.entidad);
    if (filtros.accion) params = params.set('accion', filtros.accion);
    if (filtros.desde) params = params.set('desde', filtros.desde);
    if (filtros.hasta) params = params.set('hasta', filtros.hasta);
    return this.http.get<AuditoriaPaginatedResponse>(this.url, { params });
  }
}
