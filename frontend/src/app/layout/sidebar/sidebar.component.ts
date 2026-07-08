import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import {
  LucideAngularModule,
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  Settings,
  UserCog,
  UserCheck,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight
} from 'lucide-angular';

interface NavItem {
  label: string;
  icon: any;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <aside
      [class.w-72]="!collapsed()"
      [class.w-20]="collapsed()"
      class="h-[100dvh] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-all duration-300 relative select-none z-50"
    >
      <!-- Logo Header -->
      <div class="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 overflow-hidden shrink-0">
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-10 h-10 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center text-xl shrink-0 font-bold">
            🏘️
          </div>
          @if (!collapsed()) {
            <div class="flex flex-col min-w-0 animate-in fade-in duration-200">
              <span class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider leading-none">El Valle</span>
              <span class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Comuna Digital</span>
            </div>
          }
        </div>
        
        @if (!collapsed()) {
          <button 
            (click)="collapsed.set(true)" 
            class="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Contraer menú"
          >
            <lucide-icon [name]="ChevronLeft" class="w-4 h-4"></lucide-icon>
          </button>
        } @else {
          <button 
            (click)="collapsed.set(false)" 
            class="absolute right-[-16px] top-7 w-8 h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer z-50"
            title="Expandir menú"
          >
            <lucide-icon [name]="ChevronRight" class="w-4 h-4"></lucide-icon>
          </button>
        }
      </div>

      <!-- Navigation List -->
      <nav class="flex-1 overflow-y-auto p-4 space-y-1.5 touch-scroll hide-scrollbar">
        @for (item of visibleItems(); track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/10 active-nav"
            [routerLinkActiveOptions]="{ exact: item.route === '/app/dashboard' }"
            class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-all duration-200 group text-sm font-semibold cursor-pointer"
            [title]="item.label"
          >
            <lucide-icon 
              [name]="item.icon" 
              class="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform text-slate-500 dark:text-slate-400 group-[.active-nav]:text-white"
            ></lucide-icon>
            @if (!collapsed()) {
              <span class="truncate animate-in fade-in duration-200 uppercase text-[11px] tracking-wider font-bold">{{ item.label }}</span>
            }
          </a>
        }
      </nav>

      <!-- Theme & User Profile Footer Section -->
      <div class="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
        
        <!-- Theme Toggle Switch -->
        <div class="flex justify-center py-1">
          <div class="flex items-center gap-3 px-3 py-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
            <lucide-icon [name]="Sun" class="w-4 h-4 text-amber-500 shrink-0"></lucide-icon>
            
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" [checked]="isDarkMode()" (change)="toggleDarkMode()" class="sr-only peer" />
              <div class="w-10 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 peer-checked:after:translate-x-5 after:transition-all shadow-inner"></div>
            </label>
            
            <lucide-icon [name]="Moon" class="w-4 h-4 text-slate-400 dark:text-blue-400 shrink-0"></lucide-icon>
          </div>
        </div>

        <!-- User profile display if expanded -->
        @if (!collapsed()) {
          <div class="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-sm">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md">
              {{ initials() }}
            </div>
            <div class="flex flex-col text-left min-w-0 flex-1">
              <span class="text-xs font-black text-slate-800 dark:text-white truncate leading-none uppercase">{{ auth.currentUser()?.nombre }}</span>
              <span class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1 truncate">{{ auth.currentUser()?.rol }}</span>
            </div>
          </div>
        }

        <!-- Logout Button -->
        <button 
          (click)="logout()" 
          class="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group text-sm font-semibold cursor-pointer"
          [title]="'Cerrar sesión'"
        >
          <lucide-icon [name]="LogOut" class="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform"></lucide-icon>
          @if (!collapsed()) {
            <span class="truncate font-bold uppercase text-[11px] tracking-wider animate-in fade-in duration-200">Cerrar Sesión</span>
          }
        </button>
      </div>

    </aside>
  `,
  styles: []
})
export class SidebarComponent implements OnInit {
  auth  = inject(AuthService);
  theme = inject(ThemeService);
  router = inject(Router);

  collapsed = signal(false);

  // Expose icons to template
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly LogOut = LogOut;

  private readonly navItems: NavItem[] = [
    { label: 'Dashboard',     icon: LayoutDashboard, route: '/app/dashboard' },
    { label: 'Consejos',      icon: Building2,       route: '/app/consejos' },
    { label: 'Familias',      icon: Users,           route: '/app/familias' },
    { label: 'Formularios',   icon: ClipboardList,   route: '/app/formularios' },
    { label: 'Reportes',      icon: BarChart3,       route: '/app/reportes' },
    { label: 'Auditoría',     icon: ShieldCheck,     route: '/app/auditoria',     roles: ['admin'] },
    { label: 'Voceros',       icon: UserCheck,       route: '/app/voceros',      roles: ['admin'] },
    { label: 'Configuración', icon: Settings,        route: '/app/configuracion', roles: ['admin'] },
    { label: 'Usuarios',      icon: UserCog,         route: '/app/usuarios',      roles: ['admin'] },
  ];

  ngOnInit() {
    // Check screen size to auto-collapse sidebar on smaller screens
    if (window.innerWidth < 1024) {
      this.collapsed.set(true);
    }
  }

  visibleItems() {
    const user = this.auth.currentUser();
    return this.navItems.filter(
      (item) => !item.roles || (user && item.roles.includes(user.rol))
    );
  }

  isDarkMode() {
    return this.theme.theme() === 'dark';
  }

  toggleDarkMode() {
    this.theme.toggle();
  }

  initials(): string {
    const name = this.auth.currentUser()?.nombre ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
