import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Miembro } from '../models/usuario.model';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable({ providedIn: 'root' })
export class MiembrosService {
  private readonly url = `${environment.apiUrl}/miembros`;

  constructor(private http: HttpClient) {}

  getByFamilia(familiaId: number): Observable<ApiResponse<Miembro[]>> {
    return this.http.get<ApiResponse<Miembro[]>>(`${this.url}?familiaId=${familiaId}`);
  }

  getById(id: number): Observable<ApiResponse<Miembro>> {
    return this.http.get<ApiResponse<Miembro>>(`${this.url}/${id}`);
  }

  create(data: Partial<Miembro>): Observable<ApiResponse<Miembro>> {
    return this.http.post<ApiResponse<Miembro>>(this.url, data);
  }

  update(id: number, data: Partial<Miembro>): Observable<ApiResponse<Miembro>> {
    return this.http.patch<ApiResponse<Miembro>>(`${this.url}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.url}/${id}`);
  }
}
