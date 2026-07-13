import { Component, inject, OnInit, signal, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FamiliasService } from '../../core/services/familias.service';
import { ConsejosService } from '../../core/services/consejos.service';
import { MiembrosService } from '../../core/services/miembros.service';
import { CatalogoService, CatalogoItem } from '../../core/services/catalogo.service';
import { NotificationService } from '../../core/services/notification.service';
import { Familia, Miembro, ConsejoComunal } from '../../core/models/usuario.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PaginatePipe } from '../../shared/pipes/paginate.pipe';
import { FillersPipe } from '../../shared/pipes/fillers.pipe';
import { LucideAngularModule, Eye, Edit2, Trash2, Plus, Search, ChevronDown, CheckCircle2 } from 'lucide-angular';

@Component({
  selector: 'app-familia-list',
  standalone: true,
  imports: [FormsModule, PaginationComponent, PaginatePipe, FillersPipe, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">

      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Familias</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 font-normal">Registro de núcleos familiares censados en los consejos comunales.</p>
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
                <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange($event)" placeholder="Buscar familia..." class="w-full pl-[72px] pr-4 py-3 text-sm focus:outline-none font-normal bg-transparent rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" />
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
                        <button (click)="openView(f)" aria-label="Ver familia" class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 hover:shadow-[0_2px_10px_-3px_rgba(16,185,129,0.4)] dark:hover:bg-emerald-900/30 rounded-xl transition-all cursor-pointer">
                          <lucide-icon [name]="Eye" class="w-4 h-4"></lucide-icon>
                        </button>
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
                    <td colspan="5" class="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500 font-normal">
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
        <div class="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between p-6 bg-blue-600 dark:bg-blue-700">
            <div>
              <h3 class="text-lg font-black text-white tracking-tight">{{ editingId() ? 'Editar Familia' : 'Nueva Familia' }}</h3>
              <p class="text-xs text-blue-100 font-normal mt-0.5">Registra la información del núcleo familiar.</p>
            </div>
            <button (click)="closeModal()" class="w-8 h-8 flex items-center justify-center rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6"
               [class.max-h-[70vh]]="editingId() ? editingFamiliaMiembros().length > 2 : pendingMiembros().length > 2"
               [class.overflow-y-auto]="editingId() ? editingFamiliaMiembros().length > 2 : pendingMiembros().length > 2">
            @if (modalError()) {
              <div class="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl p-4 mb-6 text-sm font-normal">
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
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Dirección <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="form.direccion" name="direccion" required placeholder="Ej: Calle El Carmen, casa 4-B"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Consejo Comunal <span class="text-red-500">*</span></label>
                  <select [(ngModel)]="form.consejoId" name="consejoId"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal">
                    <option value="">Seleccionar consejo...</option>
                    @for (c of consejos(); track c.id) {
                      <option [value]="c.id">{{ c.nombre }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Members Section -->
              <div class="pt-6 border-t border-slate-100 dark:border-slate-800/60">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Miembros
                    <span class="ml-2 inline-flex items-center justify-center w-6 h-6 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black rounded-full">
                      {{ editingId() ? editingFamiliaMiembros().length : pendingMiembros().length }}
                    </span>
                  </h4>
                  <button type="button" (click)="openMiembroModal(editingId() ?? undefined)" class="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer">
                    <span>+</span><span>Miembro</span>
                  </button>
                </div>
                <div class="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                  <table class="w-full">
                    <thead>
                      <tr class="bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <th class="px-4 py-3 text-center">Nombre</th>
                        <th class="px-4 py-3 text-center">Cédula</th>
                        <th class="px-4 py-3 text-center">Rol</th>
                        <th class="px-4 py-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                      @if (editingId()) {
                        @for (m of editingFamiliaMiembros(); track m.id) {
                          <tr>
                            <td class="px-4 py-3 text-center text-sm text-slate-700 dark:text-slate-300">{{ m.nombre }} {{ m.apellido }}</td>
                            <td class="px-4 py-3 text-center text-sm text-slate-500 dark:text-slate-400">{{ m.cedula }}</td>
                            <td class="px-4 py-3 text-center">
                              @if (m.jefeFamilia) {
                                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">Jefe</span>
                              }
                            </td>
                            <td class="px-4 py-3">
                              <div class="flex justify-center gap-1">
                                <button type="button" (click)="openMiembroModal(editingId()!, m)" aria-label="Editar miembro" class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all cursor-pointer">
                                  <lucide-icon [name]="Edit2" class="w-3.5 h-3.5"></lucide-icon>
                                </button>
                                <button type="button" (click)="deleteMiembro(editingId()!, m)" aria-label="Eliminar miembro" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-all cursor-pointer">
                                  <lucide-icon [name]="Trash2" class="w-3.5 h-3.5"></lucide-icon>
                                </button>
                              </div>
                            </td>
                          </tr>
                        } @empty {
                          <tr>
                            <td colspan="4" class="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-normal">
                              Sin miembros registrados. Agrega el primero.
                            </td>
                          </tr>
                        }
                      } @else {
                        @for (m of pendingMiembros(); track $index) {
                          <tr>
                            <td class="px-4 py-3 text-center text-sm text-slate-700 dark:text-slate-300">{{ m.nombre }} {{ m.apellido }}</td>
                            <td class="px-4 py-3 text-center text-sm text-slate-500 dark:text-slate-400">{{ m.cedula }}</td>
                            <td class="px-4 py-3 text-center">
                              @if (m.jefeFamilia) {
                                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">Jefe</span>
                              }
                            </td>
                            <td class="px-4 py-3">
                              <div class="flex justify-center gap-1">
                                <button type="button" (click)="openMiembroModal(undefined, m, $index)" aria-label="Editar miembro" class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all cursor-pointer">
                                  <lucide-icon [name]="Edit2" class="w-3.5 h-3.5"></lucide-icon>
                                </button>
                                <button type="button" (click)="removePendingMiembro($index)" aria-label="Eliminar miembro" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-all cursor-pointer">
                                  <lucide-icon [name]="Trash2" class="w-3.5 h-3.5"></lucide-icon>
                                </button>
                              </div>
                            </td>
                          </tr>
                        } @empty {
                          <tr>
                            <td colspan="4" class="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-normal">
                              Sin miembros aún. Agrega el primero.
                            </td>
                          </tr>
                        }
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <button type="button" (click)="closeModal()" class="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer">Cancelar</button>
                <button type="submit" [disabled]="saving()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed text-sm">
                  {{ saving() ? 'Guardando...' : (editingId() ? 'Guardar Cambios' : 'Crear Familia') }}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    }

    <!-- View Modal -->
    @if (showViewModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="closeViewModal()">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between p-6 bg-emerald-600 dark:bg-emerald-700">
            <div>
              <h3 class="text-lg font-black text-white tracking-tight">Familia</h3>
              <p class="text-xs text-white font-normal mt-0.5">Información registrada del núcleo familiar.</p>
            </div>
            <button (click)="closeViewModal()" class="w-8 h-8 flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6"
               [class.max-h-[70vh]]="viewFamilia()!.miembros && viewFamilia()!.miembros!.length > 2"
               [class.overflow-y-auto]="viewFamilia()!.miembros && viewFamilia()!.miembros!.length > 2">
            @if (viewFamilia()) {
              <div class="space-y-6">

                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Nombre de la familia</label>
                  <div class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-normal">{{ viewFamilia()!.nombre }}</div>
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Dirección</label>
                  <div class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-normal">{{ viewFamilia()!.direccion }}</div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Consejo Comunal</label>
                    <div class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-normal">{{ viewFamilia()!.consejo?.nombre ?? '---' }}</div>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Miembros</label>
                    <div class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-normal">{{ viewFamilia()!.miembros?.length ?? 0 }}</div>
                  </div>
                </div>

                @if (viewFamilia()!.miembros && viewFamilia()!.miembros!.length > 0) {
                  <div class="space-y-3">
                    <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Integrantes</label>
                    <div class="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                      <table class="w-full">
                        <thead>
                          <tr class="bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            <th class="px-4 py-3 text-center">Nombre</th>
                            <th class="px-4 py-3 text-center">Cédula</th>
                            <th class="px-4 py-3 text-center">Rol</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                          @for (m of viewFamilia()!.miembros; track m.id) {
                            <tr>
                              <td class="px-4 py-3 text-center text-sm text-slate-700 dark:text-slate-300">{{ m.nombre }} {{ m.apellido }}</td>
                              <td class="px-4 py-3 text-center text-sm text-slate-500 dark:text-slate-400">{{ m.cedula }}</td>
                              <td class="px-4 py-3 text-center">
                                @if (m.jefeFamilia) {
                                  <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">Jefe</span>
                                }
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                }

              </div>
            }
          </div>

        </div>
      </div>
    }

    <!-- Miembro Modal -->
    @if (showMiembroModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="closeMiembroModal()">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between p-6 bg-blue-600 dark:bg-blue-700">
            <div>
              <h3 class="text-lg font-black text-white tracking-tight">{{ miembroEditingId() ? 'Editar Miembro' : 'Nuevo Miembro' }}</h3>
              <p class="text-xs text-blue-100 font-normal mt-0.5">Datos del integrante del núcleo familiar.</p>
            </div>
            <button (click)="closeMiembroModal()" class="w-8 h-8 flex items-center justify-center rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 max-h-[85vh] overflow-y-auto">
            @if (miembroError()) {
              <div class="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl p-4 mb-6 text-sm font-normal">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <span>{{ miembroError() }}</span>
              </div>
            }

            <form (ngSubmit)="saveMiembro()" class="space-y-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Nombre <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="miembroForm.nombre" name="mNombre" required placeholder="Ej: Carlos"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Apellido <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="miembroForm.apellido" name="mApellido" required placeholder="Ej: Rodríguez"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Cédula <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="miembroForm.cedula" name="mCedula" required placeholder="Ej: V-12345678"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-sm"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Fecha de nacimiento</label>
                  <input [(ngModel)]="miembroForm.fechaNacimiento" name="mFechaNacimiento" type="date"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-sm"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Sexo</label>
                  <select [(ngModel)]="miembroForm.sexo" name="mSexo"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal">
                    <option value="">— Sin especificar —</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Parentesco</label>
                  <select [(ngModel)]="miembroForm.parentesco" name="mParentesco"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal">
                    <option value="">— Seleccionar —</option>
                    @for (p of parentescos(); track p.id) {
                      <option [value]="p.nombre">{{ p.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Estado civil</label>
                  <select [(ngModel)]="miembroForm.estadoCivil" name="mEstadoCivil"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal">
                    <option value="">— Seleccionar —</option>
                    @for (e of estadosCiviles(); track e.id) {
                      <option [value]="e.nombre">{{ e.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Nivel educativo</label>
                  <select [(ngModel)]="miembroForm.nivelEducativo" name="mNivelEducativo"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal">
                    <option value="">— Seleccionar —</option>
                    @for (n of nivelesEducativos(); track n.id) {
                      <option [value]="n.nombre">{{ n.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Ocupación</label>
                  <select [(ngModel)]="miembroForm.ocupacion" name="mOcupacion"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal">
                    <option value="">— Seleccionar —</option>
                    @for (o of ocupaciones(); track o.id) {
                      <option [value]="o.nombre">{{ o.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Teléfono</label>
                  <input [(ngModel)]="miembroForm.telefono" name="mTelefono" placeholder="Ej: 0414-5555555"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-sm"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Email</label>
                  <input [(ngModel)]="miembroForm.email" name="mEmail" type="email" placeholder="correo@ejemplo.com"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-sm"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Es jefe/a de familia</label>
                  <div class="flex items-center gap-2 bg-white dark:bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 w-fit">
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" [(ngModel)]="miembroForm.jefeFamilia" name="mJefeFamilia" class="sr-only peer" />
                      <div
                        class="relative w-9 h-5 rounded-full transition-all duration-300 shadow-inner cursor-pointer"
                        [style.background]="miembroForm.jefeFamilia ? '#10b981' : '#cbd5e1'"
                      >
                        <div
                          class="absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300"
                          [style.transform]="miembroForm.jefeFamilia ? 'translateX(16px)' : 'translateX(0)'"
                        ></div>
                      </div>
                    </label>
                    <span class="text-[10px] font-bold uppercase tracking-wider" [class.text-emerald-600]="miembroForm.jefeFamilia" [class.text-slate-400]="!miembroForm.jefeFamilia">{{ miembroForm.jefeFamilia ? 'Sí' : 'No' }}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <button type="button" (click)="closeMiembroModal()" class="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer">Cancelar</button>
                <button type="submit" [disabled]="miembroSaving()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed text-sm">
                  {{ miembroSaving() ? 'Guardando...' : 'Guardar Miembro' }}
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
  private miembSvc = inject(MiembrosService);
  private catSvc  = inject(CatalogoService);
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

  // View modal
  showViewModal = signal(false);
  viewFamilia   = signal<Familia | null>(null);

  // Miembro modal
  showMiembroModal  = signal(false);
  miembroEditingId  = signal<number | null>(null);
  miembroSaving     = signal(false);
  miembroError      = signal('');
  miembroForm: Partial<Miembro> = { nombre: '', apellido: '', cedula: '', jefeFamilia: false };
  currentFamiliaId  = signal<number | null>(null);

  // Catalogs
  parentescos       = signal<CatalogoItem[]>([]);
  estadosCiviles    = signal<CatalogoItem[]>([]);
  nivelesEducativos = signal<CatalogoItem[]>([]);
  ocupaciones       = signal<CatalogoItem[]>([]);

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
    this.catSvc.getActive('parentescos').subscribe((r) => this.parentescos.set(r.data));
    this.catSvc.getActive('estados-civiles').subscribe((r) => this.estadosCiviles.set(r.data));
    this.catSvc.getActive('niveles-educativos').subscribe((r) => this.nivelesEducativos.set(r.data));
    this.catSvc.getActive('ocupaciones').subscribe((r) => this.ocupaciones.set(r.data));
  }

  openModal() {
    this.form = { nombre: '', direccion: '', consejoId: undefined };
    this.editingId.set(null);
    this.modalError.set('');
    this.pendingMiembros.set([]);
    this.pendingMiembroIndex.set(-1);
    this.showModal.set(true);
  }

  openEdit(f: Familia) {
    this.form = { ...f };
    this.editingId.set(f.id!);
    this.modalError.set('');
    this.showModal.set(true);
    this.loadEditingMiembros(f.id!);
  }

  editingFamiliaMiembros = signal<Miembro[]>([]);
  pendingMiembros = signal<Partial<Miembro>[]>([]);
  pendingMiembroIndex = signal(-1);

  private loadEditingMiembros(familiaId: number) {
    this.miembSvc.getByFamilia(familiaId).subscribe({
      next: (r) => this.editingFamiliaMiembros.set(r.data),
      error: () => this.editingFamiliaMiembros.set([]),
    });
  }

  closeModal() {
    this.showModal.set(false);
    this.saving.set(false);
    this.modalError.set('');
    this.editingFamiliaMiembros.set([]);
    this.pendingMiembros.set([]);
    this.pendingMiembroIndex.set(-1);
  }

  openView(f: Familia) {
    this.showViewModal.set(true);
    this.viewFamilia.set({ ...f, miembros: [] });
    this.famSvc.getById(f.id!).subscribe({
      next: (r) => this.viewFamilia.set(r.data),
      error: () => this.viewFamilia.set(f),
    });
  }

  closeViewModal() {
    this.showViewModal.set(false);
    this.viewFamilia.set(null);
  }

  openMiembroModal(familiaId?: number, m?: Partial<Miembro>, pendingIdx?: number) {
    this.currentFamiliaId.set(familiaId ?? null);
    this.pendingMiembroIndex.set(pendingIdx ?? -1);
    if (m) {
      this.miembroForm = { ...m };
      this.miembroEditingId.set(m.id ?? null);
    } else {
      this.miembroForm = { nombre: '', apellido: '', cedula: '', jefeFamilia: false };
      this.miembroEditingId.set(null);
    }
    this.miembroError.set('');
    this.showMiembroModal.set(true);
  }

  closeMiembroModal() {
    this.showMiembroModal.set(false);
    this.miembroSaving.set(false);
    this.miembroError.set('');
  }

  saveMiembro() {
    this.miembroSaving.set(true);
    this.miembroError.set('');
    const editingId = this.editingId();
    const pendingIdx = this.pendingMiembroIndex();

    if (editingId) {
      const id = this.miembroEditingId();
      const obs = id ? this.miembSvc.update(id, this.miembroForm) : this.miembSvc.create({ ...this.miembroForm, familiaId: editingId });
      obs.subscribe({
        next: () => {
          this.miembroSaving.set(false);
          this.notify.success(id ? 'Miembro actualizado' : 'Miembro creado', 'Los datos del miembro se han guardado.');
          this.closeMiembroModal();
          this.famSvc.getAll().subscribe((r) => { this.familias.set(r.data); this.currentPage = 1; });
          this.loadEditingMiembros(editingId);
        },
        error: (e) => { this.miembroError.set(e?.error?.message ?? 'Error.'); this.miembroSaving.set(false); this.notify.error('Error', e?.error?.message ?? 'Error al guardar el miembro.'); },
      });
    } else {
      if (pendingIdx >= 0) {
        const updated = [...this.pendingMiembros()];
        updated[pendingIdx] = { ...this.miembroForm };
        this.pendingMiembros.set(updated);
      } else {
        this.pendingMiembros.set([...this.pendingMiembros(), { ...this.miembroForm }]);
      }
      this.miembroSaving.set(false);
      this.notify.success('Miembro agregado', 'Se agregará al guardar la familia.');
      this.closeMiembroModal();
    }
  }

  async deleteMiembro(familiaId: number, m: Miembro) {
    const confirmed = await this.notify.confirm('¿Eliminar miembro?', `Se eliminará a "${m.nombre} ${m.apellido}" del núcleo familiar.`);
    if (!confirmed) return;
    this.miembSvc.delete(m.id!).subscribe({
      next: () => { this.notify.success('Miembro eliminado'); this.famSvc.getAll().subscribe((r) => { this.familias.set(r.data); this.currentPage = 1; }); this.loadEditingMiembros(familiaId); },
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al eliminar.'),
    });
  }

  async removePendingMiembro(index: number) {
    const m = this.pendingMiembros()[index];
    const confirmed = await this.notify.confirm('¿Eliminar miembro?', `Se eliminará a "${m.nombre} ${m.apellido}" de la lista.`);
    if (!confirmed) return;
    const updated = this.pendingMiembros().filter((_, i) => i !== index);
    this.pendingMiembros.set(updated);
    this.notify.success('Miembro removido');
  }

  save() {
    this.saving.set(true);
    this.modalError.set('');
    if (!this.form.nombre?.trim() || !this.form.direccion?.trim() || !this.form.consejoId) {
      this.modalError.set('Completa todos los campos obligatorios.');
      this.saving.set(false);
      return;
    }
    const id = this.editingId();
    const obs = id ? this.famSvc.update(id, this.form) : this.famSvc.create(this.form);
    obs.subscribe({
      next: (r) => {
        this.saving.set(false);
        if (id) {
          this.notify.success('Familia actualizada', 'La familia se ha guardado correctamente.');
          this.closeModal();
          this.famSvc.getAll().subscribe((r) => { this.familias.set(r.data); this.currentPage = 1; });
        } else {
          const newId = r.data.id!;
          const pending = this.pendingMiembros();
          if (pending.length > 0) {
            this.createPendingMiembros(newId, pending, true);
          } else {
            this.notify.success('Familia creada', 'La familia se ha creado.');
            this.closeModal();
            this.famSvc.getAll().subscribe((r) => { this.familias.set(r.data); this.currentPage = 1; });
          }
        }
      },
      error: (e) => { this.modalError.set(e?.error?.message ?? 'Error.'); this.saving.set(false); this.notify.error('Error', e?.error?.message ?? 'Error al guardar la familia.'); },
    });
  }

  private createPendingMiembros(familiaId: number, pending: Partial<Miembro>[], closeAfter = false) {
    let created = 0;
    let errors = 0;
    const total = pending.length;
    const refreshAndClose = () => {
      this.famSvc.getAll().subscribe((r) => { this.familias.set(r.data); this.currentPage = 1; });
      if (closeAfter) {
        this.closeModal();
      } else {
        this.loadEditingMiembros(familiaId);
      }
    };
    pending.forEach((m) => {
      this.miembSvc.create({ ...m, familiaId }).subscribe({
        next: () => {
          created++;
          if (created + errors === total) {
            this.pendingMiembros.set([]);
            if (errors > 0) {
              this.notify.success('Familia creada', `Se crearon ${created} de ${total} miembros.`);
            } else {
              this.notify.success('Familia y miembros creados', 'La familia y todos sus miembros se han registrado.');
            }
            refreshAndClose();
          }
        },
        error: () => {
          errors++;
          if (created + errors === total) {
            this.pendingMiembros.set([]);
            this.notify.success('Familia creada', `Se crearon ${created} de ${total} miembros.`);
            refreshAndClose();
          }
        },
      });
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

