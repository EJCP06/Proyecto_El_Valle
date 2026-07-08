import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReporteParams } from '../models/usuario.model';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly url = `${environment.apiUrl}/reportes`;
  private http: HttpClient = inject(HttpClient);

  generate(params: ReporteParams): Observable<ApiResponse<unknown>> {
    let httpParams = new HttpParams().set('tipo', params.tipo);
    if (params.desde)    httpParams = httpParams.set('desde', params.desde);
    if (params.hasta)    httpParams = httpParams.set('hasta', params.hasta);
    if (params.consejoId) httpParams = httpParams.set('consejoId', params.consejoId);
    if (params.formato)  httpParams = httpParams.set('formato', params.formato);

    return this.http.get<ApiResponse<unknown>>(this.url, { params: httpParams });
  }

  getStats(): Observable<ApiResponse<unknown>> {
    return this.http.get<ApiResponse<unknown>>(`${this.url}/stats`);
  }

  downloadPdf(params: ReporteParams): Observable<Blob> {
    let httpParams = new HttpParams()
      .set('tipo', params.tipo)
      .set('formato', 'pdf');
    if (params.desde)    httpParams = httpParams.set('desde', params.desde);
    if (params.hasta)    httpParams = httpParams.set('hasta', params.hasta);
    if (params.consejoId) httpParams = httpParams.set('consejoId', params.consejoId);

    return this.http.get(`${this.url}/download`, {
      params: httpParams,
      responseType: 'blob',
    });
  }
}
