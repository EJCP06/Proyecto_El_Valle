import { Component, inject, OnInit, signal, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CatalogoService, CatalogoItem, CatalogoNombre } from '../../core/services/catalogo.service';
import { NotificationService } from '../../core/services/notification.service';
import { LucideAngularModule, Plus, Trash2, ClipboardList, Search, ChevronDown, CheckCircle2, Pencil } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PaginatePipe } from '../../shared/pipes/paginate.pipe';
import { FillersPipe } from '../../shared/pipes/fillers.pipe';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [FormsModule, CommonModule, LucideAngularModule, PaginationComponent, PaginatePipe, FillersPipe],
  template: `
    <div class="animate-in fade-in duration-300 flex flex-col flex-1 min-h-0">
      <!-- Header -->
      <header class="mb-6">
        <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{{ tituloSeccion() }}</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 font-normal">{{ subtituloSeccion() }}</p>
      </header>

      <!-- Catálogos -->
      <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm flex flex-col flex-1 min-h-0">
        <div class="flex flex-col lg:flex-row lg:items-center gap-3 px-4 md:px-6 py-6 border-b border-slate-100 dark:border-slate-800">
          <div class="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
            <div class="relative flex-1 search-filter-container">
              <div class="flex items-center w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl group focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all duration-300 overflow-hidden">
                <button type="button" (click)="toggleSearchFilterDropdown()" class="bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 px-4 self-stretch text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shrink-0">
                  <span>{{ getSearchFilterLabel() }}</span>
                  <lucide-icon [name]="ChevronDown" class="w-3.5 h-3.5 transition-transform duration-200" [class.rotate-180]="showSearchFilterDropdown"></lucide-icon>
                </button>
                <div class="relative flex-1">
                  <lucide-icon [name]="Search" class="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"></lucide-icon>
                  <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange($event)" placeholder="Buscar elemento..." class="w-full pl-[72px] pr-4 py-2.5 text-sm focus:outline-none font-normal bg-transparent rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" />
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
            <button (click)="addItem()" class="order-first sm:order-none inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 text-sm cursor-pointer shrink-0">
              <lucide-icon [name]="Plus" class="w-4 h-4"></lucide-icon>
              Agregar
            </button>
          </div>
        </div>
        @if (loadingCatalogo()) {
          <div class="flex flex-col items-center justify-center py-12">
            <div class="w-8 h-8 border-[3px] border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        } @else {
          <div class="relative flex-1 min-h-0 overflow-x-auto overflow-y-auto">
            <table class="w-full min-w-[600px] border-collapse h-full">
              <thead>
                <tr class="bg-slate-50/75 dark:bg-slate-800/40 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider" [class.border-b]="catalogoFiltrados.length > 0" [class.border-slate-200]="catalogoFiltrados.length > 0" [class.dark:border-slate-800]="catalogoFiltrados.length > 0">
                  <th class="px-6 py-4 text-center" [class.ps-shift-nombre]="seccion() === 'preguntas-seguridad'">Nombre</th>
                  <th class="px-4 py-4 text-center" [class.ps-shift-estado]="seccion() === 'preguntas-seguridad'">Estado</th>
                  <th class="px-4 py-4 text-center" [class.ps-shift-acciones]="seccion() === 'preguntas-seguridad'">Acciones</th>
                </tr>
              </thead>
              <tbody class="text-slate-700 dark:text-slate-300">
                @for (item of catalogoFiltrados | paginate:currentPage:pageSize; track item.id) {
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800/60">
                    <td class="px-6 py-4 text-center" [class.ps-shift-nombre]="seccion() === 'preguntas-seguridad'">
                      <span class="text-sm font-bold text-slate-800 dark:text-white">{{ item.nombre }}</span>
                    </td>
                    <td class="px-4 py-4 text-center" [class.ps-shift-estado]="seccion() === 'preguntas-seguridad'">
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold" [class]="item.activo ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'">
                        {{ item.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="px-4 py-4 text-center" [class.ps-shift-acciones]="seccion() === 'preguntas-seguridad'">
                      <div class="flex items-center justify-center gap-3">
                        <button (click)="openEdit(item)" aria-label="Editar elemento" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 hover:shadow-[0_2px_10px_-3px_rgba(59,130,246,0.4)] dark:hover:bg-blue-900/30 rounded-xl transition-all cursor-pointer">
                          <lucide-icon [name]="Pencil" class="w-4 h-4"></lucide-icon>
                        </button>
                        <label class="relative inline-flex items-center cursor-pointer" [title]="item.activo ? 'Desactivar' : 'Activar'">
                          <input type="checkbox" [checked]="item.activo" (change)="toggleActivo(item)" class="sr-only peer" />
                          <div class="relative w-9 h-5 rounded-full transition-all duration-300 shadow-inner cursor-pointer"
                               [style.background]="item.activo ? '#10b981' : '#cbd5e1'">
                            <div class="absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300"
                                 [style.transform]="item.activo ? 'translateX(16px)' : 'translateX(0)'"></div>
                          </div>
                        </label>
                        <button (click)="deleteItem(item)" aria-label="Eliminar elemento" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 hover:shadow-[0_2px_10px_-3px_rgba(244,63,94,0.4)] dark:hover:bg-rose-900/30 rounded-xl transition-all cursor-pointer">
                          <lucide-icon [name]="Trash2" class="w-4 h-4"></lucide-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
                @for (_ of catalogoFiltrados | fillers:currentPage:pageSize; track $index) {
                  <tr class="hover:bg-transparent">
                    <td colspan="3" class="px-6 py-4"></td>
                  </tr>
                }
              </tbody>
            </table>
            @if (catalogoFiltrados.length === 0) {
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                <lucide-icon [name]="ClipboardList" class="text-5xl text-slate-300 dark:text-slate-600"></lucide-icon>
                <span class="text-sm text-slate-400 dark:text-slate-500 font-normal">No se encontraron datos.</span>
              </div>
            }
          </div>
          <app-pagination [currentPage]="currentPage" [totalItems]="catalogoFiltrados.length" [pageSize]="pageSize" (pageChange)="currentPage = $event"></app-pagination>
        }
      </div>
    </div>

    <!-- Modal Agregar -->
    @if (showForm()) {
        <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" (click)="cancelNew()">
          <div class="absolute inset-0 bg-black/50 "></div>
          <div class="relative z-10 w-full max-w-md flex flex-col bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl overflow-hidden" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-4 sm:p-6 bg-blue-600 dark:bg-blue-700 shrink-0">
              <div class="min-w-0">
                <h3 class="text-base sm:text-lg font-black text-white tracking-tight truncate">{{ editingId() ? 'Editar elemento' : 'Agregar elemento' }}</h3>
                <p class="text-[10px] sm:text-xs text-blue-100 font-normal mt-0.5 truncate">{{ tituloCatalogo() }}</p>
              </div>
              <button (click)="cancelNew()" class="w-8 h-8 flex items-center justify-center rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="p-4 sm:p-6">
              <label class="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Nombre</label>
              <input #newInput [(ngModel)]="newNombre" name="newNombre" placeholder="Nombre del nuevo elemento" (keyup.enter)="saveNew()" class="w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-normal text-sm" />
            </div>
            <div class="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
              <button type="button" (click)="cancelNew()" class="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer">Cancelar</button>
              <button type="button" (click)="editingId() ? saveEdit() : saveNew()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer text-sm">{{ editingId() ? 'Guardar cambios' : 'Guardar' }}</button>
            </div>
          </div>
        </div>
      }
  `,
  styles: [`
    @media (min-width: 1024px) {
      .ps-shift-nombre { transform: translateX(-136px); }
      .ps-shift-estado { transform: translateX(-248px); }
      .ps-shift-acciones { transform: translateX(-104px); }
    }
  `]
})
export class ConfiguracionComponent implements OnInit, OnDestroy {
  private catSvc = inject(CatalogoService);
  private notify = inject(NotificationService);
  private route = inject(ActivatedRoute);

  private sub?: Subscription;

  seccion = signal('parentescos');

  readonly Plus = Plus;
  readonly Trash2 = Trash2;
  readonly ClipboardList = ClipboardList;
  readonly Search = Search;
  readonly ChevronDown = ChevronDown;
  readonly CheckCircle2 = CheckCircle2;
  readonly Pencil = Pencil;

  private el = inject(ElementRef);

  catalogoItems = signal<CatalogoItem[]>([]);
  loadingCatalogo = signal(false);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  newNombre = '';

  pageSize = 8;
  currentPage = 1;
  searchQuery = '';
  searchFilter = 'todo';
  showSearchFilterDropdown = false;
  searchFilterOptions = [
    { value: 'todo', label: 'TODO' },
    { value: 'nombre', label: 'NOMBRE' },
  ];

  get catalogoFiltrados(): CatalogoItem[] {
    const q = (this.searchQuery || '').trim().toLowerCase();
    if (!q) return this.catalogoItems();
    const matchNombre = (i: CatalogoItem) => (i.nombre || '').toLowerCase().includes(q);
    return this.catalogoItems().filter(i => this.searchFilter === 'nombre' ? matchNombre(i) : matchNombre(i));
  }

  onSearchChange(value: string | undefined) {
    this.searchQuery = value || '';
    this.currentPage = 1;
  }

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

  tituloSeccion(): string {
    return this.tituloCatalogo();
  }

  subtituloSeccion(): string {
    if (this.seccion() === 'preguntas-seguridad') {
      return 'Define las preguntas de seguridad disponibles para recuperar la contraseña de los usuarios.';
    }
    return 'Administra los catálogos del sistema.';
  }

  tituloCatalogo(): string {
    const map: Record<string, string> = {
      parentescos: 'Parentescos',
      'estados-civiles': 'Estados Civiles',
      'niveles-educativos': 'Niveles Educativos',
      ocupaciones: 'Ocupaciones',
      'tipos-vivienda': 'Tipos de Vivienda',
      'tipos-discapacidad': 'Tipos de Discapacidad',
      'preguntas-seguridad': 'Preguntas de Seguridad',
    };
    return map[this.seccion()] || 'Catálogos';
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.seccion.set(params['seccion'] || 'parentescos');
      this.loadCatalogo();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  loadCatalogo() {
    const catalogo = this.seccion() as CatalogoNombre;
    this.loadingCatalogo.set(true);
    this.catSvc.getAll(catalogo).subscribe({
      next: (r) => { this.catalogoItems.set(r.data); this.loadingCatalogo.set(false); },
      error: () => this.loadingCatalogo.set(false),
    });
  }

  addItem() {
    this.showForm.set(true);
    this.newNombre = '';
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>('[name="newNombre"]');
      el?.focus();
    }, 150);
  }

  cancelNew() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.newNombre = '';
  }

  saveNew() {
    if (!this.newNombre.trim()) return;
    this.catSvc.create(this.seccion() as CatalogoNombre, this.newNombre.trim()).subscribe({
      next: () => {
        this.notify.success('Elemento agregado');
        this.showForm.set(false);
        this.newNombre = '';
        this.loadCatalogo();
      },
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al guardar.'),
    });
  }

  openEdit(item: CatalogoItem) {
    this.editingId.set(item.id);
    this.newNombre = item.nombre;
    this.showForm.set(true);
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>('[name="newNombre"]');
      el?.focus();
    }, 150);
  }

  saveEdit() {
    if (!this.newNombre.trim() || !this.editingId()) return;
    this.catSvc.update(this.seccion() as CatalogoNombre, this.editingId()!, { nombre: this.newNombre.trim() }).subscribe({
      next: () => {
        this.notify.success('Elemento actualizado');
        this.showForm.set(false);
        this.editingId.set(null);
        this.newNombre = '';
        this.loadCatalogo();
      },
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al actualizar.'),
    });
  }

  toggleActivo(item: CatalogoItem) {
    const prev = item.activo;
    item.activo = !item.activo;
    this.catSvc.update(this.seccion() as CatalogoNombre, item.id, { activo: item.activo }).subscribe({
      next: () => {},
      error: (e) => {
        item.activo = prev;
        this.notify.error('Error', e?.error?.message ?? 'Error al actualizar.');
      },
    });
  }

  async deleteItem(item: CatalogoItem) {
    const confirmed = await this.notify.confirm('¿Eliminar elemento?', `Se eliminará "${item.nombre}" de forma permanente.`);
    if (!confirmed) return;
    this.catSvc.delete(this.seccion() as CatalogoNombre, item.id).subscribe({
      next: () => { this.notify.success('Elemento eliminado'); this.loadCatalogo(); },
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al eliminar.'),
    });
  }
}
