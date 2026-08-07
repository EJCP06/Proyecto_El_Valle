import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { LucideAngularModule, Sun, Moon, Menu, X, LogOut, User, Cpu, XCircle } from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <header class="flex items-center justify-between px-6 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-300">
      <!-- Hamburger / Close button -->
      <button (click)="sidebarService.toggle()" class="mobile-menu-btn p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer" [title]="sidebarService.isOpen() ? 'Cerrar menú' : 'Abrir menú'">
        @if (sidebarService.isOpen()) {
          <lucide-icon [name]="X" class="w-6 h-6"></lucide-icon>
        } @else {
          <lucide-icon [name]="Menu" class="w-6 h-6"></lucide-icon>
        }
      </button>

      <!-- Right area -->
      <div class="flex items-center gap-4 navbar-right-area">
        <!-- Theme toggle -->
        <div class="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
          <lucide-icon [name]="Sun" class="w-4 h-4 text-amber-500 shrink-0"></lucide-icon>
          <label class="relative inline-flex items-center cursor-pointer group">
            <input type="checkbox" [checked]="theme.isDark()" (change)="theme.toggle()" class="sr-only peer" />
            <div class="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer-checked:bg-blue-600 peer-focus:outline-none after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 peer-checked:after:translate-x-4 after:transition-all after:duration-300 transition-all duration-300 shadow-inner"></div>
          </label>
          <lucide-icon [name]="Moon" class="w-4 h-4 text-slate-400 dark:text-blue-400 shrink-0"></lucide-icon>
        </div>

        <!-- User badge with dropdown -->
        <div class="relative">
          <button (click)="toggleDropdown()" class="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors cursor-pointer" type="button">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-blue-600/10">
              {{ initials() }}
            </div>
            <div class="hidden sm:flex flex-col text-left">
              <span class="text-xs font-black text-slate-800 dark:text-white leading-none truncate max-w-[120px]">{{ auth.currentUser()?.nombre }}</span>
              <span class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{{ auth.currentUser()?.rol }}</span>
            </div>
          </button>

          <!-- Dropdown -->
          @if (showDropdown()) {
            <div class="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 z-50">
              <!-- User info header -->
              <div class="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <p class="text-sm font-black text-slate-800 dark:text-white">{{ auth.currentUser()?.nombre }}</p>
                <p class="text-[10px] text-slate-500 dark:text-slate-400">{{ auth.currentUser()?.email }}</p>
                <span class="inline-block mt-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[9px] font-bold uppercase rounded-full">{{ auth.currentUser()?.rol }}</span>
              </div>

              <!-- Sessions section -->
              <div class="p-3">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sesiones activas</h4>
                  <button (click)="loadSessions()" [disabled]="loadingSessions()" class="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                    <lucide-icon [name]="Cpu" class="w-3.5 h-3.5"></lucide-icon>
                    <span>Actualizar</span>
                  </button>
                </div>

                @if (loadingSessions()) {
                  <div class="flex justify-center py-4">
                    <div class="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                } @else if (sessions().length === 0) {
                  <p class="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No hay sesiones activas</p>
                } @else {
                  <div class="space-y-2 max-h-64 overflow-y-auto">
                    @for (session of sessions(); track session.id) {
                      <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-700">
                        <div class="flex items-center gap-3 min-w-0 flex-1">
                          <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <lucide-icon [name]="Cpu" class="w-4 h-4 text-blue-600 dark:text-blue-400"></lucide-icon>
                          </div>
                          <div class="min-w-0 flex-1">
                            <p class="text-sm font-bold text-slate-800 dark:text-white truncate">
                              {{ session.dispositivo || 'Dispositivo' }}
                              @if (session.es_actual) {
                                <span class="ml-1.5 inline-flex items-center px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[8px] font-bold uppercase rounded-full">Actual</span>
                              }
                            </p>
                            <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate">{{ session.ip }} · {{ formatDate(session.ultima_actividad) }}</p>
                          </div>
                        </div>
                        @if (!session.es_actual) {
                          <button (click)="revokeSession(session.id)" [disabled]="revokingSessionId() === session.id" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors" title="Cerrar sesión">
                            <lucide-icon [name]="XCircle" class="w-4 h-4"></lucide-icon>
                          </button>
                        } @else {
                          <div class="w-8 h-8 flex items-center justify-center">
                            <lucide-icon [name]="User" class="w-4 h-4 text-emerald-600 dark:text-emerald-400"></lucide-icon>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="border-t border-slate-200 dark:border-slate-800 p-3 space-y-2">
                <button (click)="revokeAllSessions()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 font-bold rounded-xl hover:bg-rose-200 dark:hover:bg-rose-800/50 transition-all text-sm cursor-pointer">
                  <lucide-icon [name]="LogOut" class="w-4 h-4"></lucide-icon>
                  Cerrar todas las demás sesiones
                </button>
                <button (click)="logout()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all text-sm cursor-pointer">
                  <lucide-icon [name]="LogOut" class="w-4 h-4"></lucide-icon>
                  Cerrar sesión
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </header>


  `,
  styles: [`
    .navbar-right-area {
      margin-left: auto;
    }
    @media (min-width: 1024px) {
      .mobile-menu-btn {
        display: none !important;
      }
    }
  `]
})
export class NavbarComponent {
  auth  = inject(AuthService);
  theme = inject(ThemeService);
  sidebarService = inject(SidebarService);

  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly Menu = Menu;
  readonly X = X;
  readonly LogOut = LogOut;
  readonly User = User;
  readonly Cpu = Cpu;
  readonly XCircle = XCircle;

  showDropdown = signal(false);
  loadingSessions = signal(false);
  revokingSessionId = signal<number | null>(null);
  sessions = signal<any[]>([]);

  initials(): string {
    const name = this.auth.currentUser()?.nombre ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  toggleDropdown() {
    this.showDropdown.update(v => !v);
    if (this.showDropdown()) {
      this.loadSessions();
    }
  }

  async loadSessions() {
    if (this.loadingSessions()) return;
    this.loadingSessions.set(true);
    try {
      const res = await this.auth.getSessions().toPromise();
      this.sessions.set(res?.data ?? []);
    } catch {
      this.sessions.set([]);
    } finally {
      this.loadingSessions.set(false);
    }
  }

  async revokeSession(sessionId: number) {
    this.revokingSessionId.set(sessionId);
    try {
      await this.auth.revokeSession(sessionId).toPromise();
      await this.loadSessions();
    } catch {
      // Error handled by interceptor
    } finally {
      this.revokingSessionId.set(null);
    }
  }

  async revokeAllSessions() {
    try {
      await this.auth.revokeAllOtherSessions().toPromise();
      await this.loadSessions();
    } catch {
      // Error handled by interceptor
    }
  }

  logout() {
    this.auth.logout();
    this.showDropdown.set(false);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
