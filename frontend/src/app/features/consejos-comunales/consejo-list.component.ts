import { Component, inject, OnInit, signal, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConsejosService } from '../../core/services/consejos.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConsejoComunal } from '../../core/models/usuario.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PaginatePipe } from '../../shared/pipes/paginate.pipe';
import { FillersPipe } from '../../shared/pipes/fillers.pipe';
import { LucideAngularModule, Eye, Edit2, Trash2, Plus, Search, ChevronDown, CheckCircle2 } from 'lucide-angular';

@Component({
  selector: 'app-consejo-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, PaginatePipe, FillersPipe, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      
      <!-- Page Header -->
      <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Consejos Comunales</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 font-normal">Administra los consejos comunales adscritos en la jurisdicción de El Valle.</p>
        </div>
        <button 
          (click)="openModal()" 
          class="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 text-sm cursor-pointer"
        >
          <span class="text-lg leading-none">+</span>
          <span>Nuevo consejo</span>
        </button>
      </header>

      <!-- Table Wrapper -->
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl">
          <div class="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <span class="text-sm text-slate-500 dark:text-slate-400 mt-4 font-semibold animate-pulse">Cargando consejos comunales...</span>
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
                <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange($event)" placeholder="Buscar consejo comunal..." class="w-full pl-[72px] pr-4 py-3 text-sm focus:outline-none font-normal bg-transparent rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" />
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm mt-4">
          <div class="overflow-x-auto">
            <table class="w-full table-fixed border-collapse">
              <thead>
                    <tr class="bg-slate-50/75 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <th class="w-[24%] px-6 py-4 text-center">Nombre</th>
                      <th class="w-[14%] px-4 py-4 text-center">RIF</th>
                      <th class="w-[22%] px-4 py-4 text-center">Dirección</th>
                      <th class="w-[14%] px-4 py-4 text-center">Parroquia</th>
                      <th class="w-[12%] px-4 py-4 text-center">Estado</th>
                      <th class="w-[14%] px-4 py-4 text-center">Acciones</th>
                    </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-750 dark:text-slate-300">
                @for (c of consejosFiltrados | paginate:currentPage:pageSize; track c.id) {
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td class="px-6 py-4 text-center">
                      <span class="text-sm text-slate-500 dark:text-slate-400 truncate block">{{ c.nombre }}</span>
                    </td>
                    <td class="px-4 py-4 text-center text-sm text-slate-500 dark:text-slate-400">{{ c.rif }}</td>
                    <td class="px-4 py-4 text-center text-sm text-slate-500 dark:text-slate-400 truncate">{{ c.direccion }}</td>
                    <td class="px-4 py-4 text-center text-sm text-slate-500 dark:text-slate-400">{{ c.parroquia }}</td>
                    <td class="px-4 py-4 text-center">
                      <span 
                        class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold"
                        [class]="c.activo ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'"
                      >
                        {{ c.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex justify-center gap-1">
                        <button (click)="openView(c)" aria-label="Ver consejo" class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 hover:shadow-[0_2px_10px_-3px_rgba(16,185,129,0.4)] dark:hover:bg-emerald-900/30 rounded-xl transition-all cursor-pointer">
                          <lucide-icon [name]="Eye" class="w-4 h-4"></lucide-icon>
                        </button>
                        <button (click)="openEdit(c)" aria-label="Editar consejo" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 hover:shadow-[0_2px_10px_-3px_rgba(59,130,246,0.4)] dark:hover:bg-blue-900/30 rounded-xl transition-all cursor-pointer">
                          <lucide-icon [name]="Edit2" class="w-4 h-4"></lucide-icon>
                        </button>
                        <button (click)="deleteConsejo(c)" aria-label="Eliminar consejo" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 hover:shadow-[0_2px_10px_-3px_rgba(244,63,94,0.4)] dark:hover:bg-rose-900/30 rounded-xl transition-all cursor-pointer">
                          <lucide-icon [name]="Trash2" class="w-4 h-4"></lucide-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500 font-normal">
                      No se encontraron consejos comunales.
                    </td>
                  </tr>
                }
                @for (_ of consejosFiltrados | fillers:currentPage:pageSize; track $index) {
                  <tr><td colspan="6" class="px-6 py-4">&nbsp;</td></tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination [currentPage]="currentPage" [totalItems]="consejosFiltrados.length" [pageSize]="pageSize" (pageChange)="currentPage = $event"></app-pagination>
        </div>
      }
    </div>

    <!-- Modal -->
    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="closeModal()">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        
        <!-- Modal Content -->
        <div class="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" (click)="$event.stopPropagation()">
          
          <!-- Modal Header -->
          <div class="flex items-center justify-between p-6 bg-blue-600 dark:bg-blue-700">
            <div>
              <h3 class="text-lg font-black text-white tracking-tight">{{ editingId() ? 'Editar Consejo' : 'Nuevo Consejo Comunal' }}</h3>
              <p class="text-xs text-blue-100 font-normal mt-0.5">Completa la información formal del consejo comunal.</p>
            </div>
            <button (click)="closeModal()" class="w-8 h-8 flex items-center justify-center rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6">
            @if (modalError()) {
              <div class="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl p-4 mb-6 text-sm font-normal">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{{ modalError() }}</span>
              </div>
            }

            <form (ngSubmit)="save()" class="space-y-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                <!-- Name -->
                <div class="sm:col-span-2 space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Nombre del consejo <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="form.nombre" name="nombre" required placeholder="Ej: Consejo Comunal Patria Querida"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"
                  />
                </div>

                <!-- RIF + Telefono -->
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">RIF <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="form.rif" name="rif" placeholder="J-12345678-9" required
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-sm"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Teléfono</label>
                  <input [(ngModel)]="form.telefono" name="telefono" placeholder="Ej: 0212-5555555"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-sm"
                  />
                </div>

                <!-- Direccion -->
                <div class="sm:col-span-2 space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Dirección detallada <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="form.direccion" name="direccion" required placeholder="Ej: Calle Principal Sector 3, casa N-12"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"
                  />
                </div>

                <!-- Parroquia + Municipio -->
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Parroquia <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="form.parroquia" name="parroquia" required placeholder="Ej: El Valle"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-sm"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Municipio <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="form.municipio" name="municipio" required placeholder="Ej: Libertador"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-sm"
                  />
                </div>

                <!-- Estado + Email -->
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Estado <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="form.estado" name="estado" required placeholder="Ej: Distrito Capital"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-sm"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Email institucional</label>
                  <input [(ngModel)]="form.email" name="email" type="email" placeholder="ejemplo@consejo.com"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-sm"
                  />
                </div>

                <!-- Activo -->
                <div class="sm:col-span-2 space-y-1.5">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Estado del consejo</label>
                  <div class="flex items-center gap-2 bg-white dark:bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 w-fit">
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" [(ngModel)]="form.activo" name="activo" class="sr-only peer" />
                      <div
                        class="relative w-9 h-5 rounded-full transition-all duration-300 shadow-inner cursor-pointer"
                        [style.background]="form.activo ? '#10b981' : '#cbd5e1'"
                      >
                        <div
                          class="absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300"
                          [style.transform]="form.activo ? 'translateX(16px)' : 'translateX(0)'"
                        ></div>
                      </div>
                    </label>
                    <span class="text-[10px] font-bold uppercase tracking-wider" [class.text-emerald-600]="form.activo" [class.text-slate-400]="!form.activo">{{ form.activo ? 'Activo' : 'Inactivo' }}</span>
                  </div>
                </div>

              </div>

              <!-- Actions -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <button type="button" (click)="closeModal()"
                  class="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" [disabled]="saving()"
                  class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed text-sm">
                  {{ saving() ? 'Guardando...' : 'Guardar Consejo' }}
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
              <h3 class="text-lg font-black text-white tracking-tight">Consejo Comunal</h3>
              <p class="text-xs text-white font-normal mt-0.5">Información registrada del consejo comunal.</p>
            </div>
            <button (click)="closeViewModal()" class="w-8 h-8 flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 max-h-[70vh] overflow-y-auto">
            @if (viewConsejo()) {
              <div class="space-y-6">

                <!-- Nombre -->
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Nombre del consejo</label>
                  <div class="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-800 dark:text-white">{{ viewConsejo()!.nombre }}</div>
                </div>

                <!-- RIF + Telefono -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">RIF</label>
                    <div class="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-800 dark:text-white">{{ viewConsejo()!.rif }}</div>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Teléfono</label>
                    <div class="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-800 dark:text-white">{{ viewConsejo()!.telefono || '—' }}</div>
                  </div>
                </div>

                <!-- Direccion -->
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Dirección detallada</label>
                  <div class="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-800 dark:text-white">{{ viewConsejo()!.direccion }}</div>
                </div>

                <!-- Parroquia + Municipio -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Parroquia</label>
                    <div class="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-800 dark:text-white">{{ viewConsejo()!.parroquia }}</div>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Municipio</label>
                    <div class="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-800 dark:text-white">{{ viewConsejo()!.municipio }}</div>
                  </div>
                </div>

                <!-- Estado geográfico + Email -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Estado</label>
                    <div class="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-800 dark:text-white">{{ viewConsejo()!.estado }}</div>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Email institucional</label>
                    <div class="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-800 dark:text-white">{{ viewConsejo()!.email || '—' }}</div>
                  </div>
                </div>

                <!-- Estado del consejo (toggle) -->
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Estado del consejo</label>
                  <div class="flex items-center gap-2 bg-white dark:bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 w-fit">
                    <div class="relative w-9 h-5 rounded-full transition-all duration-300 shadow-inner"
                         [style.background]="viewConsejo()!.activo ? '#10b981' : '#cbd5e1'">
                      <div class="absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300"
                           [style.transform]="viewConsejo()!.activo ? 'translateX(16px)' : 'translateX(0)'"></div>
                    </div>
                    <span class="text-[10px] font-bold uppercase tracking-wider"
                          [class.text-emerald-600]="viewConsejo()!.activo"
                          [class.text-slate-400]="!viewConsejo()!.activo">
                      {{ viewConsejo()!.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </div>
                </div>

              </div>
            }
          </div>

        </div>
      </div>
    }
  `,
  styles: []
})
export class ConsejoListComponent implements OnInit {
  readonly Eye = Eye;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly Plus = Plus;
  readonly Search = Search;
  readonly ChevronDown = ChevronDown;
  readonly CheckCircle2 = CheckCircle2;

  private svc    = inject(ConsejosService);
  private notify = inject(NotificationService);
  private el = inject(ElementRef);

  pageSize = 8;
  currentPage = 1;

  consejos = signal<ConsejoComunal[]>([]);
  loading  = signal(true);

  searchQuery = '';
  searchFilter = 'todo';
  showSearchFilterDropdown = false;
  searchFilterOptions = [
    { value: 'todo', label: 'TODO' },
    { value: 'nombre', label: 'NOMBRE' },
    { value: 'rif', label: 'RIF' },
    { value: 'parroquia', label: 'PARROQUIA' },
  ];

  get consejosFiltrados(): ConsejoComunal[] {
    return this.consejos().filter(c => {
      const q = (this.searchQuery || '').trim().toLowerCase();
      if (!q) return true;
      const matchNombre = (c.nombre || '').toLowerCase().includes(q);
      const matchRif = (c.rif || '').toLowerCase().includes(q);
      const matchParroquia = (c.parroquia || '').toLowerCase().includes(q);
      if (this.searchFilter === 'nombre') return matchNombre;
      if (this.searchFilter === 'rif') return matchRif;
      if (this.searchFilter === 'parroquia') return matchParroquia;
      return matchNombre || matchRif || matchParroquia;
    });
  }

  showModal  = signal(false);
  editingId  = signal<number | null>(null);
  saving     = signal(false);
  modalError = signal('');

  showViewModal = signal(false);
  viewConsejo   = signal<ConsejoComunal | null>(null);

  form: Partial<ConsejoComunal> = {
    nombre: '', rif: '', direccion: '', parroquia: '',
    municipio: '', estado: '', telefono: '', email: '', activo: true,
  };

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

  private load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (r) => { this.consejos.set(r.data); this.currentPage = 1; this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  openModal() {
    this.form = { nombre: '', rif: '', direccion: '', parroquia: '', municipio: '', estado: '', telefono: '', email: '', activo: true };
    this.editingId.set(null);
    this.modalError.set('');
    this.showModal.set(true);
  }

  openEdit(c: ConsejoComunal) {
    this.form = { ...c };
    this.editingId.set(c.id!);
    this.modalError.set('');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.saving.set(false);
    this.modalError.set('');
  }

  openView(c: ConsejoComunal) {
    this.viewConsejo.set(c);
    this.showViewModal.set(true);
  }

  closeViewModal() {
    this.showViewModal.set(false);
    this.viewConsejo.set(null);
  }

  save() {
    this.saving.set(true);
    this.modalError.set('');
    const id = this.editingId();
    const obs = id ? this.svc.update(id, this.form) : this.svc.create(this.form);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success(id ? 'Consejo actualizado' : 'Consejo creado', 'El consejo comunal se ha guardado correctamente.');
        this.closeModal();
        this.load();
      },
      error: (e) => {
        this.modalError.set(e?.error?.message ?? 'Error al guardar.');
        this.saving.set(false);
        this.notify.error('Error', e?.error?.message ?? 'Error al guardar el consejo.');
      },
    });
  }

  async deleteConsejo(c: ConsejoComunal) {
    const confirmed = await this.notify.confirm('¿Eliminar consejo?', `Se eliminará "${c.nombre}" y toda su información asociada.`);
    if (!confirmed) return;
    this.svc.delete(c.id!).subscribe({
      next: () => { this.notify.success('Consejo eliminado'); this.load(); },
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al eliminar.'),
    });
  }
}

