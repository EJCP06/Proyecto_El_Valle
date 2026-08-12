import { Component, inject, OnInit, signal, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../core/services/usuarios.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { CatalogoService, CatalogoItem } from '../../core/services/catalogo.service';
import { Usuario } from '../../core/models/usuario.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PaginatePipe } from '../../shared/pipes/paginate.pipe';
import { FillersPipe } from '../../shared/pipes/fillers.pipe';
import { LucideAngularModule, Eye, Edit2, Trash2, Plus, Search, ChevronDown, CheckCircle2, ClipboardList, Send, Link2 } from 'lucide-angular';
import { CustomSelectComponent } from '../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [FormsModule, PaginationComponent, PaginatePipe, FillersPipe, LucideAngularModule, CustomSelectComponent],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300 flex flex-col flex-1 min-h-0">
      
      <!-- Page Header -->
      <header>
        <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Usuarios</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 font-normal">Gestiona las cuentas de acceso y roles del personal del consejo.</p>
      </header>

      <!-- Content Container -->
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl">
          <div class="w-8 h-8 border-[3px] border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <span class="text-sm text-slate-500 dark:text-slate-400 mt-4 font-semibold animate-pulse">Cargando usuarios...</span>
        </div>
      } @else {
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm mt-3 flex flex-col flex-1 min-h-0">

          <!-- Toolbar: búsqueda + nuevo -->
          <div class="flex flex-col lg:flex-row lg:items-center gap-3 px-4 md:px-6 py-6 border-b border-slate-100 dark:border-slate-800">
            <div class="flex-1 relative search-filter-container">
              <div class="flex items-center w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl group focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all duration-300 overflow-hidden">
                <button type="button" (click)="toggleSearchFilterDropdown()" class="bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 px-4 self-stretch text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shrink-0">
                  <span>{{ getSearchFilterLabel() }}</span>
                  <lucide-icon [name]="ChevronDown" class="w-3.5 h-3.5 transition-transform duration-200" [class.rotate-180]="showSearchFilterDropdown"></lucide-icon>
                </button>
                <div class="relative flex-1">
                  <lucide-icon [name]="Search" class="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"></lucide-icon>
                  <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange($event)" placeholder="Buscar usuario..." class="w-full pl-[72px] pr-4 py-2.5 text-sm focus:outline-none font-normal bg-transparent rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" />
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
            <button 
              (click)="openModal()" 
              class="order-first lg:order-none inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 text-sm cursor-pointer shrink-0"
            >
              <span class="text-lg leading-none">+</span>
              <span>Nuevo usuario</span>
            </button>
          </div>
          <!--/ Toolbar -->

          <div class="relative flex-1 min-h-0 overflow-x-auto overflow-y-auto">
            <table class="w-full min-w-[800px] border-collapse h-full">
              <thead>
                <tr class="bg-slate-50/75 dark:bg-slate-800/40 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider" [class.border-b]="usuariosFiltrados.length > 0" [class.border-slate-200]="usuariosFiltrados.length > 0" [class.dark:border-slate-800]="usuariosFiltrados.length > 0">
                  <th class="px-6 py-4 text-center">Nombre</th>
                  <th class="px-4 py-4 text-center">Correo</th>
                  <th class="px-4 py-4 text-center">Rol</th>
                  <th class="px-4 py-4 text-center">Estado</th>
                  <th class="px-4 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="text-slate-750 dark:text-slate-300">
                @for (u of usuariosFiltrados | paginate:currentPage:pageSize; track u.id) {
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800/60">
                    <td class="px-6 py-4 text-center">
                      <span class="text-sm text-slate-500 dark:text-slate-400">{{ u.nombre }}</span>
                    </td>
                    <td class="px-4 py-4 text-center text-sm text-slate-500 dark:text-slate-400">{{ u.email }}</td>
                    <td class="px-4 py-4 text-center">
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {{ u.rol }}
                      </span>
                    </td>
                    <td class="px-4 py-4 text-center">
                      <span 
                        class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold"
                        [class]="u.activo ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'"
                      >
                        {{ u.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex justify-center gap-1">
                        <button (click)="openView(u)" aria-label="Ver usuario" class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 hover:shadow-[0_2px_10px_-3px_rgba(16,185,129,0.4)] dark:hover:bg-emerald-900/30 rounded-xl transition-all cursor-pointer">
                          <lucide-icon [name]="Eye" class="w-4 h-4"></lucide-icon>
                        </button>
                        <button (click)="openEdit(u)" aria-label="Editar usuario" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 hover:shadow-[0_2px_10px_-3px_rgba(59,130,246,0.4)] dark:hover:bg-blue-900/30 rounded-xl transition-all cursor-pointer">
                          <lucide-icon [name]="Edit2" class="w-4 h-4"></lucide-icon>
                        </button>
                        @if (!u.telegram_chat_id) {
                          <button (click)="openTelegramLink(u)" aria-label="Vincular Telegram" title="Vincular Telegram" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 hover:shadow-[0_2px_10px_-3px_rgba(59,130,246,0.4)] dark:hover:bg-blue-900/30 rounded-xl transition-all cursor-pointer">
                            <lucide-icon [name]="Send" class="w-4 h-4"></lucide-icon>
                          </button>
                        }
                        @if (u.activo) {
                          <button (click)="deactivate(u)" aria-label="Desactivar usuario" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 hover:shadow-[0_2px_10px_-3px_rgba(244,63,94,0.4)] dark:hover:bg-rose-900/30 rounded-xl transition-all cursor-pointer">
                            <lucide-icon [name]="Trash2" class="w-4 h-4"></lucide-icon>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {}
                @for (_ of usuariosFiltrados | fillers:currentPage:pageSize; track $index) {
                  <tr class="hover:bg-transparent">
                    <td colspan="5" class="px-6 py-4"></td>
                  </tr>
                }
              </tbody>
            </table>
            @if (usuariosFiltrados.length === 0) {
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                <lucide-icon [name]="ClipboardList" class="text-5xl text-slate-300 dark:text-slate-600"></lucide-icon>
                <span class="text-sm text-slate-400 dark:text-slate-500 font-normal">No se encontraron datos.</span>
              </div>
            }
          </div>
          <app-pagination [currentPage]="currentPage" [totalItems]="usuariosFiltrados.length" [pageSize]="pageSize" (pageChange)="currentPage = $event"></app-pagination>
        </div>
      }
    </div>

    <!-- Modal -->
    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" (click)="closeModal()">
        <div class="absolute inset-0 bg-black/50 "></div>
        <div class="relative z-10 w-full sm:max-w-3xl h-[95vh] sm:h-auto sm:max-h-[calc(100vh-2rem)] flex flex-col bg-white dark:bg-slate-900 sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between p-4 sm:p-6 bg-blue-600 dark:bg-blue-700 shrink-0">
            <div class="min-w-0">
              <h3 class="text-base sm:text-lg font-black text-white tracking-tight truncate">{{ editingId() ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
              <p class="text-[10px] sm:text-xs text-blue-100 font-normal mt-0.5 truncate">Completa la información para configurar la cuenta del usuario.</p>
            </div>
            <button (click)="closeModal()" class="w-8 h-8 flex items-center justify-center rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-4 sm:p-6 overflow-y-auto flex-1">
            @if (modalError()) {
              <div class="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl p-4 mb-6 text-sm font-normal">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{{ modalError() }}</span>
              </div>
            }

            <form (ngSubmit)="save()" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Nombre completo <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="form.nombre" name="nombre" required placeholder="Ej: Edward Pérez"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Email <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="form.email" name="email" type="email" required placeholder="correo@elvalle.com"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Contraseña @if (!editingId()) { <span class="text-red-500">*</span> }</label>
                  <input [(ngModel)]="password" name="password" type="password" [required]="!editingId()" [placeholder]="editingId() ? 'Dejar en blanco para no cambiar' : '••••••••'"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Rol del sistema <span class="text-red-500">*</span></label>
                  <app-custom-select [(ngModel)]="form.rol" name="rol" [options]="rolOptions"></app-custom-select>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Estado de la cuenta</label>
                  <div class="flex items-center gap-2 bg-white dark:bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 w-fit">
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" [(ngModel)]="form.activo" (ngModelChange)="onActivoChange($event)" name="activo" class="sr-only peer" />
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

              <div class="pt-2">
                <div class="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-4">
                  <div>
                    <h4 class="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Preguntas de Seguridad</h4>
                    <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Selecciona 3 preguntas del catálogo y define sus respuestas para la recuperación de contraseña.</p>
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                  @for (pq of preguntasForm; track $index; let i = $index) {
                    <div class="md:col-span-1 space-y-2">
                      <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Pregunta {{ i + 1 }} <span class="text-red-500">*</span></label>
                      <app-custom-select [(ngModel)]="preguntasForm[i].preguntaId" [name]="'pq' + i" [options]="preguntaOptions" placeholder="— Seleccionar —"></app-custom-select>
                    </div>
                    <div class="md:col-span-1 space-y-2">
                      <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Respuesta {{ i + 1 }} <span class="text-red-500">*</span></label>
                      <input [(ngModel)]="preguntasForm[i].respuesta" [name]="'pqr' + i" type="text" autocomplete="off" placeholder="Tu respuesta..."
                        class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-sm"/>
                    </div>
                  }
                </div>
              </div>

              <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <button type="button" (click)="closeModal()" class="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer">Cancelar</button>
                <button type="submit" [disabled]="saving()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed">
                  {{ saving() ? 'Guardando...' : 'Guardar Usuario' }}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    }

    <!-- View Modal -->
    @if (showViewModal()) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" (click)="closeViewModal()">
        <div class="absolute inset-0 bg-black/50 "></div>
        <div class="relative z-10 w-full sm:max-w-2xl h-[95vh] sm:h-auto sm:max-h-[calc(100vh-2rem)] flex flex-col bg-white dark:bg-slate-900 sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between p-4 sm:p-6 bg-emerald-600 dark:bg-emerald-700 shrink-0">
            <div class="min-w-0">
              <h3 class="text-base sm:text-lg font-black text-white tracking-tight truncate">Usuario</h3>
              <p class="text-[10px] sm:text-xs text-emerald-100 font-normal mt-0.5 truncate">Información registrada del usuario.</p>
            </div>
            <button (click)="closeViewModal()" class="w-8 h-8 flex items-center justify-center rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-4 sm:p-6 overflow-y-auto flex-1">
            @if (viewUsuario()) {
              <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div class="md:col-span-2 space-y-2">
                    <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Nombre completo</label>
                    <div class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-normal">{{ viewUsuario()!.nombre }}</div>
                  </div>
                  <div class="md:col-span-2 space-y-2">
                    <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Correo electrónico</label>
                    <div class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-normal">{{ viewUsuario()!.email }}</div>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Rol del sistema</label>
                    <div class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-normal capitalize">{{ viewUsuario()!.rol === 'admin' ? 'Administrador' : 'Vocero' }}</div>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Estado</label>
                    <div class="flex items-center justify-center">
                      <div class="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 w-fit">
                        <div class="relative w-9 h-5 rounded-full transition-all duration-300 shadow-inner"
                             [style.background]="viewUsuario()!.activo ? '#10b981' : '#cbd5e1'">
                          <div class="absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300"
                               [style.transform]="viewUsuario()!.activo ? 'translateX(16px)' : 'translateX(0)'"></div>
                        </div>
                        <span class="text-[10px] font-bold uppercase tracking-wider"
                              [class.text-emerald-600]="viewUsuario()!.activo"
                              [class.text-slate-400]="!viewUsuario()!.activo">
                          {{ viewUsuario()!.activo ? 'Activo' : 'Inactivo' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>

        </div>
      </div>
    }

    <!-- Telegram Link Modal -->
    @if (showTelegramLinkModal()) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" (click)="closeTelegramLinkModal()">
        <div class="absolute inset-0 bg-black/50 "></div>
        <div class="relative z-10 w-full max-w-md flex flex-col bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl overflow-hidden" (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between p-4 sm:p-6 bg-blue-600 dark:bg-blue-700 shrink-0">
            <div class="min-w-0">
              <h3 class="text-base sm:text-lg font-black text-white tracking-tight truncate">Vincular Telegram</h3>
              <p class="text-[10px] sm:text-xs text-blue-100 font-normal mt-0.5 truncate">
                {{ telegramLinkUsuario()?.nombre }} ({{ telegramLinkUsuario()?.email }})
              </p>
            </div>
            <button (click)="closeTelegramLinkModal()" class="w-8 h-8 flex items-center justify-center rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-4 sm:p-6">
            <div class="mb-6">
              <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4">
                <div>
                  <p class="text-sm font-bold text-slate-800 dark:text-white">¿Cómo vincular?</p>
                  <ol class="text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-4 list-none">
                    <li class="flex items-start gap-2.5">
                      <span class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-black shrink-0 mt-0.5">1</span>
                      <span>Abre Telegram y busca el bot <b>@ConsejoElValleBot</b></span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <span class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-black shrink-0 mt-0.5">2</span>
                      <span>Pulsa <b>Iniciar</b> en el bot y escribe tu correo: <code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">{{ telegramLinkUsuario()?.email }}</code></span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <span class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-black shrink-0 mt-0.5">3</span>
                      <span>El bot te responderá con un <b>código de 6 dígitos</b></span>
                    </li>
                    <li class="flex items-start gap-2.5">
                      <span class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-black shrink-0 mt-0.5">4</span>
                      <span>Ingresa ese código aquí y pulsa <b>Vincular</b></span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            @if (telegramLinkError()) {
              <div class="mb-4 flex items-center gap-2 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl p-3 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
                </svg>
                <span>{{ telegramLinkError() }}</span>
              </div>
            }

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Código de 6 dígitos</label>
              <input type="text" [(ngModel)]="telegramLinkCodigo" name="telegramLinkCodigo" (keypress)="soloNumeros($event)" maxlength="6" placeholder="000000" class="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-center text-2xl tracking-[8px]" />
            </div>
          </div>
          <div class="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <button (click)="closeTelegramLinkModal()" class="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer">Cancelar</button>
            <button (click)="vincularTelegram()" [disabled]="telegramLinkCargando()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer text-sm disabled:cursor-not-allowed">
              @if (!telegramLinkCargando()) {
                <span class="flex items-center gap-2">
                  <lucide-icon [name]="Link2" class="w-4 h-4"></lucide-icon>
                  Vincular
                </span>
              } @else {
                <div class="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-[800ms]">
                  <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span class="animate-pulse">Vinculando...</span>
                </div>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class UsuarioListComponent implements OnInit {
readonly Eye = Eye;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly Plus = Plus;
  readonly Search = Search;
  readonly ChevronDown = ChevronDown;
  readonly CheckCircle2 = CheckCircle2;
  readonly ClipboardList = ClipboardList;
  readonly Send = Send;
  readonly Link2 = Link2;

  private svc    = inject(UsuariosService);
  private notify = inject(NotificationService);
  private catSvc = inject(CatalogoService);
  private authSvc = inject(AuthService);
  private el = inject(ElementRef);

  pageSize = 8;
  currentPage = 1;

  usuarios = signal<Usuario[]>([]);
  loading  = signal(true);

  searchQuery = '';
  searchFilter = 'todo';
  showSearchFilterDropdown = false;
  searchFilterOptions = [
    { value: 'todo', label: 'TODO' },
    { value: 'nombre', label: 'NOMBRE' },
    { value: 'email', label: 'EMAIL' },
    { value: 'rol', label: 'ROL' },
  ];

  get usuariosFiltrados(): Usuario[] {
    return this.usuarios().filter(u => {
      const q = (this.searchQuery || '').trim().toLowerCase();
      if (!q) return true;
      const matchNombre = (u.nombre || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchRol = (u.rol || '').toLowerCase().includes(q);
      if (this.searchFilter === 'nombre') return matchNombre;
      if (this.searchFilter === 'email') return matchEmail;
      if (this.searchFilter === 'rol') return matchRol;
      return matchNombre || matchEmail || matchRol;
    });
  }

  showModal  = signal(false);
  editingId  = signal<number | null>(null);
  saving     = signal(false);
  modalError = signal('');
  password   = '';

  // View modal
  showViewModal = signal(false);
  viewUsuario   = signal<Usuario | null>(null);

  // Telegram link modal
  showTelegramLinkModal = signal(false);
  telegramLinkUsuario   = signal<Usuario | null>(null);
  telegramLinkCodigo    = '';
  telegramLinkCargando  = signal(false);
  telegramLinkError     = signal('');

  form: Partial<Usuario> = { nombre: '', email: '', rol: 'vocero' };

  preguntasCatalogo = signal<CatalogoItem[]>([]);

  rolOptions: { value: string; label: string }[] = [
    { value: 'vocero', label: 'Vocero' },
    { value: 'admin', label: 'Administrador' },
  ];

  get preguntaOptions(): { value: number; label: string }[] {
    return this.preguntasCatalogo().map((q) => ({ value: q.id, label: q.nombre }));
  }
  preguntasForm: { preguntaId: number | null; respuesta: string }[] = [
    { preguntaId: null, respuesta: '' },
    { preguntaId: null, respuesta: '' },
    { preguntaId: null, respuesta: '' },
  ];

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
    this.catSvc.getActive('preguntas-seguridad').subscribe((r) => this.preguntasCatalogo.set(r.data));
  }

  load() {
    this.svc.getAll().subscribe({
      next: (r) => { this.usuarios.set(r.data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  openModal() {
    this.form = { nombre: '', email: '', rol: 'vocero', activo: true };
    this.password = '';
    this.editingId.set(null);
    this.modalError.set('');
    this.resetPreguntasForm();
    this.showModal.set(true);
  }

  openEdit(u: Usuario) {
    this.form = { ...u };
    this.password = '';
    this.editingId.set(u.id!);
    this.modalError.set('');
    this.resetPreguntasForm();
    this.loadPreguntasUsuario(u.id!);
    this.showModal.set(true);
  }

  onActivoChange(checked: boolean) {
    const selfId = this.authSvc.currentUser()?.id;
    if (this.editingId() === selfId && !checked) {
      this.modalError.set('No puedes desactivar tu propia cuenta.');
      this.form.activo = true;
      return;
    }
    this.form.activo = checked;
    this.modalError.set('');
  }

  private resetPreguntasForm() {
    this.preguntasForm = [
      { preguntaId: null, respuesta: '' },
      { preguntaId: null, respuesta: '' },
      { preguntaId: null, respuesta: '' },
    ];
  }

  private loadPreguntasUsuario(usuarioId: number) {
    this.authSvc.getPreguntasByUsuario(usuarioId).subscribe({
      next: (r) => {
        const data: { pregunta_id: number | null }[] = r.data ?? [];
        this.preguntasForm = [0, 1, 2].map(i => ({
          preguntaId: data[i]?.pregunta_id ?? null,
          respuesta: '',
        }));
      },
      error: () => this.resetPreguntasForm(),
    });
  }

  private buildPreguntasPayload(): { preguntaId: number; respuesta: string }[] | null {
    const hasSelection = this.preguntasForm.some(p => p.preguntaId != null);
    const hasAnswer = this.preguntasForm.some(p => p.respuesta.trim() !== '');
    if (!hasSelection && !hasAnswer) return null;

    const complete = this.preguntasForm.every(p => p.preguntaId != null && p.respuesta.trim() !== '');
    if (!complete) {
      this.modalError.set('Debes seleccionar las 3 preguntas de seguridad y escribir sus respuestas.');
      return null;
    }
    return this.preguntasForm.map(p => ({ preguntaId: p.preguntaId!, respuesta: p.respuesta.trim() }));
  }

  closeModal() {
    this.showModal.set(false);
    this.saving.set(false);
    this.modalError.set('');
  }

  openView(u: Usuario) {
    this.viewUsuario.set(u);
    this.showViewModal.set(true);
  }

  closeViewModal() {
    this.showViewModal.set(false);
    this.viewUsuario.set(null);
  }

  openTelegramLink(u: Usuario) {
    this.telegramLinkUsuario.set(u);
    this.telegramLinkCodigo = '';
    this.telegramLinkError.set('');
    this.showTelegramLinkModal.set(true);
  }

  closeTelegramLinkModal() {
    this.showTelegramLinkModal.set(false);
    this.telegramLinkUsuario.set(null);
    this.telegramLinkCodigo = '';
    this.telegramLinkError.set('');
  }

  vincularTelegram() {
    const usuario = this.telegramLinkUsuario();
    if (!usuario || !this.telegramLinkCodigo.trim()) {
      this.telegramLinkError.set('Ingresa el código de 6 dígitos.');
      return;
    }
    this.telegramLinkCargando.set(true);
    this.svc.vincularTelegram(usuario.email, this.telegramLinkCodigo.trim()).subscribe({
      next: () => {
        this.telegramLinkCargando.set(false);
        this.notify.success('Telegram vinculado', `La cuenta de ${usuario.nombre} está vinculada a Telegram.`);
        this.closeTelegramLinkModal();
        this.load();
      },
      error: (e) => {
        this.telegramLinkCargando.set(false);
        this.telegramLinkError.set(e?.error?.message ?? 'Error al vincular Telegram.');
      },
    });
  }

  save() {
    this.modalError.set('');
    const id = this.editingId();
    const preguntas = this.buildPreguntasPayload();
    if (!preguntas && !id) {
      this.modalError.set('Debes asignar las 3 preguntas de seguridad al crear el usuario.');
      return;
    }
    if (!id) {
      if (!this.password) {
        this.modalError.set('La contraseña es requerida.');
        return;
      }
      const erroresPass = this.validarPassword(this.password);
      if (erroresPass.length > 0) {
        this.modalError.set(`La contraseña no cumple los requisitos: ${erroresPass.join(', ')}.`);
        return;
      }
    } else if (this.password) {
      const erroresPass = this.validarPassword(this.password);
      if (erroresPass.length > 0) {
        this.modalError.set(`La contraseña no cumple los requisitos: ${erroresPass.join(', ')}.`);
        return;
      }
    }

    this.saving.set(true);
    const basePayload: any = { ...this.form };
    if (this.password) basePayload.password = this.password;
    const payload: any = preguntas ? { ...basePayload, preguntasSeguridad: preguntas } : basePayload;
    const obs = id ? this.svc.update(id, payload) : this.svc.create(payload);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success(id ? 'Usuario actualizado' : 'Usuario creado', 'La cuenta de usuario se ha guardado correctamente.');
        this.closeModal();
        this.load();
      },
      error: (e) => { this.modalError.set(e?.error?.message ?? 'Error.'); this.saving.set(false); this.notify.error('Error', e?.error?.message ?? 'Error al guardar el usuario.'); },
    });
  }

async deactivate(u: Usuario) {
    const confirmed = await this.notify.confirm('¿Desactivar usuario?', `Se desactivará la cuenta de "${u.nombre}". Podrás activarla nuevamente después.`);
    if (!confirmed) return;
    this.svc.deactivate(u.id).subscribe({
      next: () => { this.notify.success('Usuario desactivado'); this.load(); },
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al desactivar.'),
    });
  }

  soloNumeros(event: KeyboardEvent) {
    if (!/^\d$/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete' && event.key !== 'Tab' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      event.preventDefault();
    }
  }

  private validarPassword(pw: string): string[] {
    const errors: string[] = [];
    if (pw.length < 8) errors.push('mínimo 8 caracteres');
    if (!/[A-Z]/.test(pw)) errors.push('una mayúscula');
    if (!/[a-z]/.test(pw)) errors.push('una minúscula');
    if (!/[0-9]/.test(pw)) errors.push('un número');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) errors.push('un símbolo');
    return errors;
  }

}

