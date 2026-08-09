import { Component, inject, OnInit, signal, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, JsonPipe } from '@angular/common';
import { AuditoriaService } from '../../core/services/auditoria.service';
import { Auditoria } from '../../core/models/auditoria.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { FillersPipe } from '../../shared/pipes/fillers.pipe';
import { LucideAngularModule, Search, RefreshCw, ChevronDown, CheckCircle2, ClipboardList, Eye, FilterX } from 'lucide-angular';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [FormsModule, DatePipe, JsonPipe, PaginationComponent, FillersPipe, LucideAngularModule],
  template: `
    <div class="space-y-4 animate-in fade-in duration-300 flex flex-col flex-1 min-h-0">

      <!-- Page Header -->
      <header>
        <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Auditoría</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 font-normal">Registro de actividad del sistema: quién hizo qué y cuándo.</p>
      </header>

      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl">
          <div class="w-8 h-8 border-[3px] border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <span class="text-sm text-slate-500 dark:text-slate-400 mt-4 font-semibold animate-pulse">Cargando auditoría...</span>
        </div>
      } @else {
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm mt-2 flex flex-col flex-1 min-h-0">

          <!-- Toolbar: búsqueda + filtros -->
          <div class="flex flex-col lg:flex-row lg:items-center gap-2.5 px-4 md:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-wrap">
            <div class="flex-1 relative search-filter-container min-w-[240px]">
              <div class="flex items-center w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl group focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all duration-300 overflow-hidden">
                <button type="button" (click)="toggleSearchFilterDropdown()" class="bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shrink-0">
                  <span>{{ getSearchFilterLabel() }}</span>
                  <lucide-icon [name]="ChevronDown" class="w-3.5 h-3.5 transition-transform duration-200" [class.rotate-180]="showSearchFilterDropdown"></lucide-icon>
                </button>
                <div class="relative flex-1">
                  <lucide-icon [name]="Search" class="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"></lucide-icon>
                  <input type="text" [(ngModel)]="filtros.search" (ngModelChange)="onSearchChange($event)" placeholder="Buscar en auditoría..." class="w-full pl-[72px] pr-4 py-2.5 text-sm focus:outline-none font-normal bg-transparent rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                </div>
              </div>
              @if (showSearchFilterDropdown) {
                <div class="absolute z-[110] w-44 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border-t-4 border-t-blue-600 left-0">
                  <div class="p-1.5 max-h-48 overflow-y-auto">
                    @for (opt of searchFilterOptions; track opt.value) {
                      <div (click)="selectSearchFilter(opt.value)" class="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors rounded-xl flex items-center justify-between" [class.bg-blue-50]="searchFilter === opt.value" [class.text-blue-600]="searchFilter === opt.value">
                        <span>{{ opt.label }}</span>
                        @if (searchFilter === opt.value) {
                          <lucide-icon [name]="CheckCircle2" class="w-3.5 h-3.5"></lucide-icon>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <select
              [(ngModel)]="filtros.entidad"
              (ngModelChange)="aplicarFiltro()"
              class="px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
            >
              <option value="">Todas las entidades</option>
              @for (e of entidades(); track e) {
                <option [value]="e">{{ e }}</option>
              }
            </select>

            <select
              [(ngModel)]="filtros.accion"
              (ngModelChange)="aplicarFiltro()"
              class="px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
            >
              <option value="">Todas las acciones</option>
              @for (a of acciones(); track a) {
                <option [value]="a">{{ a }}</option>
              }
            </select>

            <div class="flex items-center gap-2">
              <input
                type="date"
                [(ngModel)]="filtros.desde"
                (ngModelChange)="aplicarFiltro()"
                class="px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
              />
              <span class="text-xs font-bold text-slate-400">a</span>
              <input
                type="date"
                [(ngModel)]="filtros.hasta"
                (ngModelChange)="aplicarFiltro()"
                class="px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal"
              />
            </div>

            <div class="flex items-center gap-2">
              @if (filtrosActivos()) {
                <button
                  (click)="limpiarFiltros()"
                  title="Limpiar filtros"
                  class="inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl transition-all text-sm cursor-pointer shrink-0"
                >
                  <lucide-icon [name]="FilterX" class="w-4 h-4"></lucide-icon>
                </button>
              }
              <button
                (click)="load()"
                title="Refrescar"
                class="inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all text-sm cursor-pointer shrink-0"
              >
                <lucide-icon [name]="RefreshCw" class="w-4 h-4"></lucide-icon>
              </button>
            </div>
          </div>
          <!--/ Toolbar -->

          <div class="relative flex-1 min-h-0 overflow-x-auto">
            <table class="w-full min-w-[800px] border-collapse h-full">
              <thead>
                <tr class="bg-slate-50/75 dark:bg-slate-800/40 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider" [class.border-b]="filtrados.length > 0" [class.border-slate-200]="filtrados.length > 0" [class.dark:border-slate-800]="filtrados.length > 0">
                  <th class="px-6 py-3 text-center">Fecha</th>
                  <th class="px-4 py-3 text-center">Usuario</th>
                  <th class="px-4 py-3 text-center">Acción</th>
                  <th class="px-4 py-3 text-center">Entidad</th>
                  <th class="px-4 py-3 text-center">Registro</th>
                  <th class="px-4 py-3 text-center">IP</th>
                  <th class="px-4 py-3 text-center">Detalle</th>
                </tr>
              </thead>
              <tbody class="text-slate-750 dark:text-slate-300">
                @for (a of filtrados; track a.id) {
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800/60">
                    <td class="px-6 py-3 text-center">
                      <span class="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{{ a.created_at | date: 'dd/MM/yyyy HH:mm' }}</span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span class="text-sm text-slate-500 dark:text-slate-400">{{ a.usuario_nombre ?? 'Sistema / Anónimo' }}</span>
                      @if (a.usuario_email) {
                        <div class="text-[10px] text-slate-400">{{ a.usuario_email }}</div>
                      }
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span
                        class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                        [class]="claseAccion(a.accion)"
                      >
                        {{ a.accion }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">{{ a.entidad }}</td>
                    <td class="px-4 py-3 text-center text-sm text-slate-500 dark:text-slate-400">{{ a.entidad_id ?? '—' }}</td>
                    <td class="px-4 py-3 text-center">
                      <span class="text-xs text-slate-500 dark:text-slate-400 font-mono">{{ a.ip ?? '—' }}</span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <div class="flex justify-center">
                        <button (click)="verDetalle(a)" aria-label="Ver detalle" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 hover:shadow-[0_2px_10px_-3px_rgba(59,130,246,0.4)] dark:hover:bg-blue-900/30 rounded-xl transition-all cursor-pointer">
                          <lucide-icon [name]="Eye" class="w-4 h-4"></lucide-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {}
                @for (_ of filtrados | fillers:page:pageSize; track $index) {
                  <tr class="hover:bg-transparent">
                    <td colspan="7" class="px-6 py-3"></td>
                  </tr>
                }
              </tbody>
            </table>
            @if (filtrados.length === 0) {
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                <lucide-icon [name]="ClipboardList" class="text-5xl text-slate-300 dark:text-slate-600"></lucide-icon>
                <span class="text-sm text-slate-400 dark:text-slate-500 font-normal">No se encontraron datos.</span>
              </div>
            }
          </div>
          <app-pagination [currentPage]="page" [totalItems]="total" [pageSize]="pageSize" (pageChange)="cambiarPagina($event)"></app-pagination>
        </div>
      }
    </div>

    <!-- View Modal -->
    @if (detalleActual()) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" (click)="detalleActual.set(null)">
        <div class="absolute inset-0 bg-black/50"></div>
        <div class="relative z-10 w-full sm:max-w-lg bg-white dark:bg-slate-900 sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-4 sm:p-6 bg-blue-600 dark:bg-blue-700 shrink-0">
            <div class="min-w-0">
              <h3 class="text-base sm:text-lg font-black text-white tracking-tight truncate">Detalle del registro</h3>
              <p class="text-[10px] sm:text-xs text-blue-100 font-normal mt-0.5 truncate">{{ detalleActual()!.accion }} · {{ detalleActual()!.created_at | date: 'dd/MM/yyyy HH:mm' }}</p>
            </div>
            <button (click)="detalleActual.set(null)" class="w-8 h-8 flex items-center justify-center rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="p-4 sm:p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Usuario</div>
                <div class="font-semibold text-slate-800 dark:text-slate-100">{{ detalleActual()!.usuario_nombre ?? 'Sistema / Anónimo' }}</div>
                @if (detalleActual()!.usuario_email) {
                  <div class="text-xs text-slate-400">{{ detalleActual()!.usuario_email }}</div>
                }
              </div>
              <div>
                <div class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Entidad</div>
                <div class="font-semibold text-slate-800 dark:text-slate-100">{{ detalleActual()!.entidad }} @if (detalleActual()!.entidad_id) { · #{{ detalleActual()!.entidad_id }} }</div>
              </div>
              <div>
                <div class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Dirección IP</div>
                <div class="font-mono text-xs text-slate-600 dark:text-slate-300">{{ detalleActual()!.ip ?? '—' }}</div>
              </div>
              <div>
                <div class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Fecha</div>
                <div class="font-semibold text-slate-800 dark:text-slate-100">{{ detalleActual()!.created_at | date: 'dd/MM/yyyy HH:mm:ss' }}</div>
              </div>
            </div>
            @if (detalleActual()!.detalle) {
              <div>
                <div class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Datos</div>
                <pre class="w-full max-h-56 overflow-auto p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap">{{ detalleActual()!.detalle | json }}</pre>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class AuditoriaComponent implements OnInit {
  readonly Search = Search;
  readonly RefreshCw = RefreshCw;
  readonly ChevronDown = ChevronDown;
  readonly CheckCircle2 = CheckCircle2;
  readonly ClipboardList = ClipboardList;
  readonly Eye = Eye;
  readonly FilterX = FilterX;

  private svc = inject(AuditoriaService);
  private el = inject(ElementRef);

  pageSize = 8;
  page = 1;
  total = 0;

  registros = signal<Auditoria[]>([]);
  loading = signal(true);
  detalleActual = signal<Auditoria | null>(null);

  entidades = signal<string[]>([]);
  acciones = signal<string[]>([]);

  searchQuery = '';
  searchFilter = 'todo';
  showSearchFilterDropdown = false;
  searchFilterOptions = [
    { value: 'todo', label: 'TODO' },
    { value: 'usuario', label: 'USUARIO' },
    { value: 'entidad', label: 'ENTIDAD' },
    { value: 'accion', label: 'ACCIÓN' },
  ];

  filtros: { search: string; entidad: string; accion: string; desde: string; hasta: string } = {
    search: '',
    entidad: '',
    accion: '',
    desde: '',
    hasta: '',
  };

  private buscarTimer: ReturnType<typeof setTimeout> | null = null;

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.showSearchFilterDropdown = false;
    } else {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-filter-container')) this.showSearchFilterDropdown = false;
    }
  }

  get filtrados(): Auditoria[] {
    const q = (this.searchQuery || '').trim().toLowerCase();
    if (!q) return this.registros();
    return this.registros().filter((a) => {
      const matchUsuario = (a.usuario_nombre || '').toLowerCase().includes(q) || (a.usuario_email || '').toLowerCase().includes(q);
      const matchEntidad = (a.entidad || '').toLowerCase().includes(q);
      const matchAccion = (a.accion || '').toLowerCase().includes(q);
      if (this.searchFilter === 'usuario') return matchUsuario;
      if (this.searchFilter === 'entidad') return matchEntidad;
      if (this.searchFilter === 'accion') return matchAccion;
      return matchUsuario || matchEntidad || matchAccion;
    });
  }

  ngOnInit() {
    this.load();
  }

  toggleSearchFilterDropdown() {
    this.showSearchFilterDropdown = !this.showSearchFilterDropdown;
  }

  selectSearchFilter(filter: string) {
    this.searchFilter = filter;
    this.showSearchFilterDropdown = false;
  }

  getSearchFilterLabel(): string {
    return this.searchFilterOptions.find((o) => o.value === this.searchFilter)?.label ?? 'TODO';
  }

  onSearchChange(value: string | undefined) {
    this.searchQuery = value || '';
    this.filtros.search = this.searchQuery;
    this.page = 1;
    this.aplicarBusqueda();
  }

  aplicarBusqueda() {
    if (this.buscarTimer) clearTimeout(this.buscarTimer);
    this.buscarTimer = setTimeout(() => this.aplicarFiltro(), 350);
  }

  aplicarFiltro() {
    this.page = 1;
    this.load();
  }

  cambiarPagina(p: number) {
    this.page = p;
    this.load();
  }

  filtrosActivos(): boolean {
    return !!(this.filtros.search || this.filtros.entidad || this.filtros.accion || this.filtros.desde || this.filtros.hasta);
  }

  limpiarFiltros() {
    this.filtros = { search: '', entidad: '', accion: '', desde: '', hasta: '' };
    this.searchQuery = '';
    this.page = 1;
    this.load();
  }

  verDetalle(a: Auditoria) {
    this.detalleActual.set(a);
  }

  private normalizarFecha(fecha: string): string {
    return fecha ? fecha.replace('T', ' ') : '';
  }

  load() {
    this.loading.set(true);
    this.svc.getAll({
      page: this.page,
      limit: this.pageSize,
      search: this.filtros.search.trim() || undefined,
      entidad: this.filtros.entidad || undefined,
      accion: this.filtros.accion || undefined,
      desde: this.filtros.desde ? `${this.normalizarFecha(this.filtros.desde)} 00:00:00` : undefined,
      hasta: this.filtros.hasta ? `${this.normalizarFecha(this.filtros.hasta)} 23:59:59` : undefined,
    }).subscribe({
      next: (r) => {
        this.registros.set(r.data);
        this.total = r.pagination?.total ?? 0;
        this.coleccionarOpciones(r.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private coleccionarOpciones(data: Auditoria[]) {
    const ent = new Set(this.entidades());
    const acc = new Set(this.acciones());
    for (const a of data) {
      ent.add(a.entidad);
      acc.add(a.accion);
    }
    this.entidades.set([...ent].sort());
    this.acciones.set([...acc].sort());
  }

  claseAccion(accion: string): string {
    const a = accion.toUpperCase();
    if (a.includes('FALLIDO') || a.includes('INCORRECTA') || a.includes('INCORRECTO') || a.includes('REVOCADA')) {
      return 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400';
    }
    if (a.includes('SESIÓN') || a.includes('INICIAR')) {
      return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    }
    if (a.includes('CREAR') || a.includes('VERIFICAR')) {
      return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400';
    }
    if (a.includes('MODIFICAR') || a.includes('CAMBIAR') || a.includes('RESTABLECER') || a.includes('SOLICITAR')) {
      return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400';
    }
    return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
  }
}
