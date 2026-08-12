import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { LucideAngularModule, ShieldCheck, Network, Flame, Save, Trash2, RefreshCw, Power, Lock, Globe, Activity, CheckCircle2, XCircle } from 'lucide-angular';
import { ConfiguracionService, IpIntento } from '../../core/services/configuracion.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfiguracionSistema } from '../../core/models/usuario.model';

type TabId = 'seguridad' | 'entorno' | 'firewall';

@Component({
  selector: 'app-seguridad-red',
  standalone: true,
  imports: [FormsModule, DatePipe, LucideAngularModule],
  template: `
    <div class="animate-in fade-in duration-300 flex flex-col flex-1 min-h-0">
      <!-- Header -->
      <header class="mb-6">
        <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Seguridad de Red</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 font-normal">Configuración de validación de IPs, entorno de red y reglas de firewall.</p>
      </header>

      <!-- Tabs -->
      <div class="flex justify-center mb-6">
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm p-1.5 inline-flex flex-wrap justify-center gap-1">
          @for (tab of tabs; track tab.id) {
            <button
              (click)="tabActiva.set(tab.id)"
              class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
              [class.bg-blue-600]="tabActiva() === tab.id"
              [class.text-white]="tabActiva() === tab.id"
              [class.shadow-md]="tabActiva() === tab.id"
              [class.shadow-blue-600/20]="tabActiva() === tab.id"
              [class.text-slate-500]="tabActiva() !== tab.id"
              [class.hover:bg-slate-100]="tabActiva() !== tab.id"
              [class.hover:text-slate-700]="tabActiva() !== tab.id"
            >
              <lucide-icon [name]="tab.icon" class="w-4 h-4"></lucide-icon>
              {{ tab.label }}
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-20">
          <div class="w-8 h-8 border-[3px] border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      } @else {
        <!-- TAB: SEGURIDAD -->
        @if (tabActiva() === 'seguridad') {
          <div class="grid grid-cols-3 gap-3 sm:gap-5">
            @for (item of camposToggle; track item.clave) {
              <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl shadow-sm p-3 sm:p-5 flex flex-col min-w-0">
                <div class="flex items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0" [class]="item.iconBg">
                      <lucide-icon [name]="item.icon" class="w-4 h-4 sm:w-5 sm:h-5" [class]="item.iconColor"></lucide-icon>
                    </div>
                    <div class="min-w-0">
                      <h3 class="text-xs sm:text-sm font-black text-slate-800 dark:text-white leading-tight">{{ item.label }}</h3>
                      <p class="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">{{ item.descripcion }}</p>
                    </div>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" [checked]="item.value() === 'true'" (change)="toggleCampo(item)" class="sr-only peer" />
                    <div class="relative w-11 h-6 rounded-full transition-all duration-300 shadow-inner cursor-pointer"
                         [style.background]="item.value() === 'true' ? '#2563eb' : '#cbd5e1'">
                      <div class="absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300"
                           [style.transform]="item.value() === 'true' ? 'translateX(20px)' : 'translateX(0)'"></div>
                    </div>
                  </label>
                </div>
              </div>
            }
          </div>

          <div class="grid grid-cols-2 gap-3 sm:gap-5 mt-5">
            @for (item of camposNumero; track item.clave) {
              <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-5 flex flex-col min-w-0">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" [class]="item.iconBg">
                    <lucide-icon [name]="item.icon" class="w-5 h-5" [class]="item.iconColor"></lucide-icon>
                  </div>
                  <div class="min-w-0">
                    <h3 class="text-sm font-black text-slate-800 dark:text-white leading-tight">{{ item.label }}</h3>
                    <p class="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">{{ item.descripcion }}</p>
                  </div>
                </div>
                <div class="mt-auto">
                  <input type="number" min="1" [(ngModel)]="item.value" (ngModelChange)="guardarCampo(item)"
                    class="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-normal" />
                </div>
              </div>
            }
          </div>
        }

        <!-- TAB: ENTORNO -->
        @if (tabActiva() === 'entorno') {
          <div class="grid grid-cols-1 gap-5">
            <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center">
                  <lucide-icon [name]="Globe" class="w-5 h-5 text-sky-600 dark:text-sky-400"></lucide-icon>
                </div>
                <div>
                  <h3 class="text-sm font-black text-slate-800 dark:text-white">Orígenes CORS permitidos</h3>
                  <p class="text-[11px] text-slate-400 dark:text-slate-500 font-normal">Lista separada por comas. El backend actualiza esta lista cada 60 segundos.</p>
                </div>
              </div>
              <textarea
                [(ngModel)]="origenesPermitidos"
                rows="4"
                placeholder="http://localhost:4200,http://localhost:3000"
                class="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono"></textarea>
              <button
                (click)="guardarOrigenes()"
                class="mt-4 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 text-sm cursor-pointer"
              >
                <lucide-icon [name]="Save" class="w-4 h-4"></lucide-icon>
                Guardar orígenes
              </button>
            </div>
          </div>
        }

        <!-- TAB: FIREWALL -->
        @if (tabActiva() === 'firewall') {
          <div class="grid grid-cols-1 gap-5">
            <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm flex flex-col flex-1 min-h-0">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 md:px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                    <lucide-icon [name]="Activity" class="w-5 h-5 text-rose-600 dark:text-rose-400"></lucide-icon>
                  </div>
                  <div>
                    <h3 class="text-sm font-black text-slate-800 dark:text-white">Intentos de acceso por IP</h3>
                    <p class="text-[11px] text-slate-400 dark:text-slate-500 font-normal">IPs con intentos fallidos de inicio de sesión. Se bloquean automáticamente tras exceder el máximo.</p>
                  </div>
                </div>
                <button
                  (click)="cargarIpIntentos()"
                  class="inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all text-sm cursor-pointer shrink-0"
                >
                  <lucide-icon [name]="RefreshCw" class="w-4 h-4"></lucide-icon>
                </button>
              </div>

              @if (ipIntentos().length === 0) {
                <div class="flex flex-col items-center justify-center py-16 text-center px-4">
                  <lucide-icon [name]="ShieldCheck" class="w-12 h-12 text-emerald-500/40 mb-3"></lucide-icon>
                  <p class="text-sm font-bold text-slate-600 dark:text-slate-300">No hay registros de IPs con intentos fallidos</p>
                  <p class="text-xs text-slate-400 dark:text-slate-500 font-normal mt-1">Los intentos fallidos de inicio de sesión aparecerán aquí.</p>
                </div>
              } @else {
                <div class="relative flex-1 min-h-0 overflow-x-auto overflow-y-auto">
                  <table class="w-full min-w-[600px] border-collapse h-full">
                    <thead>
                      <tr class="bg-slate-50/75 dark:bg-slate-800/40 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <th class="px-6 py-4 text-left">IP</th>
                        <th class="px-4 py-4 text-center">Intentos fallidos</th>
                        <th class="px-4 py-4 text-center">Estado</th>
                        <th class="px-4 py-4 text-center">Bloqueada hasta</th>
                        <th class="px-4 py-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody class="text-slate-700 dark:text-slate-300">
                      @for (item of ipIntentos(); track item.ip) {
                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800/60">
                          <td class="px-6 py-4">
                            <span class="text-sm font-bold text-slate-800 dark:text-white font-mono">{{ item.ip }}</span>
                          </td>
                          <td class="px-4 py-4 text-center">
                            <span class="inline-flex items-center justify-center min-w-7 px-2 py-0.5 rounded-full text-[10px] font-bold" [class]="item.intentos_fallidos >= 3 ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'">
                              {{ item.intentos_fallidos }}
                            </span>
                          </td>
                          <td class="px-4 py-4 text-center">
                            @if (estaBloqueada(item)) {
                              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                <lucide-icon [name]="XCircle" class="w-3 h-3"></lucide-icon>
                                Bloqueada
                              </span>
                            } @else {
                              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <lucide-icon [name]="CheckCircle2" class="w-3 h-3"></lucide-icon>
                                Vigilada
                              </span>
                            }
                          </td>
                          <td class="px-4 py-4 text-center">
                            <span class="text-xs font-normal text-slate-500 dark:text-slate-400">
                              {{ item.bloqueada_hasta ? (item.bloqueada_hasta | date:'dd/MM/yyyy HH:mm') : '—' }}
                            </span>
                          </td>
                          <td class="px-4 py-4 text-center">
                            <button
                              (click)="desbloquear(item.ip)"
                              title="Desbloquear IP"
                              class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 text-slate-500 dark:text-slate-300 rounded-xl transition-all text-[11px] font-bold cursor-pointer"
                            >
                              <lucide-icon [name]="Trash2" class="w-3.5 h-3.5"></lucide-icon>
                              Desbloquear
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `
})
export class SeguridadRedComponent implements OnInit {
  private cfg = inject(ConfiguracionService);
  private notify = inject(NotificationService);

  readonly ShieldCheck = ShieldCheck;
  readonly Network = Network;
  readonly Flame = Flame;
  readonly Save = Save;
  readonly Trash2 = Trash2;
  readonly RefreshCw = RefreshCw;
  readonly Power = Power;
  readonly Lock = Lock;
  readonly Globe = Globe;
  readonly Activity = Activity;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;

  tabActiva = signal<TabId>('seguridad');
  loading = signal(true);
  ipIntentos = signal<IpIntento[]>([]);
  origenesPermitidos = '';

  tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'seguridad', label: 'Seguridad', icon: ShieldCheck },
    { id: 'entorno', label: 'Entorno de Red', icon: Network },
    { id: 'firewall', label: 'Firewall / IPs', icon: Flame },
  ];

  private configs = signal<ConfiguracionSistema[]>([]);

  camposToggle: any[] = [];
  camposNumero: any[] = [];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.cfg.getAll().subscribe({
      next: (res) => {
        this.configs.set(res.data);
        this.armarCampos();
        this.origenesPermitidos = this.getValor('ORIGENES_PERMITIDOS') ?? '';
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Error', 'No se pudo cargar la configuración.');
      }
    });
  }

  private getValor(clave: string): string | null {
    return this.configs().find(c => c.clave === clave)?.valor ?? null;
  }

  private armarCampos(): void {
    this.camposToggle = [
      {
        clave: 'IP_VALIDACION',
        label: 'Validación de IPs',
        descripcion: 'Habilita la validación y el bloqueo automático de direcciones IP.',
        tipo: 'toggle',
        icon: ShieldCheck,
        iconBg: 'bg-blue-50 dark:bg-blue-500/10',
        iconColor: 'text-blue-600 dark:text-blue-400',
        value: signal(this.getValor('IP_VALIDACION') ?? 'true'),
      },
      {
        clave: 'MODO_MANTENIMIENTO',
        label: 'Modo mantenimiento',
        descripcion: 'Deshabilita temporalmente el acceso general al sistema.',
        tipo: 'toggle',
        icon: Power,
        iconBg: 'bg-amber-50 dark:bg-amber-500/10',
        iconColor: 'text-amber-600 dark:text-amber-400',
        value: signal(this.getValor('MODO_MANTENIMIENTO') ?? 'false'),
      },
      {
        clave: 'REGISTRO_ABIERTO',
        label: 'Registro abierto',
        descripcion: 'Permite el registro de nuevos usuarios en el sistema.',
        tipo: 'toggle',
        icon: Lock,
        iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        value: signal(this.getValor('REGISTRO_ABIERTO') ?? 'true'),
      },
    ];
    this.camposNumero = [
      {
        clave: 'MAX_INTENTOS_LOGIN',
        label: 'Intentos máximos de login',
        descripcion: 'Intentos fallidos antes de bloquear la IP temporalmente.',
        tipo: 'numero',
        icon: Activity,
        iconBg: 'bg-rose-50 dark:bg-rose-500/10',
        iconColor: 'text-rose-600 dark:text-rose-400',
        value: signal(this.getValor('MAX_INTENTOS_LOGIN') ?? '3'),
      },
      {
        clave: 'TIEMPO_BLOQUEO_MIN',
        label: 'Tiempo de bloqueo (minutos)',
        descripcion: 'Minutos que dura el bloqueo tras exceder los intentos fallidos.',
        tipo: 'numero',
        icon: Lock,
        iconBg: 'bg-violet-50 dark:bg-violet-500/10',
        iconColor: 'text-violet-600 dark:text-violet-400',
        value: signal(this.getValor('TIEMPO_BLOQUEO_MIN') ?? '15'),
      },
    ];
  }

  toggleCampo(campo: any): void {
    const nuevo = campo.value() === 'true' ? 'false' : 'true';
    campo.value.set(nuevo);
    this.guardarCampo(campo);
  }

  guardarCampo(campo: any): void {
    const valor = String(campo.value());
    this.cfg.update(campo.clave, valor).subscribe({
      next: () => this.notify.success('Guardado', `${campo.label} actualizado.`),
      error: () => this.notify.error('Error', `No se pudo guardar ${campo.label}.`),
    });
  }

  guardarOrigenes(): void {
    this.cfg.update('ORIGENES_PERMITIDOS', this.origenesPermitidos).subscribe({
      next: () => this.notify.success('Guardado', 'Orígenes CORS actualizados. El backend los aplica en 60 segundos.'),
      error: () => this.notify.error('Error', 'No se pudieron guardar los orígenes.'),
    });
  }

  cargarIpIntentos(): void {
    this.cfg.getIpIntentos().subscribe({
      next: (res) => this.ipIntentos.set(res.data),
      error: () => this.notify.error('Error', 'No se pudieron cargar las IPs.'),
    });
  }

  estaBloqueada(item: IpIntento): boolean {
    return !!item.bloqueada_hasta && new Date(item.bloqueada_hasta) > new Date();
  }

  async desbloquear(ip: string): Promise<void> {
    const ok = await this.notify.confirm('¿Desbloquear IP?', `Se eliminará el registro de "${ip}" y podrá volver a intentar iniciar sesión.`);
    if (!ok) return;
    this.cfg.desbloquearIp(ip).subscribe({
      next: () => {
        this.notify.success('IP desbloqueada', `La IP ${ip} fue desbloqueada.`);
        this.cargarIpIntentos();
      },
      error: () => this.notify.error('Error', 'No se pudo desbloquear la IP.'),
    });
  }
}
