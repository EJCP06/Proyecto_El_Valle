import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Formulario,
  FormularioAsignacion,
  FormularioRespuesta,
  FormularioAsignacionFamilia,
} from '../models/usuario.model';
import { ApiResponse, PaginatedResponse } from '../interfaces/api-response.interface';

@Injectable({ providedIn: 'root' })
export class FormulariosService {
  private readonly url = `${environment.apiUrl}/formularios`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, limit = 10): Observable<PaginatedResponse<Formulario>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedResponse<Formulario>>(this.url, { params });
  }

  getById(id: number): Observable<ApiResponse<Formulario>> {
    return this.http.get<ApiResponse<Formulario>>(`${this.url}/${id}`);
  }

  create(data: Partial<Formulario>): Observable<ApiResponse<Formulario>> {
    return this.http.post<ApiResponse<Formulario>>(this.url, data);
  }

  update(id: number, data: Partial<Formulario>): Observable<ApiResponse<Formulario>> {
    return this.http.patch<ApiResponse<Formulario>>(`${this.url}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.url}/${id}`);
  }

  // Asignaciones
  getAsignaciones(formularioId: number): Observable<ApiResponse<FormularioAsignacion[]>> {
    return this.http.get<ApiResponse<FormularioAsignacion[]>>(
      `${this.url}/${formularioId}/asignaciones`
    );
  }

  asignar(formularioId: number, familiaId: number): Observable<ApiResponse<FormularioAsignacion>> {
    return this.http.post<ApiResponse<FormularioAsignacion>>(
      `${this.url}/asignar`,
      { formularioId, familiaId }
    );
  }

  getByFamilia(familiaId: number): Observable<ApiResponse<FormularioAsignacionFamilia[]>> {
    return this.http.get<ApiResponse<FormularioAsignacionFamilia[]>>(
      `${this.url}/familia/${familiaId}`
    );
  }

  // Respuestas
  responder(
    asignacionId: number,
    respuestas: Record<string, unknown>,
    miembroId?: number
  ): Observable<ApiResponse<FormularioRespuesta>> {
    return this.http.post<ApiResponse<FormularioRespuesta>>(
      `${environment.apiUrl}/asignaciones/${asignacionId}/respuestas`,
      { respuestas, miembroId }
    );
  }
}
