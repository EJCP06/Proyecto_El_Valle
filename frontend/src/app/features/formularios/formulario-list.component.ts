import { Component, inject, OnInit, signal, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormulariosService } from '../../core/services/formularios.service';
import { FamiliasService } from '../../core/services/familias.service';
import { NotificationService } from '../../core/services/notification.service';
import { Formulario, Familia, CampoFormulario, TipoCampo } from '../../core/models/usuario.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PaginatePipe } from '../../shared/pipes/paginate.pipe';
import { LucideAngularModule, Search, ChevronDown, CheckCircle2 } from 'lucide-angular';

@Component({
  selector: 'app-formulario-list',
  standalone: true,
  imports: [FormsModule, PaginationComponent, PaginatePipe, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">

      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Formularios</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">Gestiona formularios dinámicos para censos y encuestas comunales.</p>
        </div>
        <button (click)="openBuilderModal()" class="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 text-sm cursor-pointer">
          <span class="text-lg leading-none">+</span>
          <span>Nuevo formulario</span>
        </button>
      </div>

      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl">
          <div class="w-8 h-8 border-[3px] border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <span class="text-sm text-slate-500 dark:text-slate-400 mt-4 font-semibold animate-pulse">Cargando formularios...</span>
        </div>
      } @else {
        <!-- Search/Filter Bar -->
        <div class="flex justify-center mb-6 md:mb-10 mt-6 md:mt-10">
          <div class="relative w-full max-w-2xl">
            <div class="flex items-center w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-lg group focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all duration-300">
              <div class="relative search-filter-container">
                <button type="button" (click)="toggleSearchFilterDropdown()" class="bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 px-5 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 focus:outline-none rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-2.5">
                  <span>{{ getSearchFilterLabel() }}</span>
                  <lucide-icon [name]="ChevronDown" class="w-3.5 h-3.5 transition-transform duration-200" [class.rotate-180]="showSearchFilterDropdown"></lucide-icon>
                </button>
                @if (showSearchFilterDropdown) {
                  <div class="absolute z-[110] w-44 mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border-t-4 border-t-blue-600 left-0">
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
              <div class="relative flex-1">
                <lucide-icon [name]="Search" class="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"></lucide-icon>
                <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange($event)" placeholder="Buscar formulario..." class="w-full pl-[72px] pr-4 py-3 text-sm focus:outline-none font-medium bg-transparent rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" />
              </div>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (f of formulariosFiltrados | paginate:currentPage:pageSize; track f.id) {
            <div class="flex flex-col gap-4 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
              
              <!-- Header -->
              <div class="flex items-center justify-between">
                <div class="w-11 h-11 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📋
                </div>
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold"
                  [class]="f.activo ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'">
                  {{ f.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </div>

              <!-- Content -->
              <div class="flex-1 space-y-1">
                <h3 class="text-sm text-slate-500 dark:text-slate-400 leading-snug">{{ f.titulo }}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{{ f.descripcion || 'Sin descripción.' }}</p>
              </div>

              <!-- Meta + Actions -->
              <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60">
                <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {{ f.campos.length }} campo(s)
                </span>
                <div class="flex items-center gap-3">
                  <button (click)="openBuilderModal(f)" class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Editar</button>
                  <button (click)="openAsignarModal(f)" class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">Asignar</button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="sm:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl">
              <span class="text-5xl mb-4">📋</span>
              <p class="text-sm text-slate-400 dark:text-slate-500 font-medium">No hay formularios registrados aún.</p>
              <button (click)="openBuilderModal()" class="mt-4 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Crear el primero</button>
            </div>
          }
        </div>
        <app-pagination [currentPage]="currentPage" [totalItems]="formulariosFiltrados.length" [pageSize]="pageSize" (pageChange)="currentPage = $event"></app-pagination>
      }
    </div>

    <!-- Builder Modal -->
    @if (showBuilderModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="closeBuilderModal()">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between p-6 bg-blue-600 dark:bg-blue-700">
            <div>
              <h3 class="text-lg font-black text-white tracking-tight">{{ builderEditingId() ? 'Editar formulario' : 'Nuevo formulario' }}</h3>
              <p class="text-xs text-blue-100 font-medium mt-0.5">Crea formularios dinámicos con campos personalizados.</p>
            </div>
            <button (click)="closeBuilderModal()" class="w-8 h-8 flex items-center justify-center rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 max-h-[70vh] overflow-y-auto">
            @if (builderError()) {
              <div class="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl p-4 mb-6 text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span>{{ builderError() }}</span>
              </div>
            }

            <div class="space-y-6">
              <!-- Meta -->
              <div class="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-5 space-y-4">
                <h4 class="text-sm font-black text-slate-700 dark:text-slate-200">Información general</h4>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Título <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="builderTitulo" name="bTitulo" required placeholder="Ej: Censo de salud 2026"
                    class="w-full px-5 py-3.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Descripción</label>
                  <textarea [(ngModel)]="builderDescripcion" name="bDescripcion" rows="2" placeholder="Breve descripción del formulario..."
                    class="w-full px-5 py-3.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium"></textarea>
                </div>
              </div>

              <!-- Fields -->
              <div class="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-5 space-y-4">
                <div class="flex items-center justify-between">
                  <h4 class="text-sm font-black text-slate-700 dark:text-slate-200">Campos ({{ builderCampos().length }})</h4>
                  <button type="button" (click)="addCampo()" class="text-xs font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-all cursor-pointer">+ Agregar campo</button>
                </div>

                @for (campo of builderCampos(); track campo.id; let i = $index) {
                  <div class="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div class="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 mt-1">{{ i + 1 }}</div>
                    <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div class="sm:col-span-3">
                        <input [(ngModel)]="campo.label" [name]="'label'+i" placeholder="Etiqueta del campo *"
                          class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all text-sm"/>
                      </div>
                      <div>
                        <select [(ngModel)]="campo.tipo" [name]="'tipo'+i"
                          class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all text-sm">
                          @for (t of tipos; track t) {
                            <option [value]="t">{{ t }}</option>
                          }
                        </select>
                      </div>
                      <div>
                        <label class="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer pt-2">
                          <input [(ngModel)]="campo.requerido" [name]="'req'+i" type="checkbox"
                            class="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-700 text-blue-600 cursor-pointer"/>
                          Requerido
                        </label>
                      </div>
                    </div>
                    <button type="button" (click)="removeCampo(i)" class="text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl p-1.5 transition-all cursor-pointer shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                }

                @if (builderCampos().length === 0) {
                  <p class="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Agrega al menos un campo al formulario.</p>
                }
              </div>

              <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <button type="button" (click)="closeBuilderModal()" class="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer">Cancelar</button>
                <button type="button" (click)="saveBuilder()" [disabled]="builderSaving()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed text-sm">
                  {{ builderSaving() ? 'Guardando…' : 'Guardar formulario' }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    }

    <!-- Asignar Modal -->
    @if (showAsignarModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="closeAsignarModal()">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between p-6 bg-blue-600 dark:bg-blue-700">
            <div>
              <h3 class="text-lg font-black text-white tracking-tight">Asignar formulario</h3>
              <p class="text-xs text-blue-100 font-medium mt-0.5">{{ asignarFormulario()?.titulo }}</p>
            </div>
            <button (click)="closeAsignarModal()" class="w-8 h-8 flex items-center justify-center rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 max-h-[70vh] overflow-y-auto">
            @if (asignarError()) {
              <div class="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl p-4 mb-6 text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span>{{ asignarError() }}</span>
              </div>
            }

            <p class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">Selecciona las familias destino:</p>

            <div class="space-y-2 max-h-64 overflow-y-auto">
              @for (f of asignarFamilias(); track f.id) {
                <label class="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer">
                  <input type="checkbox" [value]="f.id" (change)="toggleAsignar(f.id, $event)"
                    class="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-700 text-blue-600 cursor-pointer"/>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-bold text-slate-800 dark:text-white truncate">{{ f.nombre }}</div>
                    <div class="text-xs text-slate-400 dark:text-slate-500 truncate">{{ f.direccion }}</div>
                  </div>
                </label>
              }
            </div>

            <div class="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800/60 mt-4">
              <button type="button" (click)="closeAsignarModal()" class="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer">Cancelar</button>
              <button type="button" [disabled]="asignarSaving() || asignarSelected().size === 0" (click)="saveAsignar()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed text-sm">
                {{ asignarSaving() ? 'Asignando…' : 'Asignar (' + asignarSelected().size + ')' }}
              </button>
            </div>
          </div>

        </div>
      </div>
    }
  `,
  styles: []
})
export class FormularioListComponent implements OnInit {
  readonly Search = Search;
  readonly ChevronDown = ChevronDown;
  readonly CheckCircle2 = CheckCircle2;

  private svc     = inject(FormulariosService);
  private famSvc  = inject(FamiliasService);
  private notify  = inject(NotificationService);
  private el = inject(ElementRef);

  pageSize = 6;
  currentPage = 1;

  formularios = signal<Formulario[]>([]);
  loading     = signal(true);

  searchQuery = '';
  searchFilter = 'todo';
  showSearchFilterDropdown = false;
  searchFilterOptions = [
    { value: 'todo', label: 'TODO' },
    { value: 'titulo', label: 'TÍTULO' },
    { value: 'descripcion', label: 'DESCRIPCIÓN' },
  ];

  get formulariosFiltrados(): Formulario[] {
    return this.formularios().filter(f => {
      const q = (this.searchQuery || '').trim().toLowerCase();
      if (!q) return true;
      const matchTitulo = (f.titulo || '').toLowerCase().includes(q);
      const matchDesc = (f.descripcion || '').toLowerCase().includes(q);
      if (this.searchFilter === 'titulo') return matchTitulo;
      if (this.searchFilter === 'descripcion') return matchDesc;
      return matchTitulo || matchDesc;
    });
  }

  tipos: TipoCampo[] = ['text', 'textarea', 'number', 'date', 'select', 'radio', 'checkbox', 'file'];

  // Builder modal
  showBuilderModal  = signal(false);
  builderEditingId  = signal<number | null>(null);
  builderSaving     = signal(false);
  builderError      = signal('');
  builderTitulo      = '';
  builderDescripcion = '';
  builderCampos      = signal<CampoFormulario[]>([]);

  // Asignar modal
  showAsignarModal  = signal(false);
  asignarFormulario = signal<Formulario | null>(null);
  asignarFamilias   = signal<Familia[]>([]);
  asignarSelected   = signal<Set<number>>(new Set());
  asignarSaving     = signal(false);
  asignarError      = signal('');

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.showSearchFilterDropdown = false;
    } else {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-filter-container')) this.showSearchFilterDropdown = false;
    }
  }

  toggleSearchFilterDropdown() {
    this.showSearchFilterDropdown = !this.showSearchFilterDropdown;
  }

  selectSearchFilter(filter: string) {
    this.searchFilter = filter;
    this.showSearchFilterDropdown = false;
  }

  getSearchFilterLabel(): string {
    return this.searchFilterOptions.find(o => o.value === this.searchFilter)?.label ?? 'TODO';
  }

  onSearchChange(value: string | undefined) {
    this.searchQuery = value || '';
    this.currentPage = 1;
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.svc.getAll().subscribe({
      next: (r) => { this.formularios.set(r.data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  // Builder methods
  openBuilderModal(f?: Formulario) {
    this.builderError.set('');
    if (f) {
      this.builderEditingId.set(f.id!);
      this.builderTitulo = f.titulo;
      this.builderDescripcion = f.descripcion ?? '';
      this.builderCampos.set(f.campos);
    } else {
      this.builderEditingId.set(null);
      this.builderTitulo = '';
      this.builderDescripcion = '';
      this.builderCampos.set([]);
    }
    this.showBuilderModal.set(true);
  }

  closeBuilderModal() {
    this.showBuilderModal.set(false);
    this.builderSaving.set(false);
    this.builderError.set('');
  }

  addCampo() {
    this.builderCampos.update((c) => [...c, { id: crypto.randomUUID(), label: '', tipo: 'text', requerido: false, orden: c.length }]);
  }

  removeCampo(index: number) {
    this.builderCampos.update((c) => c.filter((_, i) => i !== index));
  }

  saveBuilder() {
    if (!this.builderTitulo.trim()) { this.builderError.set('El título es requerido.'); return; }
    this.builderSaving.set(true);
    this.builderError.set('');

    const payload: Partial<Formulario> = {
      titulo: this.builderTitulo,
      descripcion: this.builderDescripcion,
      campos: this.builderCampos().map((c, i) => ({ ...c, orden: i })),
      activo: true,
    };

    const id  = this.builderEditingId();
    const obs = id ? this.svc.update(id, payload) : this.svc.create(payload);
    obs.subscribe({
      next: () => {
        this.builderSaving.set(false);
        this.notify.success(id ? 'Formulario actualizado' : 'Formulario creado', 'El formulario se ha guardado correctamente.');
        this.closeBuilderModal();
        this.load();
      },
      error: (e) => { this.builderError.set(e?.error?.message ?? 'Error al guardar.'); this.builderSaving.set(false); this.notify.error('Error', e?.error?.message ?? 'Error al guardar el formulario.'); },
    });
  }

  // Asignar methods
  openAsignarModal(f: Formulario) {
    this.asignarFormulario.set(f);
    this.asignarSelected.set(new Set());
    this.asignarError.set('');
    this.showAsignarModal.set(true);
    this.famSvc.getAll(1, 200).subscribe((r) => this.asignarFamilias.set(r.data));
  }

  closeAsignarModal() {
    this.showAsignarModal.set(false);
    this.asignarSaving.set(false);
    this.asignarError.set('');
  }

  toggleAsignar(id: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.asignarSelected.update((s) => { const n = new Set(s); checked ? n.add(id) : n.delete(id); return n; });
  }

  saveAsignar() {
    this.asignarSaving.set(true);
    const formularioId = this.asignarFormulario()!.id!;
    const ids = Array.from(this.asignarSelected());
    let done = 0;
    ids.forEach((familiaId) => {
      this.svc.asignar(formularioId, familiaId).subscribe({
        next: () => { done++; if (done === ids.length) { this.notify.success('Formulario asignado', `Asignado a ${ids.length} familia(s) correctamente.`); this.asignarSaving.set(false); this.closeAsignarModal(); } },
        error: (e) => { this.asignarError.set(e?.error?.message ?? 'Error.'); this.asignarSaving.set(false); this.notify.error('Error', e?.error?.message ?? 'Error al asignar.'); },
      });
    });
  }
}
