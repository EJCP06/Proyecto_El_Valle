import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';

export interface BackupItem {
  archivo: string;
  formato: 'custom' | 'sql';
  tipo: string;
  creado_en: string;
  tamaño_bytes: number;
  tamaño_formateado: string;
  base_datos: string | null;
}

export interface BackupStats {
  total: number;
  total_hoy: number;
  tamaño_total_bytes: number;
  tamaño_total_formateado: string;
  ultimo_backup: BackupItem | null;
  por_dia: { dia: string; cantidad: number }[];
}

export interface BackupVerificacion {
  archivo: string;
  valido: boolean;
  formato?: string;
  objetos?: number;
  mensaje: string;
}

export interface RestoreResult {
  archivo: string;
  exito: boolean;
  mensaje: string;
  salida?: string;
}

export interface RestoreOpciones {
  archivo?: string;
  limpiar: boolean;
  recrear: boolean;
  tablas: string[];
  confirmar: boolean;
}

@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly url = `${environment.apiUrl}/backup`;

  constructor(private http: HttpClient) {}

  listar(): Observable<ApiResponse<BackupItem[]>> {
    return this.http.get<ApiResponse<BackupItem[]>>(this.url);
  }

  stats(): Observable<ApiResponse<BackupStats>> {
    return this.http.get<ApiResponse<BackupStats>>(`${this.url}/stats`);
  }

  crear(tipo: string, tablas: string[] = []): Observable<ApiResponse<BackupItem>> {
    return this.http.post<ApiResponse<BackupItem>>(this.url, { tipo, tablas });
  }

  verificar(archivo: string): Observable<ApiResponse<BackupVerificacion>> {
    return this.http.get<ApiResponse<BackupVerificacion>>(`${this.url}/${encodeURIComponent(archivo)}/verificar`);
  }

  eliminar(archivo: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.url}/${encodeURIComponent(archivo)}`);
  }

  descargar(archivo: string): Observable<Blob> {
    return this.http.get(`${this.url}/${encodeURIComponent(archivo)}/download`, {
      responseType: 'blob',
    });
  }

  restaurar(opciones: RestoreOpciones): Observable<ApiResponse<RestoreResult>> {
    return this.http.post<ApiResponse<RestoreResult>>(`${this.url}/restore`, opciones);
  }

  restaurarUpload(file: File, opciones: RestoreOpciones): Observable<ApiResponse<RestoreResult>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('limpiar', String(opciones.limpiar));
    formData.append('recrear', String(opciones.recrear));
    formData.append('tablas', JSON.stringify(opciones.tablas));
    formData.append('confirmar', String(opciones.confirmar));
    return this.http.post<ApiResponse<RestoreResult>>(`${this.url}/restore/upload`, formData);
  }
}
