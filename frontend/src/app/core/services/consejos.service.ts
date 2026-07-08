import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConsejoComunal } from '../models/usuario.model';
import { ApiResponse, PaginatedResponse } from '../interfaces/api-response.interface';

@Injectable({ providedIn: 'root' })
export class ConsejosService {
  private readonly url = `${environment.apiUrl}/consejos`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, limit = 10): Observable<PaginatedResponse<ConsejoComunal>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedResponse<ConsejoComunal>>(this.url, { params });
  }

  getById(id: number): Observable<ApiResponse<ConsejoComunal>> {
    return this.http.get<ApiResponse<ConsejoComunal>>(`${this.url}/${id}`);
  }

  create(data: Partial<ConsejoComunal>): Observable<ApiResponse<ConsejoComunal>> {
    return this.http.post<ApiResponse<ConsejoComunal>>(this.url, data);
  }

  update(id: number, data: Partial<ConsejoComunal>): Observable<ApiResponse<ConsejoComunal>> {
    return this.http.patch<ApiResponse<ConsejoComunal>>(`${this.url}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.url}/${id}`);
  }
}
