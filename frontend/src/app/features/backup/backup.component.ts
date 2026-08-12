import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { LucideAngularModule, Database, HardDrive, Download, Trash2, RefreshCw, Upload, Wrench, CheckCircle2, XCircle, AlertTriangle, Save, Archive } from 'lucide-angular';
import { BackupService, BackupItem, BackupStats, BackupVerificacion } from '../../core/services/backup.service';
import { NotificationService } from '../../core/services/notification.service';
import { CustomSelectComponent } from '../../shared/components/custom-select/custom-select.component';

type TabId = 'respaldo' | 'restaurar' | 'utilidades';

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, LucideAngularModule, CustomSelectComponent],
  template: `
    <div class="animate-in fade-in duration-300 flex flex-col flex-1 min-h-0">
      <!-- Header -->
      <header class="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Backup y Restauración</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 font-normal">Respaldo, restauración y utilidades de la base de datos.</p>
        </div>
        <button (click)="refresh()"
          class="inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all text-sm cursor-pointer shrink-0">
          <lucide-icon [name]="RefreshCw" class="w-4 h-4"></lucide-icon>
        </button>
      </header>

      <!-- Tabs -->
      <div class="flex gap-1 mb-5 border-b border-slate-200 dark:border-slate-800">
        @for (tab of tabs; track tab.id) {
          <button
            (click)="tabActiva.set(tab.id)"
            class="inline-flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-t-xl transition-all cursor-pointer border-b-2 -mb-px"
            [class.text-blue-600]="tabActiva() === tab.id"
            [class.border-blue-600]="tabActiva() === tab.id"
            [class.text-slate-500]="tabActiva() !== tab.id"
            [class.border-transparent]="tabActiva() !== tab.id"
            [class.hover:text-slate-700]="tabActiva() !== tab.id"
          >
            <lucide-icon [name]="tab.icon" class="w-4 h-4"></lucide-icon>
            {{ tab.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-20">
          <div class="w-8 h-8 border-[3px] border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      } @else {
        <!-- TAB: RESPALDO -->
        @if (tabActiva() === 'respaldo') {
          <div class="space-y-5">
            <!-- Stats -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm p-5">
                <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total respaldos</p>
                <p class="text-3xl font-black text-slate-800 dark:text-white mt-1">{{ stats()?.total ?? 0 }}</p>
              </div>
              <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm p-5">
                <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tamaño total</p>
                <p class="text-3xl font-black text-slate-800 dark:text-white mt-1">{{ stats()?.['tamaño_total_formateado'] ?? '0 B' }}</p>
              </div>
              <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm p-5">
                <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Respaldos hoy</p>
                <p class="text-3xl font-black text-slate-800 dark:text-white mt-1">{{ stats()?.total_hoy ?? 0 }}</p>
              </div>
              <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm p-5">
                <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Último respaldo</p>
                <p class="text-sm font-black text-slate-800 dark:text-white mt-2 leading-snug break-all">
                  {{ stats()?.ultimo_backup?.archivo ?? '—' }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <!-- Crear respaldo -->
              <div class="lg:col-span-1 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm p-5">
                <div class="flex items-center gap-2 mb-4">
                  <lucide-icon [name]="Database" class="w-5 h-5 text-blue-600 dark:text-blue-400"></lucide-icon>
                  <h3 class="font-black text-slate-800 dark:text-white">Crear respaldo</h3>
                </div>
                <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Tipo de respaldo</label>
                <app-custom-select [(ngModel)]="tipoRespaldo" [options]="tipoRespaldoOptions" placeholder="SELECCIONAR TIPO"></app-custom-select>

                @if (tipoRespaldo === 'tablas') {
                  <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 mt-4">Tablas (separadas por coma)</label>
                  <input [(ngModel)]="tablasRespaldo"
                    placeholder="usuarios, familias, miembros"
                    class="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono" />
                }

                <button (click)="crearRespaldo()" [disabled]="creando()"
                  class="mt-4 w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 text-sm cursor-pointer">
                  @if (creando()) {
                    <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    Creando...
                  } @else {
                    <lucide-icon [name]="Save" class="w-4 h-4"></lucide-icon>
                    Crear respaldo
                  }
                </button>
              </div>

              <!-- Lista de respaldos -->
              <div class="lg:col-span-2 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden">
                <div class="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <lucide-icon [name]="Archive" class="w-5 h-5 text-slate-500 dark:text-slate-400"></lucide-icon>
                    <h3 class="font-black text-slate-800 dark:text-white">Respaldos guardados</h3>
                  </div>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full min-w-[640px] border-collapse">
                    <thead>
                      <tr class="bg-slate-50/75 dark:bg-slate-800/40 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <th class="px-5 py-3 text-left">Archivo</th>
                        <th class="px-5 py-3 text-left">Formato</th>
                        <th class="px-5 py-3 text-left">Tamaño</th>
                        <th class="px-5 py-3 text-left">Fecha</th>
                        <th class="px-5 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of backups(); track item.archivo) {
                        <tr class="border-t border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                          <td class="px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 break-all max-w-[200px]">{{ item.archivo }}</td>
                          <td class="px-5 py-3">
                            <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
                              [ngClass]="item.formato === 'custom' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : (item.formato === 'sql' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : '')">
                              {{ item.formato }}
                            </span>
                          </td>
                          <td class="px-5 py-3 text-sm text-slate-500 dark:text-slate-400">{{ item['tamaño_formateado'] }}</td>
                          <td class="px-5 py-3 text-sm text-slate-500 dark:text-slate-400">{{ item.creado_en | date: 'dd/MM/yyyy HH:mm' }}</td>
                          <td class="px-5 py-3">
                            <div class="flex items-center justify-end gap-1">
                              <button (click)="descargar(item)"
                                title="Descargar"
                                class="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer">
                                <lucide-icon [name]="Download" class="w-4 h-4"></lucide-icon>
                              </button>
                              <button (click)="verificar(item)"
                                title="Verificar integridad"
                                class="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer">
                                <lucide-icon [name]="CheckCircle2" class="w-4 h-4"></lucide-icon>
                              </button>
                              <button (click)="eliminar(item)"
                                title="Eliminar"
                                class="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer">
                                <lucide-icon [name]="Trash2" class="w-4 h-4"></lucide-icon>
                              </button>
                            </div>
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="5" class="px-5 py-10 text-center text-sm text-slate-400">No hay respaldos guardados. Crea uno con el botón "Crear respaldo".</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- TAB: RESTAURAR -->
        @if (tabActiva() === 'restaurar') {
          <div class="space-y-5 max-w-4xl">
            <div class="flex items-start gap-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4">
              <lucide-icon [name]="AlertTriangle" class="w-5 h-5 text-rose-500 shrink-0 mt-0.5"></lucide-icon>
              <div>
                <p class="text-sm font-black text-rose-700 dark:text-rose-400">Operación destructiva</p>
                <p class="text-xs text-rose-600/80 dark:text-rose-400/70 mt-0.5">
                  Restaurar sobrescribirá la base de datos actual. Se pedirá confirmación antes de ejecutar.
                  Las opciones "limpiar" y "recrear" solo aplican a archivos .dump.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <!-- Desde respaldo existente -->
              <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm p-5">
                <div class="flex items-center gap-2 mb-4">
                  <lucide-icon [name]="HardDrive" class="w-5 h-5 text-blue-600 dark:text-blue-400"></lucide-icon>
                  <h3 class="font-black text-slate-800 dark:text-white">Desde un respaldo guardado</h3>
                </div>
                <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Respaldos disponibles</label>
                <app-custom-select [(ngModel)]="archivoRestaurar" [options]="archivosOptions" placeholder="SELECCIONAR RESPALDO"></app-custom-select>
                <div class="mt-4 space-y-2.5">
                  <label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="limpiarBd" class="w-4 h-4 accent-blue-600">
                    Limpiar BD antes de restaurar (--clean)
                  </label>
                  <label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="recrearBd" class="w-4 h-4 accent-blue-600">
                    Eliminar y recrear la BD (--create)
                  </label>
                  <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Tablas específicas (.dump)</label>
                  <input [(ngModel)]="tablasRestore"
                    placeholder="usuarios, familias (vacío = todo)"
                    class="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono" />
                </div>
                <button (click)="restaurarExistente()" [disabled]="restaurando()"
                  class="mt-4 w-full inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-rose-600/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 text-sm cursor-pointer">
                  @if (restaurando()) {
                    <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    Restaurando...
                  } @else {
                    <lucide-icon [name]="Upload" class="w-4 h-4"></lucide-icon>
                    Restaurar
                  }
                </button>
              </div>

              <!-- Subir archivo -->
              <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm p-5">
                <div class="flex items-center gap-2 mb-4">
                  <lucide-icon [name]="Upload" class="w-5 h-5 text-blue-600 dark:text-blue-400"></lucide-icon>
                  <h3 class="font-black text-slate-800 dark:text-white">Subir archivo y restaurar</h3>
                </div>
                <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Archivo (.dump o .sql)</label>
                <input type="file" accept=".dump,.sql" (change)="onFileChange($event)"
                  class="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-3 file:px-4 file:py-2.5 file:rounded-xl file:border-0 file:bg-blue-50 dark:file:bg-blue-500/10 file:text-blue-600 dark:file:text-blue-400 file:font-bold file:text-sm file:cursor-pointer cursor-pointer" />
                @if (archivoSubido()) {
                  <p class="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400 break-all">Seleccionado: {{ archivoSubido()!.name }}</p>
                }
                <div class="mt-4 space-y-2.5">
                  <label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="limpiarBd" class="w-4 h-4 accent-blue-600">
                    Limpiar BD antes de restaurar (--clean)
                  </label>
                  <label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="recrearBd" class="w-4 h-4 accent-blue-600">
                    Eliminar y recrear la BD (--create)
                  </label>
                  <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Tablas específicas (.dump)</label>
                  <input [(ngModel)]="tablasRestore"
                    placeholder="usuarios, familias (vacío = todo)"
                    class="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono" />
                </div>
                <button (click)="restaurarSubido()" [disabled]="restaurando() || !archivoSubido()"
                  class="mt-4 w-full inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-rose-600/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 text-sm cursor-pointer">
                  @if (restaurando()) {
                    <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    Restaurando...
                  } @else {
                    <lucide-icon [name]="Upload" class="w-4 h-4"></lucide-icon>
                    Subir y restaurar
                  }
                </button>
              </div>
            </div>

            @if (restoreResult()) {
              <div class="rounded-2xl border p-4 text-sm"
                [ngClass]="restoreResult()!.exito ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400'">
                <p class="font-black">{{ restoreResult()!.exito ? 'Restauración completada' : 'Error en la restauración' }}</p>
                <p class="mt-1 opacity-80 break-all">{{ restoreResult()!.mensaje }}</p>
              </div>
            }
          </div>
        }

        <!-- TAB: UTILIDADES -->
        @if (tabActiva() === 'utilidades') {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <!-- Verificar integridad -->
            <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm p-5">
              <div class="flex items-center gap-2 mb-4">
                <lucide-icon [name]="Wrench" class="w-5 h-5 text-blue-600 dark:text-blue-400"></lucide-icon>
                <h3 class="font-black text-slate-800 dark:text-white">Verificar integridad</h3>
              </div>
              <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Respaldos disponibles</label>
              <app-custom-select [(ngModel)]="archivoVerificar" [options]="archivosOptions" placeholder="SELECCIONAR RESPALDO"></app-custom-select>
              <button (click)="verificarSeleccionado()"
                class="mt-4 w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 text-sm cursor-pointer">
                <lucide-icon [name]="CheckCircle2" class="w-4 h-4"></lucide-icon>
                Verificar
              </button>
              @if (verifResult()) {
                <div class="mt-4 rounded-2xl border p-4 text-sm flex items-start gap-3"
                  [ngClass]="verifResult()!.valido ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400'">
                  <lucide-icon [name]="verifResult()!.valido ? CheckCircle2 : XCircle" class="w-5 h-5 shrink-0 mt-0.5"></lucide-icon>
                  <div>
                    <p class="font-black">{{ verifResult()!.valido ? 'Respaldo válido' : 'Respaldo inválido' }}</p>
                    <p class="mt-0.5 opacity-80 break-all">{{ verifResult()!.mensaje }}</p>
                  </div>
                </div>
              }
            </div>

            <!-- Limpieza automática + estadísticas -->
            <div class="space-y-5">
              <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm p-5">
                <div class="flex items-center gap-2 mb-3">
                  <lucide-icon [name]="RefreshCw" class="w-5 h-5 text-blue-600 dark:text-blue-400"></lucide-icon>
                  <h3 class="font-black text-slate-800 dark:text-white">Limpieza automática</h3>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  Los respaldos se eliminan automáticamente según la retención configurada en
                  <span class="font-bold text-slate-700 dark:text-slate-200">RETENCION_BACKUPS_DIAS</span>
                  (30 días por defecto). El respaldo más reciente siempre se conserva.
                </p>
              </div>

              <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm p-5">
                <div class="flex items-center gap-2 mb-3">
                  <lucide-icon [name]="Archive" class="w-5 h-5 text-blue-600 dark:text-blue-400"></lucide-icon>
                  <h3 class="font-black text-slate-800 dark:text-white">Historial por día</h3>
                </div>
                @if ((stats()?.por_dia?.length ?? 0) === 0) {
                  <p class="text-sm text-slate-400">Sin respaldos registrados.</p>
                } @else {
                  <div class="space-y-2">
                    @for (d of stats()?.por_dia ?? []; track d.dia) {
                      <div class="flex items-center justify-between text-sm">
                        <span class="text-slate-600 dark:text-slate-300 font-semibold">{{ d.dia }}</span>
                        <span class="text-slate-400 font-bold">{{ d.cantidad }} respaldo(s)</span>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [],
})
export class BackupComponent implements OnInit {
  private svc = inject(BackupService);
  private notify = inject(NotificationService);

  readonly Database = Database;
  readonly HardDrive = HardDrive;
  readonly Download = Download;
  readonly Trash2 = Trash2;
  readonly RefreshCw = RefreshCw;
  readonly Upload = Upload;
  readonly Wrench = Wrench;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly AlertTriangle = AlertTriangle;
  readonly Save = Save;
  readonly Archive = Archive;

  tabActiva = signal<TabId>('respaldo');
  loading = signal(true);
  backups = signal<BackupItem[]>([]);
  stats = signal<BackupStats | null>(null);
  creando = signal(false);
  restaurando = signal(false);

  tipoRespaldo = 'completo';
  tablasRespaldo = '';

  tipoRespaldoOptions = [
    { value: 'completo', label: 'COMPLETO (DATOS + ESTRUCTURA)' },
    { value: 'estructura', label: 'SOLO ESTRUCTURA (ESQUEMA)' },
    { value: 'tablas', label: 'TABLAS ESPECÍFICAS' },
  ];

  get archivosOptions() {
    return this.backups().map((b) => ({ value: b.archivo, label: b.archivo }));
  }

  archivoRestaurar = '';
  archivoSubido = signal<File | null>(null);
  limpiarBd = false;
  recrearBd = false;
  tablasRestore = '';
  restoreResult = signal<{ exito: boolean; mensaje: string } | null>(null);

  archivoVerificar = '';
  verifResult = signal<BackupVerificacion | null>(null);

  tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'respaldo', label: 'Respaldo', icon: Database },
    { id: 'restaurar', label: 'Restauración', icon: Upload },
    { id: 'utilidades', label: 'Utilidades', icon: Wrench },
  ];

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.svc.stats().subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notify.errorToast('Error', 'No se pudieron cargar las estadísticas.');
      },
    });
    this.svc.listar().subscribe({
      next: (res) => {
        this.backups.set(res.data);
        if (!this.archivoRestaurar && res.data.length > 0) {
          this.archivoRestaurar = res.data[0].archivo;
          this.archivoVerificar = res.data[0].archivo;
        }
      },
      error: () => this.notify.errorToast('Error', 'No se pudieron cargar los respaldos.'),
    });
  }

  private parseTablas(texto: string): string[] {
    return texto.split(',').map((t) => t.trim()).filter(Boolean);
  }

  crearRespaldo(): void {
    const tablas = this.parseTablas(this.tablasRespaldo);
    if (this.tipoRespaldo === 'tablas' && tablas.length === 0) {
      this.notify.error('Error', 'Indica al menos una tabla para el respaldo por tablas.');
      return;
    }
    this.creando.set(true);
    this.notify.loading();
    this.svc.crear(this.tipoRespaldo, tablas).subscribe({
      next: () => {
        this.creando.set(false);
        this.notify.close();
        this.notify.success('Respaldo creado', 'El respaldo se generó correctamente.');
        this.refresh();
      },
      error: (e) => {
        this.creando.set(false);
        this.notify.close();
        this.notify.error('Error', e?.error?.message ?? 'No se pudo crear el respaldo.');
      },
    });
  }

  descargar(item: BackupItem): void {
    this.svc.descargar(item.archivo).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.archivo;
        a.click();
        URL.revokeObjectURL(url);
        this.notify.success('Descargado', `${item.archivo} descargado correctamente.`);
      },
      error: () => this.notify.error('Error', 'No se pudo descargar el respaldo.'),
    });
  }

  verificar(item: BackupItem): void {
    this.svc.verificar(item.archivo).subscribe({
      next: (res) => {
        const v = res.data;
        if (v.valido) {
          this.notify.success('Respaldo válido', v.mensaje);
        } else {
          this.notify.error('Respaldo inválido', v.mensaje);
        }
      },
      error: () => this.notify.error('Error', 'No se pudo verificar el respaldo.'),
    });
  }

  verificarSeleccionado(): void {
    if (!this.archivoVerificar) return;
    this.svc.verificar(this.archivoVerificar).subscribe({
      next: (res) => this.verifResult.set(res.data),
      error: () => this.notify.error('Error', 'No se pudo verificar el respaldo.'),
    });
  }

  async eliminar(item: BackupItem): Promise<void> {
    const ok = await this.notify.confirm('¿Eliminar respaldo?', `Se eliminará definitivamente "${item.archivo}".`);
    if (!ok) return;
    this.svc.eliminar(item.archivo).subscribe({
      next: () => {
        this.notify.success('Eliminado', 'El respaldo fue eliminado.');
        this.refresh();
      },
      error: () => this.notify.error('Error', 'No se pudo eliminar el respaldo.'),
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoSubido.set(input.files?.[0] ?? null);
  }

  private opcionesRestore(): { limpiar: boolean; recrear: boolean; tablas: string[]; confirmar: boolean } {
    return {
      limpiar: this.limpiarBd,
      recrear: this.recrearBd,
      tablas: this.parseTablas(this.tablasRestore),
      confirmar: true,
    };
  }

  async restaurarExistente(): Promise<void> {
    if (!this.archivoRestaurar) {
      this.notify.error('Error', 'Selecciona un respaldo para restaurar.');
      return;
    }
    const ok = await this.notify.confirm(
      '¿Restaurar base de datos?',
      `Se sobrescribirá la base de datos desde "${this.archivoRestaurar}". Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    this.restaurando.set(true);
    this.notify.loading();
    this.svc.restaurar({ archivo: this.archivoRestaurar, ...this.opcionesRestore() }).subscribe({
      next: (res) => {
        this.restaurando.set(false);
        this.notify.close();
        this.restoreResult.set({ exito: res.data.exito, mensaje: res.data.salida || res.data.mensaje });
        this.notify.success('Restauración completada', res.data.mensaje);
      },
      error: (e) => {
        this.restaurando.set(false);
        this.notify.close();
        this.restoreResult.set({ exito: false, mensaje: e?.error?.message ?? 'No se pudo restaurar.' });
        this.notify.error('Error', e?.error?.message ?? 'No se pudo restaurar.');
      },
    });
  }

  async restaurarSubido(): Promise<void> {
    const file = this.archivoSubido();
    if (!file) {
      this.notify.error('Error', 'Adjunta un archivo de respaldo.');
      return;
    }
    const ok = await this.notify.confirm(
      '¿Restaurar base de datos?',
      `Se sobrescribirá la base de datos desde "${file.name}". Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    this.restaurando.set(true);
    this.notify.loading();
    this.svc.restaurarUpload(file, this.opcionesRestore()).subscribe({
      next: (res) => {
        this.restaurando.set(false);
        this.notify.close();
        this.restoreResult.set({ exito: res.data.exito, mensaje: res.data.salida || res.data.mensaje });
        this.notify.success('Restauración completada', res.data.mensaje);
      },
      error: (e) => {
        this.restaurando.set(false);
        this.notify.close();
        this.restoreResult.set({ exito: false, mensaje: e?.error?.message ?? 'No se pudo restaurar.' });
        this.notify.error('Error', e?.error?.message ?? 'No se pudo restaurar.');
      },
    });
  }
}
