import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Familia } from '../models/usuario.model';
import { ApiResponse, PaginatedResponse } from '../interfaces/api-response.interface';

@Injectable({ providedIn: 'root' })
export class FamiliasService {
  private readonly url = `${environment.apiUrl}/familias`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, limit = 10, consejoId?: number): Observable<PaginatedResponse<Familia>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (consejoId) params = params.set('consejoId', consejoId);
    return this.http.get<PaginatedResponse<Familia>>(this.url, { params });
  }

  getById(id: number): Observable<ApiResponse<Familia>> {
    return this.http.get<ApiResponse<Familia>>(`${this.url}/${id}`);
  }

  create(data: Partial<Familia>): Observable<ApiResponse<Familia>> {
    return this.http.post<ApiResponse<Familia>>(this.url, data);
  }

  update(id: number, data: Partial<Familia>): Observable<ApiResponse<Familia>> {
    return this.http.patch<ApiResponse<Familia>>(`${this.url}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.url}/${id}`);
  }
}
