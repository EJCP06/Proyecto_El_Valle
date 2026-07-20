import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { LucideAngularModule, Sun, Moon, Menu, X } from 'lucide-angular';

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

        <!-- User badge -->
        <div class="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-blue-600/10">
            {{ initials() }}
          </div>
          <div class="hidden sm:flex flex-col text-left">
            <span class="text-xs font-black text-slate-800 dark:text-white leading-none truncate max-w-[120px]">{{ auth.currentUser()?.nombre }}</span>
            <span class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{{ auth.currentUser()?.rol }}</span>
          </div>
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

  initials(): string {
    const name = this.auth.currentUser()?.nombre ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }
}
