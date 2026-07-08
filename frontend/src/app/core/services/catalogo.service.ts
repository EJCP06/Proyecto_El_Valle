import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';

export interface CatalogoItem {
  id: number;
  nombre: string;
  activo: boolean;
}

export type CatalogoNombre =
  | 'parentescos'
  | 'estados-civiles'
  | 'niveles-educativos'
  | 'ocupaciones'
  | 'tipos-vivienda'
  | 'tipos-discapacidad';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly url = `${environment.apiUrl}/catalogos`;
  private http = inject(HttpClient);

  getAll(catalogo: CatalogoNombre): Observable<ApiResponse<CatalogoItem[]>> {
    return this.http.get<ApiResponse<CatalogoItem[]>>(`${this.url}/${catalogo}`);
  }

  getActive(catalogo: CatalogoNombre): Observable<ApiResponse<CatalogoItem[]>> {
    return this.http.get<ApiResponse<CatalogoItem[]>>(`${this.url}/${catalogo}/activos`);
  }

  create(catalogo: CatalogoNombre, nombre: string): Observable<ApiResponse<CatalogoItem>> {
    return this.http.post<ApiResponse<CatalogoItem>>(`${this.url}/${catalogo}`, { nombre });
  }

  update(catalogo: CatalogoNombre, id: number, data: Partial<CatalogoItem>): Observable<ApiResponse<CatalogoItem>> {
    return this.http.patch<ApiResponse<CatalogoItem>>(`${this.url}/${catalogo}/${id}`, data);
  }

  delete(catalogo: CatalogoNombre, id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.url}/${catalogo}/${id}`);
  }
}
