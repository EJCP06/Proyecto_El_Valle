import { Component, inject, OnInit, signal, ElementRef, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FamiliasService } from '../../core/services/familias.service';
import { MiembrosService } from '../../core/services/miembros.service';
import { CatalogoService, CatalogoItem } from '../../core/services/catalogo.service';
import { FormulariosService } from '../../core/services/formularios.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Familia, Miembro, FormularioAsignacionFamilia } from '../../core/models/usuario.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PaginatePipe } from '../../shared/pipes/paginate.pipe';
import { FillersPipe } from '../../shared/pipes/fillers.pipe';
import { LucideAngularModule, Edit2, Trash2, Search, ChevronDown, CheckCircle2 } from 'lucide-angular';

@Component({
  selector: 'app-familia-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, PaginationComponent, PaginatePipe, FillersPipe, LucideAngularModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl">
          <div class="w-8 h-8 border-[3px] border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <span class="text-sm text-slate-500 dark:text-slate-400 mt-4 font-semibold animate-pulse">Cargando información...</span>
        </div>
      } @else if (familia()) {

        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{{ familia()!.nombre }}</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 font-normal mt-1">{{ familia()!.direccion }}</p>
          </div>
          <div class="flex items-center gap-3">
            <button (click)="openEditFamilia()" class="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-sm transition-all cursor-pointer">
              Editar
            </button>
            <button (click)="openMiembroModal()" class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-blue-600/10 hover:-translate-y-0.5 transition-all text-sm cursor-pointer">
              <span>+</span><span>Miembro</span>
            </button>
          </div>
        </div>

        <!-- Members Table -->
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/60">
            <h3 class="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Miembros
              <span class="ml-2 inline-flex items-center justify-center w-6 h-6 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black rounded-full">
                {{ familia()!.miembros?.length ?? 0 }}
              </span>
            </h3>
          </div>
          <!-- Search/Filter Bar -->
          <div class="flex justify-center mb-6 md:mb-10 mt-4">
            <div class="relative w-full max-w-lg">
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
                  <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange($event)" placeholder="Buscar miembro..." class="w-full pl-[72px] pr-4 py-3 text-sm focus:outline-none font-normal bg-transparent rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                </div>
              </div>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full table-fixed border-collapse">
              <thead>
                <tr class="bg-slate-50/75 dark:bg-slate-800/40 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th class="w-[35%] px-6 py-4 text-center">Nombre</th>
                  <th class="w-[25%] px-4 py-4 text-center">Cédula</th>
                  <th class="w-[22%] px-4 py-4 text-center">Rol</th>
                  <th class="w-[18%] px-4 py-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                @for (m of miembrosFiltrados | paginate:currentPage:pageSize; track m.id) {
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td class="px-6 py-4 text-center text-sm text-slate-500 dark:text-slate-400 truncate">{{ m.nombre }} {{ m.apellido }}</td>
                    <td class="px-4 py-4 text-center text-sm text-slate-500 dark:text-slate-400">{{ m.cedula }}</td>
                    <td class="px-4 py-4 text-center">
                      @if (m.jefeFamilia) {
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">
                          Jefe de familia
                        </span>
                      }
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex justify-center gap-1">
                        <button (click)="openMiembroModal(m)" aria-label="Editar miembro" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 hover:shadow-[0_2px_10px_-3px_rgba(59,130,246,0.4)] dark:hover:bg-blue-900/30 rounded-xl transition-all cursor-pointer">
                          <lucide-icon [name]="Edit2" class="w-4 h-4"></lucide-icon>
                        </button>
                        <button (click)="deleteMiembro(m)" aria-label="Eliminar miembro" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 hover:shadow-[0_2px_10px_-3px_rgba(244,63,94,0.4)] dark:hover:bg-rose-900/30 rounded-xl transition-all cursor-pointer">
                          <lucide-icon [name]="Trash2" class="w-4 h-4"></lucide-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500 font-normal">
                      Sin miembros registrados en esta familia.
                    </td>
                  </tr>
                }
                @for (_ of miembrosFiltrados | fillers:currentPage:pageSize; track $index) {
                  <tr><td colspan="4" class="px-6 py-4">&nbsp;</td></tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination [currentPage]="currentPage" [totalItems]="miembrosFiltrados.length" [pageSize]="pageSize" (pageChange)="currentPage = $event"></app-pagination>
        </div>

        <!-- Formularios Asignados -->
        @if (formulariosAsignados().length > 0) {
          <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/60">
              <h3 class="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Formularios Asignados
                <span class="ml-2 inline-flex items-center justify-center w-6 h-6 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black rounded-full">
                  {{ formulariosAsignados().length }}
                </span>
              </h3>
            </div>
            <div class="p-6 space-y-4">
              @for (fa of formulariosAsignados(); track fa.formulario.id) {
                <div class="border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <div>
                      <h4 class="text-sm font-bold text-slate-800 dark:text-white">{{ fa.formulario.titulo }}</h4>
                      <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {{ fa.formulario.alcance === 'individual' ? 'Individual' : 'Familiar' }}
                      </p>
                    </div>
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold"
                      [class]="fa.respondidos === fa.totalMiembros && fa.totalMiembros > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'">
                      {{ fa.respondidos }}/{{ fa.totalMiembros }} respondidos
                    </span>
                  </div>
                  <div class="flex items-center gap-3 mt-3">
                    <button (click)="responderFormulario(fa)" class="text-xs font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-all cursor-pointer">
                      Responder
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <a routerLink="/app/familias" class="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
          ← Volver a familias
        </a>
      }
    </div>

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

          <div class="p-6 max-h-[70vh] overflow-y-auto">
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
                <div class="sm:col-span-2 flex items-center gap-3 pt-2">
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input [(ngModel)]="miembroForm.jefeFamilia" name="mJefeFamilia" type="checkbox"
                      class="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-700 text-blue-600 cursor-pointer"/>
                    <span class="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Es jefe/a de familia</span>
                  </label>
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

    <!-- Familia Edit Modal -->
    @if (showFamiliaModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="closeFamiliaModal()">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between p-6 bg-blue-600 dark:bg-blue-700">
            <div>
              <h3 class="text-lg font-black text-white tracking-tight">Editar Familia</h3>
              <p class="text-xs text-blue-100 font-normal mt-0.5">Modifica la información del núcleo familiar.</p>
            </div>
            <button (click)="closeFamiliaModal()" class="w-8 h-8 flex items-center justify-center rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 max-h-[70vh] overflow-y-auto">
            @if (familiaError()) {
              <div class="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl p-4 mb-6 text-sm font-normal">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span>{{ familiaError() }}</span>
              </div>
            }
            <form (ngSubmit)="saveFamilia()" class="space-y-6">
              <div class="grid grid-cols-1 gap-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Nombre de la familia <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="familiaForm.nombre" name="fNombre" required placeholder="Ej: Familia García Pérez"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Dirección <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="familiaForm.direccion" name="fDireccion" required placeholder="Ej: Calle El Carmen, casa 4-B"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"/>
                </div>
              </div>
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <button type="button" (click)="closeFamiliaModal()" class="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer">Cancelar</button>
                <button type="submit" [disabled]="familiaSaving()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed text-sm">
                  {{ familiaSaving() ? 'Guardando...' : 'Guardar Familia' }}
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
export class FamiliaDetailComponent implements OnInit {
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly Search = Search;
  readonly ChevronDown = ChevronDown;
  readonly CheckCircle2 = CheckCircle2;

  private svc     = inject(FamiliasService);
  private miembSvc = inject(MiembrosService);
  private catSvc  = inject(CatalogoService);
  private formSvc = inject(FormulariosService);
  private auth    = inject(AuthService);
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private notify  = inject(NotificationService);
  private el = inject(ElementRef);

  readonly isAdmin = this.auth.isAdmin;

  pageSize = 6;
  currentPage = 1;

  familia = signal<Familia | null>(null);
  loading = signal(true);
  familiaId = 0;

  parentescos       = signal<CatalogoItem[]>([]);
  estadosCiviles    = signal<CatalogoItem[]>([]);
  nivelesEducativos = signal<CatalogoItem[]>([]);
  ocupaciones       = signal<CatalogoItem[]>([]);

  searchQuery = '';
  searchFilter = 'todo';
  showSearchFilterDropdown = false;
  searchFilterOptions = [
    { value: 'todo', label: 'TODO' },
    { value: 'nombre', label: 'NOMBRE' },
    { value: 'cedula', label: 'CÉDULA' },
  ];

  get miembrosFiltrados(): Miembro[] {
    return (this.familia()?.miembros ?? []).filter(m => {
      const q = (this.searchQuery || '').trim().toLowerCase();
      if (!q) return true;
      const matchNombre = (m.nombre + ' ' + (m.apellido || '')).toLowerCase().includes(q);
      const matchCedula = (m.cedula || '').toLowerCase().includes(q);
      if (this.searchFilter === 'nombre') return matchNombre;
      if (this.searchFilter === 'cedula') return matchCedula;
      return matchNombre || matchCedula;
    });
  }

  // Miembro modal
  showMiembroModal  = signal(false);
  miembroEditingId  = signal<number | null>(null);
  miembroSaving     = signal(false);
  miembroError      = signal('');
  miembroForm: Partial<Miembro> = { nombre: '', apellido: '', cedula: '', jefeFamilia: false };

  // Familia edit modal
  showFamiliaModal = signal(false);
  familiaSaving    = signal(false);
  familiaError     = signal('');
  familiaForm: Partial<Familia> = { nombre: '', direccion: '' };

  // Formularios asignados
  formulariosAsignados = signal<FormularioAsignacionFamilia[]>([]);

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
    const id = this.route.snapshot.paramMap.get('id')!;
    this.familiaId = +id;

    this.catSvc.getActive('parentescos').subscribe((r) => this.parentescos.set(r.data));
    this.catSvc.getActive('estados-civiles').subscribe((r) => this.estadosCiviles.set(r.data));
    this.catSvc.getActive('niveles-educativos').subscribe((r) => this.nivelesEducativos.set(r.data));
    this.catSvc.getActive('ocupaciones').subscribe((r) => this.ocupaciones.set(r.data));

    this.loadFamilia();
    this.loadFormularios();
  }

  private loadFamilia() {
    this.svc.getById(this.familiaId).subscribe({
      next: (r) => { this.familia.set(r.data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  private loadFormularios() {
    this.formSvc.getByFamilia(this.familiaId).subscribe({
      next: (r) => this.formulariosAsignados.set(r.data),
      error: () => {},
    });
  }

  openEditFamilia() {
    const f = this.familia();
    if (!f) return;
    this.familiaForm = { nombre: f.nombre, direccion: f.direccion, consejoId: f.consejoId };
    this.familiaError.set('');
    this.showFamiliaModal.set(true);
  }

  closeFamiliaModal() {
    this.showFamiliaModal.set(false);
    this.familiaSaving.set(false);
    this.familiaError.set('');
  }

  saveFamilia() {
    this.familiaSaving.set(true);
    this.familiaError.set('');
    this.svc.update(this.familiaId, this.familiaForm).subscribe({
      next: () => {
        this.familiaSaving.set(false);
        this.notify.success('Familia actualizada', 'La familia se ha guardado correctamente.');
        this.closeFamiliaModal();
        this.loadFamilia();
      },
      error: (e) => { this.familiaError.set(e?.error?.message ?? 'Error.'); this.familiaSaving.set(false); this.notify.error('Error', e?.error?.message ?? 'Error al guardar la familia.'); },
    });
  }

  openMiembroModal(m?: Miembro) {
    if (m) {
      this.miembroForm = { ...m };
      this.miembroEditingId.set(m.id!);
    } else {
      this.miembroForm = { nombre: '', apellido: '', cedula: '', jefeFamilia: false, familiaId: this.familiaId };
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
    const id = this.miembroEditingId();
    const obs = id ? this.miembSvc.update(id, this.miembroForm) : this.miembSvc.create(this.miembroForm);
    obs.subscribe({
      next: () => {
        this.miembroSaving.set(false);
        this.notify.success(id ? 'Miembro actualizado' : 'Miembro creado', 'Los datos del miembro se han guardado.');
        this.closeMiembroModal();
        this.loadFamilia();
      },
      error: (e) => { this.miembroError.set(e?.error?.message ?? 'Error.'); this.miembroSaving.set(false); this.notify.error('Error', e?.error?.message ?? 'Error al guardar el miembro.'); },
    });
  }

  async deleteMiembro(m: Miembro) {
    const confirmed = await this.notify.confirm('¿Eliminar miembro?', `Se eliminará a "${m.nombre} ${m.apellido}" del núcleo familiar.`);
    if (!confirmed) return;
    this.miembSvc.delete(m.id!).subscribe({
      next: () => { this.notify.success('Miembro eliminado'); this.loadFamilia(); },
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al eliminar.'),
    });
  }

  responderFormulario(fa: FormularioAsignacionFamilia) {
    if (fa.asignaciones.length > 0) {
      const a = fa.asignaciones[0];
      this.router.navigate(['/app/formularios', a.id, 'responder'], { queryParams: { familia: this.familiaId } });
    }
  }
}

