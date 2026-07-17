import { Component, inject, OnInit, signal, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormulariosService } from '../../core/services/formularios.service';
import { FamiliasService } from '../../core/services/familias.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Formulario, Familia, CampoFormulario, TipoCampo } from '../../core/models/usuario.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PaginatePipe } from '../../shared/pipes/paginate.pipe';
import { LucideAngularModule, Search, ChevronDown, CheckCircle2, Eye, Edit2, Users, Trash2, ClipboardList } from 'lucide-angular';

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
          <p class="text-sm text-slate-500 dark:text-slate-400 font-normal">Gestiona formularios dinámicos para censos y encuestas comunales.</p>
        </div>
        @if (isAdmin()) {
          <button (click)="openBuilderModal()" class="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 text-sm cursor-pointer">
            <span class="text-lg leading-none">+</span>
            <span>Nuevo formulario</span>
          </button>
        }
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
                <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange($event)" placeholder="Buscar formulario..." class="w-full pl-[72px] pr-4 py-3 text-sm focus:outline-none font-normal bg-transparent rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" />
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm mt-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-5 pb-2">
              @for (f of formulariosFiltrados | paginate:currentPage:pageSize; track f.id) {
                <div class="flex flex-col gap-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                  
                  <!-- Header -->
                  <div class="flex items-center justify-between">
                    <div class="w-11 h-11 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      📋
                    </div>
                    @if (isAdmin()) {
                      <button (click)="toggleActivo(f)" class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all hover:scale-105"
                        [class]="f.activo ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'">
                        {{ f.activo ? 'Activo' : 'Inactivo' }}
                      </button>
                    } @else {
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold"
                        [class]="f.activo ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'">
                        {{ f.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    }
                  </div>

                  <!-- Content -->
                  <div class="flex-1 space-y-1">
                    <h3 class="text-sm text-slate-500 dark:text-slate-400 leading-snug">{{ f.titulo }}</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{{ f.descripcion || 'Sin descripción.' }}</p>
                  </div>

                  <!-- Meta + Actions -->
                  <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60">
                    <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {{ f.campos?.length ?? 0 }} campo(s)
                    </span>
                    <div class="flex items-center gap-1">
                      <button (click)="openView(f)" aria-label="Ver formulario" class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 hover:shadow-[0_2px_10px_-3px_rgba(16,185,129,0.4)] rounded-xl transition-all cursor-pointer">
                        <lucide-icon [name]="Eye" class="w-4 h-4"></lucide-icon>
                      </button>
                      @if (isAdmin()) {
                        <button (click)="openBuilderModal(f)" aria-label="Editar formulario" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 hover:shadow-[0_2px_10px_-3px_rgba(59,130,246,0.4)] rounded-xl transition-all cursor-pointer">
                          <lucide-icon [name]="Edit2" class="w-4 h-4"></lucide-icon>
                        </button>
                        <button (click)="openAsignarModal(f)" aria-label="Asignar formulario" class="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-100 hover:shadow-[0_2px_10px_-3px_rgba(245,158,11,0.4)] rounded-xl transition-all cursor-pointer">
                          <lucide-icon [name]="Users" class="w-4 h-4"></lucide-icon>
                        </button>
                        <button (click)="deleteFormulario(f)" aria-label="Eliminar formulario" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 hover:shadow-[0_2px_10px_-3px_rgba(244,63,94,0.4)] rounded-xl transition-all cursor-pointer">
                          <lucide-icon [name]="Trash2" class="w-4 h-4"></lucide-icon>
                        </button>
                      }
                    </div>
                  </div>
                </div>
} @empty {
                <div class="sm:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-16">
                  <lucide-icon [name]="ClipboardList" class="text-5xl text-slate-300 dark:text-slate-600 mb-4"></lucide-icon>
                  <p class="text-sm text-slate-400 dark:text-slate-500 font-normal">No hay formularios registrados aún.</p>
                  <button (click)="openBuilderModal()" class="mt-4 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Crear el primero</button>
                </div>
              }
            </div>
          <app-pagination [currentPage]="currentPage" [totalItems]="formulariosFiltrados.length" [pageSize]="pageSize" (pageChange)="currentPage = $event"></app-pagination>
        </div>
      }
    </div>

<!-- Builder Modal -->
    @if (showBuilderModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="closeBuilderModal()"></div>
        <div class="relative z-10 w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">

          <div class="flex items-center justify-between p-6 bg-blue-600">
            <div>
              <h3 class="text-lg font-black text-white tracking-tight">{{ builderEditingId() ? 'Editar formulario' : 'Nuevo formulario' }}</h3>
              <p class="text-xs text-blue-100 font-normal mt-0.5">Crea formularios dinámicos con campos personalizados.</p>
            </div>
            <button (click)="closeBuilderModal()" class="w-8 h-8 flex items-center justify-center rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 max-h-[70vh] overflow-y-auto">
            @if (builderError()) {
              <div class="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl p-4 mb-6 text-sm font-normal">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span>{{ builderError() }}</span>
              </div>
            }

            <div class="space-y-6">
              <!-- Meta -->
              <div class="space-y-4">
                <h4 class="text-sm font-black text-slate-700 dark:text-slate-200">Información general</h4>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Título <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="builderTitulo" name="bTitulo" required placeholder="Ej: Censo de salud 2026"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Descripción</label>
                  <textarea [(ngModel)]="builderDescripcion" name="bDescripcion" rows="2" placeholder="Breve descripción del formulario..."
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"></textarea>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Alcance</label>
                    <select [(ngModel)]="builderAlcance" name="bAlcance"
                      class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal">
                      <option value="familiar">Familiar</option>
                      <option value="individual">Individual</option>
                    </select>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Estado</label>
                    <div class="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 w-full">
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" [checked]="builderActivo()" (change)="builderActivo.set(!builderActivo())" name="bActivo" class="sr-only peer" />
                        <div class="relative w-9 h-5 rounded-full transition-all duration-300 shadow-inner cursor-pointer"
                             [style.background]="builderActivo() ? '#10b981' : '#cbd5e1'">
                          <div class="absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300"
                               [style.transform]="builderActivo() ? 'translateX(16px)' : 'translateX(0)'"></div>
                        </div>
                      </label>
                      <span class="text-[10px] font-bold uppercase tracking-wider" [class.text-emerald-600]="builderActivo()" [class.text-slate-400]="!builderActivo()">{{ builderActivo() ? 'Activo' : 'Inactivo' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Fields -->
              <div class="pt-6 border-t border-slate-100 dark:border-slate-800/60">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Campos
                    <span class="ml-2 inline-flex items-center justify-center w-6 h-6 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black rounded-full">
                      {{ builderCampos().length }}
                    </span>
                  </h4>
                  <button type="button" (click)="addCampo()" class="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer">
                    <span>+</span><span>Agregar</span>
                  </button>
                </div>
                <div class="space-y-3">
                  @for (campo of builderCampos(); track campo.id; let i = $index) {
                    <div class="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-black shrink-0 mt-1">{{ i + 1 }}</div>
                    <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div class="sm:col-span-3">
                        <input [(ngModel)]="campo.label" [name]="'label'+i" placeholder="Etiqueta del campo *"
                          class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"/>
                      </div>
                      <div>
                        <select [(ngModel)]="campo.tipo" [name]="'tipo'+i"
                          class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal">
                          @for (t of tipos; track t) {
                            <option [value]="t">{{ getTipoLabel(t) }}</option>
                          }
                        </select>
                      </div>
                      <div>
                        <label class="flex items-center gap-2 text-sm font-normal text-slate-600 dark:text-slate-400 cursor-pointer pt-2">
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
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <button type="button" (click)="closeBuilderModal()" class="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer">Cancelar</button>
                <button type="button" (click)="saveBuilder()" [disabled]="builderSaving()" class="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed text-sm whitespace-nowrap">
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
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="closeAsignarModal()"></div>
        <div class="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">

          <div class="flex items-center justify-between p-6 bg-blue-600 dark:bg-blue-700">
            <div>
              <h3 class="text-lg font-black text-white tracking-tight">Asignar formulario</h3>
              <p class="text-xs text-blue-100 font-normal mt-0.5">{{ asignarFormulario()?.titulo }}</p>
            </div>
            <button (click)="closeAsignarModal()" class="w-8 h-8 flex items-center justify-center rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 max-h-[70vh] overflow-y-auto">
            @if (asignarError()) {
              <div class="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl p-4 mb-6 text-sm font-normal">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span>{{ asignarError() }}</span>
              </div>
            }

            <p class="text-sm font-normal text-slate-600 dark:text-slate-400 mb-4">Selecciona las familias destino:</p>

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

    <!-- View Modal -->
    @if (showViewModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="closeViewModal()"></div>
        <div class="relative z-10 w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">

          <div class="flex items-center justify-between p-6 bg-emerald-600">
            <div>
              <h3 class="text-lg font-black text-white tracking-tight">Formulario</h3>
              <p class="text-xs text-emerald-100 font-normal mt-0.5">Información registrada del formulario.</p>
            </div>
            <button (click)="closeViewModal()" class="w-8 h-8 flex items-center justify-center rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 max-h-[70vh] overflow-y-auto">
            @if (viewFormulario()) {
              <div class="space-y-6">

                <!-- Título -->
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Título</label>
                  <div class="px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800">{{ viewFormulario()!.titulo }}</div>
                </div>

                <!-- Descripción -->
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Descripción</label>
                  <div class="px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800">{{ viewFormulario()!.descripcion || 'Sin descripción.' }}</div>
                </div>

                <!-- Alcance + Estado -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Alcance</label>
                    <div class="px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800">{{ viewFormulario()!.alcance === 'individual' ? 'Individual' : 'Familiar' }}</div>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Estado del formulario</label>
                    <div class="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 w-fit">
                      <div class="relative w-9 h-5 rounded-full transition-all duration-300 shadow-inner"
                           [style.background]="viewFormulario()!.activo ? '#10b981' : '#cbd5e1'">
                        <div class="absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300"
                             [style.transform]="viewFormulario()!.activo ? 'translateX(16px)' : 'translateX(0)'"></div>
                      </div>
                      <span class="text-[10px] font-bold uppercase tracking-wider"
                            [class.text-emerald-600]="viewFormulario()!.activo"
                            [class.text-slate-400]="!viewFormulario()!.activo">
                        {{ viewFormulario()!.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Campos -->
                <div class="space-y-3">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Campos ({{ viewFormulario()!.campos?.length ?? 0 }})</label>
                  @if (viewFormulario()!.campos && viewFormulario()!.campos!.length > 0) {
                    @for (campo of viewFormulario()!.campos!; track campo.id; let i = $index) {
                      <div class="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div class="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{{ i + 1 }}</div>
                        <div class="flex-1 space-y-1">
                          <div class="flex items-center gap-2">
                            <span class="text-sm font-bold text-slate-800">{{ campo.label }}</span>
                            @if (campo.requerido) {
                              <span class="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Requerido</span>
                            }
                          </div>
                          <div class="text-xs text-slate-500">Tipo: <span class="font-semibold">{{ getTipoLabel(campo.tipo) }}</span></div>
                          @if (campo.opciones && campo.opciones.length > 0) {
                            <div class="text-xs text-slate-500">Opciones: <span class="font-semibold">{{ campo.opciones.join(', ') }}</span></div>
                          }
                        </div>
                      </div>
                    }
                  } @else {
                    <p class="text-sm text-slate-400 text-center py-4">Este formulario no tiene campos.</p>
                  }
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
export class FormularioListComponent implements OnInit {
  readonly Search = Search;
  readonly ChevronDown = ChevronDown;
readonly CheckCircle2 = CheckCircle2;
  readonly Eye = Eye;
  readonly Edit2 = Edit2;
  readonly Users = Users;
  readonly Trash2 = Trash2;
  readonly ClipboardList = ClipboardList;

  private svc     = inject(FormulariosService);
  private famSvc  = inject(FamiliasService);
  private auth    = inject(AuthService);
  private notify  = inject(NotificationService);
  private el = inject(ElementRef);

  readonly isAdmin = this.auth.isAdmin;

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

  tipos: TipoCampo[] = ['text', 'textarea', 'number', 'date', 'time', 'select', 'radio', 'checkbox', 'file', 'yes_no'];

  getTipoLabel(t: TipoCampo): string {
    const labels: Record<TipoCampo, string> = {
      text: 'text', textarea: 'textarea', number: 'number', date: 'date', time: 'time',
      select: 'select', radio: 'radio', checkbox: 'checkbox', file: 'file', yes_no: 'Sí/No'
    };
    return labels[t] ?? t;
  }

  // Builder modal
  showBuilderModal  = signal(false);
  builderEditingId  = signal<number | null>(null);
  builderSaving     = signal(false);
  builderError      = signal('');
  builderTitulo      = '';
  builderDescripcion = '';
  builderAlcance: 'familiar' | 'individual' = 'familiar';
  builderCampos      = signal<CampoFormulario[]>([]);
  builderActivo      = signal(true);

  // Asignar modal
  showAsignarModal  = signal(false);
  asignarFormulario = signal<Formulario | null>(null);
  asignarFamilias   = signal<Familia[]>([]);
  asignarSelected   = signal<Set<number>>(new Set());
  asignarSaving     = signal(false);
  asignarError      = signal('');

  // View modal
  showViewModal  = signal(false);
  viewFormulario = signal<Formulario | null>(null);

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
      this.builderAlcance = f.alcance ?? 'familiar';
      this.builderCampos.set(f.campos ?? []);
      this.builderActivo.set(f.activo ?? true);
    } else {
      this.builderEditingId.set(null);
      this.builderTitulo = '';
      this.builderDescripcion = '';
      this.builderAlcance = 'familiar';
      this.builderCampos.set([]);
      this.builderActivo.set(true);
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
      alcance: this.builderAlcance,
      campos: this.builderCampos().map((c, i) => ({ ...c, orden: i })),
      activo: this.builderActivo(),
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

  toggleActivo(f: Formulario) {
    this.svc.update(f.id!, { activo: !f.activo } as Partial<Formulario>).subscribe({
      next: () => {
        this.notify.success(f.activo ? 'Formulario despublicado' : 'Formulario publicado', 'El estado se ha actualizado.');
        this.load();
      },
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al cambiar estado.'),
    });
  }

  // View methods
  openView(f: Formulario) {
    this.viewFormulario.set(f);
    this.showViewModal.set(true);
  }

  closeViewModal() {
    this.showViewModal.set(false);
    this.viewFormulario.set(null);
  }

  // Delete
  async deleteFormulario(f: Formulario) {
    const confirmed = await this.notify.confirm('¿Eliminar formulario?', `Se eliminará "${f.titulo}" y no se podrá deshacer.`);
    if (!confirmed) return;
    this.svc.delete(f.id!).subscribe({
      next: () => {
        this.notify.success('Formulario eliminado', 'El formulario se ha eliminado correctamente.');
        this.load();
      },
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al eliminar.'),
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

