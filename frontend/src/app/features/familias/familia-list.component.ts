import { Component, inject, OnInit, signal, ElementRef, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FamiliasService } from '../../core/services/familias.service';
import { ConsejosService } from '../../core/services/consejos.service';
import { NotificationService } from '../../core/services/notification.service';
import { Familia, ConsejoComunal } from '../../core/models/usuario.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PaginatePipe } from '../../shared/pipes/paginate.pipe';
import { FillersPipe } from '../../shared/pipes/fillers.pipe';
import { LucideAngularModule, Eye, Edit2, Trash2, Plus, Search, ChevronDown, CheckCircle2 } from 'lucide-angular';

@Component({
  selector: 'app-familia-list',
  standalone: true,
  imports: [RouterLink, FormsModule, PaginationComponent, PaginatePipe, FillersPipe, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">

      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Familias</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">Registro de núcleos familiares censados en los consejos comunales.</p>
        </div>
        <button (click)="openModal()" class="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 text-sm cursor-pointer">
          <span class="text-lg leading-none">+</span>
          <span>Nueva familia</span>
        </button>
      </div>

      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl">
          <div class="w-8 h-8 border-[3px] border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <span class="text-sm text-slate-500 dark:text-slate-400 mt-4 font-semibold animate-pulse">Cargando familias...</span>
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
                <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange($event)" placeholder="Buscar familia..." class="w-full pl-[72px] pr-4 py-3 text-sm focus:outline-none font-medium bg-transparent rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" />
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full table-fixed border-collapse">
              <thead>
                <tr class="bg-slate-50/75 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th class="w-[28%] px-6 py-4 text-center">Nombre</th>
                  <th class="w-[22%] px-4 py-4 text-center">Dirección</th>
                  <th class="w-[20%] px-4 py-4 text-center">Consejo</th>
                  <th class="w-[12%] px-4 py-4 text-center">Miembros</th>
                  <th class="w-[18%] px-4 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                @for (f of familiasFiltradas | paginate:currentPage:pageSize; track f.id) {
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td class="px-6 py-4 text-center">
                      <span class="text-sm text-slate-500 dark:text-slate-400 truncate block">{{ f.nombre }}</span>
                    </td>
                    <td class="px-4 py-4 text-center text-sm text-slate-500 dark:text-slate-400 truncate">{{ f.direccion }}</td>
                    <td class="px-4 py-4 text-center text-sm text-slate-500 dark:text-slate-400 truncate">{{ f.consejo?.nombre ?? '—' }}</td>
                    <td class="px-4 py-4 text-center">
                      <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-black">
                        {{ f.miembros?.length ?? 0 }}
                      </span>
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex justify-center gap-1">
                        <a [routerLink]="[f.id]" aria-label="Ver familia" class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 hover:shadow-[0_2px_10px_-3px_rgba(16,185,129,0.4)] dark:hover:bg-emerald-900/30 rounded-xl transition-all cursor-pointer">
                          <lucide-icon [name]="Eye" class="w-4 h-4"></lucide-icon>
                        </a>
                        <button (click)="openEdit(f)" aria-label="Editar familia" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 hover:shadow-[0_2px_10px_-3px_rgba(59,130,246,0.4)] dark:hover:bg-blue-900/30 rounded-xl transition-all cursor-pointer">
                          <lucide-icon [name]="Edit2" class="w-4 h-4"></lucide-icon>
                        </button>
                        <button (click)="deleteFamilia(f)" aria-label="Eliminar familia" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 hover:shadow-[0_2px_10px_-3px_rgba(244,63,94,0.4)] dark:hover:bg-rose-900/30 rounded-xl transition-all cursor-pointer">
                          <lucide-icon [name]="Trash2" class="w-4 h-4"></lucide-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500 font-medium">
                      No se encontraron familias registradas.
                    </td>
                  </tr>
                }
                @for (_ of familiasFiltradas | fillers:currentPage:pageSize; track $index) {
                  <tr><td colspan="5" class="px-6 py-4">&nbsp;</td></tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination [currentPage]="currentPage" [totalItems]="familiasFiltradas.length" [pageSize]="pageSize" (pageChange)="currentPage = $event"></app-pagination>
        </div>
      }
    </div>

    <!-- Modal -->
    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="closeModal()">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between p-6 bg-blue-600 dark:bg-blue-700">
            <div>
              <h3 class="text-lg font-black text-white tracking-tight">{{ editingId() ? 'Editar Familia' : 'Nueva Familia' }}</h3>
              <p class="text-xs text-blue-100 font-medium mt-0.5">Registra la información del núcleo familiar.</p>
            </div>
            <button (click)="closeModal()" class="w-8 h-8 flex items-center justify-center rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 max-h-[70vh] overflow-y-auto">
            @if (modalError()) {
              <div class="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl p-4 mb-6 text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <span>{{ modalError() }}</span>
              </div>
            }

            <form (ngSubmit)="save()" class="space-y-6">
              <div class="grid grid-cols-1 gap-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Nombre de la familia <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="form.nombre" name="nombre" required placeholder="Ej: Familia García Pérez"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Dirección <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="form.direccion" name="direccion" required placeholder="Ej: Calle El Carmen, casa 4-B"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Consejo Comunal <span class="text-red-500">*</span></label>
                  <select [(ngModel)]="form.consejoId" name="consejoId" required
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium">
                    <option value="">Seleccionar consejo...</option>
                    @for (c of consejos(); track c.id) {
                      <option [value]="c.id">{{ c.nombre }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <button type="button" (click)="closeModal()" class="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer">Cancelar</button>
                <button type="submit" [disabled]="saving()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed text-sm">
                  {{ saving() ? 'Guardando...' : 'Guardar Familia' }}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    }
  `,
  styles: []
})
export class FamiliaListComponent implements OnInit {
  readonly Eye = Eye;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly Plus = Plus;
  readonly Search = Search;
  readonly ChevronDown = ChevronDown;
  readonly CheckCircle2 = CheckCircle2;

  private famSvc  = inject(FamiliasService);
  private conSvc  = inject(ConsejosService);
  private notify = inject(NotificationService);
  private el = inject(ElementRef);

  pageSize = 8;
  currentPage = 1;

  familias = signal<Familia[]>([]);
  loading  = signal(true);
  consejos = signal<ConsejoComunal[]>([]);

  searchQuery = '';
  searchFilter = 'todo';
  showSearchFilterDropdown = false;
  searchFilterOptions = [
    { value: 'todo', label: 'TODO' },
    { value: 'nombre', label: 'NOMBRE' },
    { value: 'direccion', label: 'DIRECCIÓN' },
    { value: 'consejo', label: 'CONSEJO' },
  ];

  get familiasFiltradas(): Familia[] {
    return this.familias().filter(f => {
      const q = (this.searchQuery || '').trim().toLowerCase();
      if (!q) return true;
      const matchNombre = (f.nombre || '').toLowerCase().includes(q);
      const matchDireccion = (f.direccion || '').toLowerCase().includes(q);
      const matchConsejo = (f.consejo?.nombre || '').toLowerCase().includes(q);
      if (this.searchFilter === 'nombre') return matchNombre;
      if (this.searchFilter === 'direccion') return matchDireccion;
      if (this.searchFilter === 'consejo') return matchConsejo;
      return matchNombre || matchDireccion || matchConsejo;
    });
  }

  showModal  = signal(false);
  editingId  = signal<number | null>(null);
  saving     = signal(false);
  modalError = signal('');

  form: Partial<Familia> = { nombre: '', direccion: '', consejoId: undefined };

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
    this.conSvc.getAll(1, 100).subscribe((r) => this.consejos.set(r.data));
    this.famSvc.getAll().subscribe({
      next: (r) => { this.familias.set(r.data); this.currentPage = 1; this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  openModal() {
    this.form = { nombre: '', direccion: '', consejoId: undefined };
    this.editingId.set(null);
    this.modalError.set('');
    this.showModal.set(true);
  }

  openEdit(f: Familia) {
    this.form = { ...f };
    this.editingId.set(f.id!);
    this.modalError.set('');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.saving.set(false);
    this.modalError.set('');
  }

  save() {
    this.saving.set(true);
    this.modalError.set('');
    const id = this.editingId();
    const obs = id ? this.famSvc.update(id, this.form) : this.famSvc.create(this.form);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success(id ? 'Familia actualizada' : 'Familia creada', 'La familia se ha guardado correctamente.');
        this.closeModal();
        this.famSvc.getAll().subscribe((r) => { this.familias.set(r.data); this.currentPage = 1; });
      },
      error: (e) => { this.modalError.set(e?.error?.message ?? 'Error.'); this.saving.set(false); this.notify.error('Error', e?.error?.message ?? 'Error al guardar la familia.'); },
    });
  }

  async deleteFamilia(f: Familia) {
    const confirmed = await this.notify.confirm('¿Eliminar familia?', `Se eliminará "${f.nombre}" y todos sus miembros asociados.`);
    if (!confirmed) return;
    this.famSvc.delete(f.id!).subscribe({
      next: () => { this.notify.success('Familia eliminada'); this.famSvc.getAll().subscribe((r) => { this.familias.set(r.data); this.currentPage = 1; }); },
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al eliminar.'),
    });
  }
}
