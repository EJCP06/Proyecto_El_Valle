import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import {
  ConsultaInfo,
  ConsultaParametros,
  ConsultaResultado,
  FiltrosConsulta,
  FormatoExportacion,
} from '../models/usuario.model';

const MIME_POR_FORMATO: Record<FormatoExportacion, string> = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly url = `${environment.apiUrl}/reportes`;
  private http = inject(HttpClient);

  /** Estadísticas del panel de inicio, ya acotadas al alcance del usuario. */
  getStats(): Observable<ApiResponse<unknown>> {
    return this.http.get<ApiResponse<unknown>>(`${this.url}/stats`);
  }

  /** Catálogo de consultas disponibles: filtros y columnas de cada una. */
  listarConsultas(): Observable<ApiResponse<ConsultaInfo[]>> {
    return this.http.get<ApiResponse<ConsultaInfo[]>>(`${this.url}/consultas`);
  }

  ejecutarConsulta(slug: string, params: ConsultaParametros): Observable<ApiResponse<ConsultaResultado>> {
    return this.http.get<ApiResponse<ConsultaResultado>>(`${this.url}/consultas/${slug}`, {
      params: this.buildParams(params),
    });
  }

  /**
   * Descarga el resultado como archivo. El backend decide el tipo de contenido,
   * así que la extensión se toma del formato pedido.
   */
  exportarConsulta(
    slug: string,
    params: ConsultaParametros,
    formato: FormatoExportacion,
  ): Observable<Blob> {
    return this.http
      .get(`${this.url}/consultas/${slug}/exportar`, {
        params: this.buildParams({ ...params, page: undefined, limit: undefined, formato } as ConsultaParametros & { formato: FormatoExportacion }),
        responseType: 'blob',
      })
      .pipe(catchError((error) => this.blobComoError(error)));
  }

  /** Nombre sugerido del archivo, según el formato. */
  nombreArchivo(slug: string, formato: FormatoExportacion): string {
    const marca = new Date().toISOString().slice(0, 10);
    return `reporte-${slug}-${marca}.${formato}`;
  }

  /**
   * Traduce los parámetros a la query string. Los filtros vacíos no se envían y
   * las columnas viajan repetidas (`columnas=nombre&columnas=edad`), que es lo
   * que espera el motor de consultas.
   */
  private buildParams(params: ConsultaParametros & { formato?: FormatoExportacion }): HttpParams {
    let http = new HttpParams();

    const filtros: FiltrosConsulta = params.filtros ?? {};
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor === null || valor === undefined || valor === '') continue;
      http = http.set(clave, String(valor));
    }

    for (const columna of params.columnas ?? []) {
      http = http.append('columnas', columna);
    }

    if (params.page) http = http.set('page', params.page);
    if (params.limit) http = http.set('limit', params.limit);
    if (params.formato) http = http.set('formato', params.formato);

    return http;
  }

  /**
   * Con `responseType: 'blob'` el cuerpo de error llega como Blob, no como JSON.
   * Sin esto el usuario vería siempre "error inesperado" aunque el backend haya
   * respondido con un mensaje claro (por ejemplo, consejo sin permisos).
   */
  private blobComoError(error: HttpErrorResponse): Observable<never> {
    if (!(error.error instanceof Blob)) {
      return throwError(() => error);
    }

    return from(error.error.text()).pipe(
      map((texto: string) => ({ ...error, error: this.parsearMensaje(texto) })),
      mergeMap((fallido) => throwError(() => fallido)),
    );
  }

  private parsearMensaje(texto: string): unknown {
    try {
      return JSON.parse(texto);
    } catch {
      return { message: texto };
    }
  }

  /** Guarda un Blob en disco. */
  guardarArchivo(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  /** Lanza el guardado con el MIME correcto para que Excel abra bien el archivo. */
  guardarComo(blob: Blob, nombre: string, formato: FormatoExportacion): void {
    const conMime = blob.type === MIME_POR_FORMATO[formato]
      ? blob
      : new Blob([blob], { type: MIME_POR_FORMATO[formato] });
    this.guardarArchivo(conMime, nombre);
  }
}
