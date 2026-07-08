import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { LucideAngularModule, Sun, Moon } from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <header class="flex items-center justify-between px-6 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-300">
      
      <!-- Left Area: Brand or context -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{{ pageTitle }}</span>
      </div>

      <!-- Right Area: Actions & Profile -->
      <div class="flex items-center gap-4">
        
        <!-- Theme Toggle -->
        <button 
          (click)="theme.toggle()" 
          class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          title="Cambiar tema"
        >
          <lucide-icon [name]="theme.theme() === 'dark' ? Sun : Moon" class="w-4 h-4"></lucide-icon>
        </button>

        <!-- User Badge dropdown -->
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
  styles: []
})
export class NavbarComponent {
  auth  = inject(AuthService);
  theme = inject(ThemeService);

  readonly pageTitle = 'Consejo Comunal El Valle';
  readonly Sun = Sun;
  readonly Moon = Moon;

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
