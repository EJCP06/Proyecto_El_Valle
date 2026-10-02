import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { LucideAngularModule, Users, House, ClipboardList, ChartPie, ChartBar, Search, FileSpreadsheet, FileText, SlidersHorizontal, Eraser, ChevronLeft, ChevronRight, ShieldAlert, Info, Loader, TriangleAlert } from 'lucide-angular';
import { ReportesService } from '../../core/services/reportes.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { CatalogoService, CatalogoNombre } from '../../core/services/catalogo.service';
import { CustomSelectComponent, CustomSelectOption } from '../../shared/components/custom-select/custom-select.component';
import {
  ConsultaInfo,
  ConsultaResultado,
  FiltroConsulta,
  FiltrosConsulta,
  FormatoExportacion,
  OpcionFiltro,
} from '../../core/models/usuario.model';

/** Etiquetas legibles para las columnas que devuelve el resumen agregado. */
const ETIQUETAS_RESUMEN: Record<string, string> = {
  etiqueta: 'Consejo',
  consejo: 'Consejo',
  sexo: 'Sexo',
  total: 'Total',
  hombres: 'Hombres',
  mujeres: 'Mujeres',
};

/**
 * Pantalla de consultas demográficas.
 *
 * Todo lo que se ve aquí sale del catálogo que publica el backend
 * (`GET /reportes/consultas`): los filtros, sus tipos y las columnas
 * disponibles. Por eso agregar una consulta nueva en `consultaCatalog.js`
 * la hace aparecer en esta pantalla sin tocar Angular.
 */
@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    LucideAngularModule,
    CustomSelectComponent,
  ],
  template: `
    <div class="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">

      <!-- ═══ Encabezado ═══ -->
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Consultas Sociodemográficas</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Combina datos ya registrados, filtra y exporta. No hace falta crear un formulario nuevo.
          </p>
        </div>

        @if (!auth.isAdmin()) {
          <div class="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl">
            <lucide-icon [name]="ShieldAlert" class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0"></lucide-icon>
            <span class="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Solo tus consejos asignados
            </span>
          </div>
        }
      </div>

      <!-- ═══ Estado de carga inicial ═══ -->
      @if (cargandoCatalogo()) {
        <div class="flex items-center justify-center gap-3 py-16 text-slate-400">
          <lucide-icon [name]="Loader" class="w-5 h-5 animate-spin"></lucide-icon>
          <span class="text-[10px] font-black uppercase tracking-widest">Cargando consultas…</span>
        </div>
      }

      <!-- ═══ Paso 1: elegir consulta ═══ -->
      @if (!cargandoCatalogo() && !consulta) {
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (item of consultas; track item.slug) {
            <button
              type="button"
              (click)="elegir(item)"
              class="group text-left bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-600/5 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <div class="flex items-start justify-between gap-3 mb-3">
                <span class="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <lucide-icon [name]="iconoDe(item)" class="w-5 h-5"></lucide-icon>
                </span>
                <span class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  {{ item.tipo === 'agregado' ? 'Resumen' : 'Listado' }}
                </span>
              </div>
              <h3 class="text-sm font-black text-slate-800 dark:text-white mb-1.5">{{ item.label }}</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">{{ item.descripcion }}</p>
            </button>
          }
        </div>
      }

      <!-- ═══ Panel de la consulta ═══ -->
      @if (consulta) {
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden">

          <!-- Barra superior -->
          <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-800/60">
            <div class="flex items-center gap-3 min-w-0">
              <span class="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                <lucide-icon [name]="iconoDe(consulta)" class="w-5 h-5"></lucide-icon>
              </span>
              <div class="min-w-0">
                <h3 class="text-sm font-black text-slate-800 dark:text-white">{{ consulta.label }}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ consulta.descripcion }}</p>
              </div>
            </div>
            <button
              type="button"
              (click)="volverAlCatalogo()"
              class="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all text-xs cursor-pointer"
            >
              Cambiar consulta
            </button>
          </div>

          <!-- Filtros -->
          <div class="p-6 space-y-5">
            @if (filtrosVisibles().length > 0) {
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                @for (filtro of filtrosVisibles(); track filtro.key) {
                  <div class="space-y-2">
                    <label class="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">
                      {{ filtro.label }}
                    </label>

                    <!-- Select con opciones fijas o de catálogo -->
                    @if (tieneOpciones(filtro)) {
                      <app-custom-select
                        [ngModel]="valorFiltro(filtro.key)"
                        (ngModelChange)="asignar(filtro.key, $event)"
                        [options]="opcionesDe(filtro)"
                        [placeholder]="placeholderDe(filtro)">
                      </app-custom-select>

                    <!-- Número entero (edad, consejo) -->
                    } @else if (filtro.tipo === 'entero') {
                      <input
                        type="number"
                        min="0"
                        [ngModel]="valorFiltro(filtro.key)"
                        (ngModelChange)="asignar(filtro.key, $event)"
                        [placeholder]="placeholderDe(filtro)"
                        class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all text-sm"
                      />

                    <!-- Texto libre -->
                    } @else {
                      <input
                        type="text"
                        [ngModel]="valorFiltro(filtro.key)"
                        (ngModelChange)="asignar(filtro.key, $event)"
                        [placeholder]="placeholderDe(filtro)"
                        class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all text-sm"
                      />
                    }
                  </div>
                }

                <!-- Casillas de los filtros booleanos -->
                @for (filtro of filtrosBooleanos(); track filtro.key) {
                  <label class="flex items-center gap-3 px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-blue-500/50 transition-colors self-end">
                    <input
                      type="checkbox"
                      [ngModel]="esActivo(filtro.key)"
                      (ngModelChange)="alternarBooleano(filtro.key, $event)"
                      class="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                    />
                    <span class="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">{{ filtro.label }}</span>
                  </label>
                }
              </div>
            }

            <!-- Acciones -->
            <div class="flex flex-wrap items-center gap-3 pt-5 border-t border-slate-100 dark:border-slate-800/60">
              <button
                type="button"
                (click)="consultar(1)"
                [disabled]="cargando()"
                class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed text-sm"
              >
                @if (cargando()) {
                  <lucide-icon [name]="Loader" class="w-4 h-4 animate-spin"></lucide-icon>
                  Consultando…
                } @else {
                  <lucide-icon [name]="Search" class="w-4 h-4"></lucide-icon>
                  Consultar
                }
              </button>

              <button
                type="button"
                (click)="limpiar()"
                [disabled]="cargando()"
                class="inline-flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all cursor-pointer disabled:opacity-50 text-sm"
              >
                <lucide-icon [name]="Eraser" class="w-4 h-4"></lucide-icon>
                Limpiar
              </button>

              @if (consulta.columnas.length > 0) {
                <button
                  type="button"
                  (click)="panelColumnas.set(!panelColumnas())"
                  class="inline-flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all cursor-pointer text-sm"
                >
                  <lucide-icon [name]="SlidersHorizontal" class="w-4 h-4"></lucide-icon>
                  Columnas ({{ columnasElegidas.length }})
                </button>
              }

              <div class="flex-1"></div>

              <button
                type="button"
                (click)="exportar('xlsx')"
                [disabled]="exportando() || cargando()"
                class="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/10 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed text-sm"
              >
                <lucide-icon [name]="FileSpreadsheet" class="w-4 h-4"></lucide-icon>
                {{ exportando() === 'xlsx' ? 'Generando…' : 'Excel' }}
              </button>

              <button
                type="button"
                (click)="exportar('pdf')"
                [disabled]="exportando() || cargando()"
                class="inline-flex items-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-rose-600/10 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed text-sm"
              >
                <lucide-icon [name]="FileText" class="w-4 h-4"></lucide-icon>
                {{ exportando() === 'pdf' ? 'Generando…' : 'PDF' }}
              </button>
            </div>

            <!-- Selector de columnas -->
            @if (panelColumnas()) {
              <div class="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl animate-in fade-in duration-200">
                <div class="flex items-center justify-between mb-3">
                  <p class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[2px]">
                    Elige las columnas del reporte
                  </p>
                  <button
                    type="button"
                    (click)="todasLasColumnas()"
                    class="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Todas
                  </button>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  @for (columna of consulta.columnas; track columna.key) {
                    <label class="flex items-center gap-2.5 px-3 py-2.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-blue-500/50 transition-colors">
                      <input
                        type="checkbox"
                        [checked]="columnasElegidas.includes(columna.key)"
                        (change)="alternarColumna(columna.key)"
                        class="w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer shrink-0"
                      />
                      <span class="text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300 truncate">
                        {{ columna.label }}
                      </span>
                    </label>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- ═══ Resultados ═══ -->
        @if (resultado) {
          <div class="animate-in slide-in-from-bottom-3 duration-300 space-y-4">

            <!-- Totales -->
            @if (tarjetasTotales().length > 0) {
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                @for (tarjeta of tarjetasTotales(); track tarjeta.label) {
                  <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm">
                    <p class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{{ tarjeta.label }}</p>
                    <p class="text-2xl font-black text-slate-800 dark:text-white">{{ tarjeta.valor | number }}</p>
                  </div>
                }
              </div>
            }

            <!-- Detalle -->
            @if (consulta.tipo === 'detalle') {
              <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
                  <p class="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    {{ totalRegistros() }} registro(s)
                  </p>
                  <p class="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Página {{ resultado.paginacion?.page ?? 1 }} de {{ totalPaginas() }}
                  </p>
                </div>

                @if (resultado.filas.length === 0) {
                  <div class="flex flex-col items-center gap-3 py-16">
                    <lucide-icon [name]="Info" class="w-8 h-8 text-slate-300 dark:text-slate-600"></lucide-icon>
                    <p class="text-sm font-bold text-slate-500 dark:text-slate-400">No hay registros con esos filtros</p>
                    <p class="text-xs text-slate-400 dark:text-slate-500">Prueba a ampliar el rango de edad o quitar algún filtro.</p>
                  </div>
                } @else {
                  <div class="overflow-x-auto">
                    <table class="w-full text-left">
                      <thead>
                        <tr class="border-b border-slate-100 dark:border-slate-800/60">
                          @for (columna of resultado.columnas; track columna.key) {
                            <th class="px-5 py-3.5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                              {{ columna.label }}
                            </th>
                          }
                        </tr>
                      </thead>
                      <tbody>
                        @for (fila of resultado.filas; track fila['id'] ?? $index) {
                          <tr class="border-b border-slate-50 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            @for (columna of resultado.columnas; track columna.key) {
                              <td class="px-5 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {{ celda(fila[columna.key]) }}
                              </td>
                            }
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>

                  <div class="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800/60">
                    <button
                      type="button"
                      (click)="cambiarPagina(-1)"
                      [disabled]="(resultado.paginacion?.page ?? 1) <= 1 || cargando()"
                      class="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer text-xs"
                    >
                      <lucide-icon [name]="ChevronLeft" class="w-3.5 h-3.5"></lucide-icon>
                      Anterior
                    </button>

                    <select
                      [ngModel]="limit"
                      (ngModelChange)="cambiarLimit($event)"
                      class="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
                    >
                      @for (opcion of opcionesLimite; track opcion) {
                        <option [value]="opcion">{{ opcion }} por página</option>
                      }
                    </select>

                    <button
                      type="button"
                      (click)="cambiarPagina(1)"
                      [disabled]="(resultado.paginacion?.page ?? 1) >= totalPaginas() || cargando()"
                      class="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer text-xs"
                    >
                      Siguiente
                      <lucide-icon [name]="ChevronRight" class="w-3.5 h-3.5"></lucide-icon>
                    </button>
                  </div>
                }
              </div>

            <!-- Agregado -->
            } @else {
              <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60">
                  <p class="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Resumen por consejo
                  </p>
                </div>

                @if (resultado.resumen.length === 0) {
                  <div class="flex flex-col items-center gap-3 py-16">
                    <lucide-icon [name]="TriangleAlert" class="w-8 h-8 text-slate-300 dark:text-slate-600"></lucide-icon>
                    <p class="text-sm font-bold text-slate-500 dark:text-slate-400">No hay datos para resumir</p>
                  </div>
                } @else {
                  <div class="overflow-x-auto">
                    <table class="w-full text-left">
                      <thead>
                        <tr class="border-b border-slate-100 dark:border-slate-800/60">
                          @for (columna of columnasResumen(); track columna.key) {
                            <th
                              class="px-5 py-3.5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap"
                              [class.text-blue-600]="columna.claveNumerica"
                            >
                              {{ columna.label }}
                            </th>
                          }
                        </tr>
                      </thead>
                      <tbody>
                        @for (fila of resultado.resumen; track $index) {
                          <tr class="border-b border-slate-50 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            @for (columna of columnasResumen(); track columna.key) {
                              <td
                                class="px-5 py-3 text-xs whitespace-nowrap"
                                [class.font-black]="columna.claveNumerica"
                                [class.text-blue-600]="columna.claveNumerica"
                                [class.text-slate-600]="!columna.claveNumerica"
                                [class.text-slate-300]="!columna.claveNumerica"
                              >
                                {{ celda(fila[columna.key]) }}
                              </td>
                            }
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export class ReportesComponent implements OnInit {
  private readonly svc = inject(ReportesService);
  private readonly notify = inject(NotificationService);
  private readonly catalogos = inject(CatalogoService);
  readonly auth = inject(AuthService);

  // Iconos del catálogo de Lucide disponibles en esta versión.
  readonly Users = Users;
  readonly House = House;
  readonly ClipboardList = ClipboardList;
  readonly ChartPie = ChartPie;
  readonly ChartBar = ChartBar;
  readonly Search = Search;
  readonly FileSpreadsheet = FileSpreadsheet;
  readonly FileText = FileText;
  readonly SlidersHorizontal = SlidersHorizontal;
  readonly Eraser = Eraser;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly ShieldAlert = ShieldAlert;
  readonly Info = Info;
  readonly Loader = Loader;
  readonly TriangleAlert = TriangleAlert;

  consultas: ConsultaInfo[] = [];
  consulta: ConsultaInfo | null = null;
  resultado: ConsultaResultado | null = null;

  filtros: FiltrosConsulta = {};
  columnasElegidas: string[] = [];
  limit = 25;
  page = 1;

  readonly cargandoCatalogo = signal(false);
  readonly cargando = signal(false);
  readonly exportando = signal<FormatoExportacion | null>(null);
  readonly panelColumnas = signal(false);

  readonly opcionesLimite = [10, 25, 50, 100];

  /** Opciones de los selects alimentados por catálogos, ya resueltas. */
  private readonly opcionesCatalogo = new Map<string, CustomSelectOption[]>();

  ngOnInit(): void {
    this.cargandoCatalogo.set(true);
    this.svc.listarConsultas().subscribe({
      next: (r) => {
        this.consultas = r.data ?? [];
        this.cargandoCatalogo.set(false);
      },
      error: (e) => {
        this.cargandoCatalogo.set(false);
        this.notify.error('Error', e?.error?.message ?? 'No se pudieron cargar las consultas.');
      },
    });
  }

  iconoDe(consulta: ConsultaInfo) {
    switch (consulta.slug) {
      case 'hogares':
        return House;
      case 'formularios':
        return ClipboardList;
      case 'personas':
        return Users;
      default:
        return consulta.tipo === 'agregado' ? ChartPie : ChartBar;
    }
  }

  // ── Selección de consulta ─────────────────────────────────────────────────

  elegir(consulta: ConsultaInfo): void {
    this.consulta = consulta;
    this.resultado = null;
    this.filtros = {};
    this.columnasElegidas = [...consulta.columnasPorDefecto];
    this.page = 1;
    this.panelColumnas.set(false);
    this.cargarCatalogosDeFiltros(consulta);
  }

  volverAlCatalogo(): void {
    this.consulta = null;
    this.resultado = null;
    this.filtros = {};
    this.panelColumnas.set(false);
  }

  /**
   * Descarga (una sola vez por consulta) los catálogos que alimentan los
   * selects de filtros: parentescos, estados civiles, niveles educativos…
   */
  private cargarCatalogosDeFiltros(consulta: ConsultaInfo): void {
    const pendientes = consulta.filtros
      .map((f) => f.catalogo)
      .filter((nombre): nombre is string => nombre !== null && nombre !== undefined)
      .filter((nombre) => !this.opcionesCatalogo.has(nombre));

    for (const nombre of [...new Set(pendientes)]) {
      this.catalogos.getActive(nombre as CatalogoNombre).subscribe({
        next: (r) => {
          this.opcionesCatalogo.set(
            nombre,
            (r.data ?? []).map((item) => ({ value: item.nombre, label: item.nombre })),
          );
        },
        // Un catálogo que falla no debe tumbar la pantalla: el filtro queda
        // como texto libre.
        error: () => this.opcionesCatalogo.set(nombre, []),
      });
    }
  }

  // ── Filtros ───────────────────────────────────────────────────────────────

  /** El consejo solo se ofrece al administrador: el voicing ya está acotado. */
  filtrosVisibles(): FiltroConsulta[] {
    if (!this.consulta) return [];
    return this.consulta.filtros.filter(
      (f) => f.tipo !== 'booleano' && !(f.universal && !this.auth.isAdmin()),
    );
  }

  filtrosBooleanos(): FiltroConsulta[] {
    return this.consulta?.filtros.filter((f) => f.tipo === 'booleano') ?? [];
  }

  tieneOpciones(filtro: FiltroConsulta): boolean {
    if (filtro.catalogo) return this.opcionesCatalogo.has(filtro.catalogo);
    return (filtro.opciones?.length ?? 0) > 0;
  }

  opcionesDe(filtro: FiltroConsulta): CustomSelectOption[] {
    if (filtro.catalogo) {
      return this.opcionesCatalogo.get(filtro.catalogo) ?? [{ value: null, label: 'Cargando…' }];
    }
    return (filtro.opciones ?? []).map((o: OpcionFiltro) => ({ value: o.valor, label: o.label }));
  }

  placeholderDe(filtro: FiltroConsulta): string {
    switch (filtro.key) {
      case 'edadMin':
        return 'EJ: 1';
      case 'edadMax':
        return 'EJ: 15';
      case 'busqueda':
        return 'NOMBRE, CÉDULA…';
      default:
        return 'TODOS';
    }
  }

  valorFiltro(key: string): string {
    const valor = this.filtros[key];
    return valor === null || valor === undefined ? '' : String(valor);
  }

  asignar(key: string, valor: unknown): void {
    const texto = String(valor ?? '').trim();
    if (texto === '') {
      delete this.filtros[key];
      return;
    }
    this.filtros[key] = texto;
  }

  esActivo(key: string): boolean {
    return this.filtros[key] === true || this.filtros[key] === 'true';
  }

  alternarBooleano(key: string, valor: boolean): void {
    if (valor) {
      this.filtros[key] = true;
    } else {
      delete this.filtros[key];
    }
  }

  limpiar(): void {
    this.filtros = {};
    this.page = 1;
    this.consultar(1);
  }

  // ── Columnas ──────────────────────────────────────────────────────────────

  alternarColumna(key: string): void {
    const indice = this.columnasElegidas.indexOf(key);
    if (indice >= 0) {
      this.columnasElegidas.splice(indice, 1);
    } else {
      this.columnasElegidas.push(key);
    }
  }

  todasLasColumnas(): void {
    this.columnasElegidas = (this.consulta?.columnas ?? []).map((c) => c.key);
  }

  // ── Ejecución ─────────────────────────────────────────────────────────────

  consultar(page = 1): void {
    if (!this.consulta) return;

    this.page = page;
    this.cargando.set(true);

    this.svc
      .ejecutarConsulta(this.consulta.slug, {
        filtros: this.filtros,
        columnas: this.columnasElegidas,
        page,
        limit: this.limit,
      })
      .subscribe({
        next: (r) => {
          this.resultado = r.data;
          this.cargando.set(false);
        },
        error: (e) => {
          this.cargando.set(false);
          this.resultado = null;
          this.notify.error('No se pudo consultar', e?.error?.message ?? 'Intenta de nuevo.');
        },
      });
  }

  cambiarPagina(delta: number): void {
    const siguiente = this.page + delta;
    if (siguiente < 1 || siguiente > this.totalPaginas()) return;
    this.consultar(siguiente);
  }

  cambiarLimit(limit: number): void {
    this.limit = Number(limit);
    this.consultar(1);
  }

  exportar(formato: FormatoExportacion): void {
    if (!this.consulta) return;

    this.exportando.set(formato);
    this.svc
      .exportarConsulta(this.consulta.slug, { filtros: this.filtros, columnas: this.columnasElegidas }, formato)
      .subscribe({
        next: (blob) => {
          this.exportando.set(null);
          this.svc.guardarComo(blob, this.svc.nombreArchivo(this.consulta!.slug, formato), formato);
          this.notify.success('Listo', `El archivo se descargó correctamente.`);
        },
        error: (e) => {
          this.exportando.set(null);
          this.notify.error('No se pudo exportar', e?.error?.message ?? 'Intenta de nuevo.');
        },
      });
  }

  // ── Presentación ──────────────────────────────────────────────────────────

  totalRegistros(): number {
    if (!this.resultado) return 0;
    if (this.resultado.tipo === 'agregado') return this.resultado.resumen.length;
    return Number(this.resultado.totales?.['total'] ?? this.resultado.filas.length);
  }

  totalPaginas(): number {
    const total = Number(this.resultado?.totales?.['total'] ?? 0);
    return Math.max(1, Math.ceil(total / this.limit));
  }

  /** Tarjetas de resumen del encabezado (totales, hombres, mujeres, hogares…). */
  tarjetasTotales(): { label: string; valor: number }[] {
    const totales = this.resultado?.totales;
    if (!totales) return [];

    const orden = ['total', 'hombres', 'mujeres', 'hogares', 'consejos', 'menores', 'adultosmayores'];
    return orden
      .filter((clave) => totales[clave] !== undefined)
      .map((clave) => ({
        label: ETIQUETAS_RESUMEN[clave] ?? clave.charAt(0).toUpperCase() + clave.slice(1),
        valor: Number(totales[clave] ?? 0),
      }));
  }

  /**
   * Columnas del resumen agregado. Cuando la consulta declara franjas etarias
   * se usan para ponerles nombre legible a las columnas (`f_0_2` → "0 a 2 años").
   */
  columnasResumen(): { key: string; label: string; claveNumerica: boolean }[] {
    const resumen = this.resultado?.resumen ?? [];
    const claves = Object.keys(resumen[0] ?? {});

    if (this.consulta?.franjas?.length) {
      const inicial: { key: string; label: string; claveNumerica: boolean }[] = claves
        .filter((clave) => clave === 'consejo' || clave === 'etiqueta' || clave === 'total')
        .map((clave) => ({
          key: clave,
          label: ETIQUETAS_RESUMEN[clave] ?? clave,
          claveNumerica: clave === 'total',
        }));

      return [
        ...inicial,
        ...this.consulta.franjas.map((franja) => ({
          key: franja.columna,
          label: franja.etiqueta,
          claveNumerica: true,
        })),
      ];
    }

    return claves.map((clave) => ({
      key: clave,
      label: ETIQUETAS_RESUMEN[clave] ?? clave,
      claveNumerica: clave !== 'consejo' && clave !== 'etiqueta' && clave !== 'sexo',
    }));
  }

  /** Formato de celda: fechas, booleanos y vacíos se muestran legibles. */
  celda(valor: unknown): string {
    if (valor === null || valor === undefined || valor === '') return '—';
    if (valor instanceof Date) {
      return new DatePipe('es-VE').transform(valor, 'dd/MM/yyyy') ?? '—';
    }
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
    return String(valor);
  }
}
