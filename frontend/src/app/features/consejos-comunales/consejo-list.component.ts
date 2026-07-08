import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConsejosService } from '../../core/services/consejos.service';
import { ConsejoComunal } from '../../core/models/usuario.model';

@Component({
  selector: 'app-consejo-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Consejos Comunales</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">Administra los consejos comunales adscritos en la jurisdicción de El Valle.</p>
        </div>
        <a 
          routerLink="nuevo" 
          class="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 text-sm cursor-pointer"
        >
          <span class="text-lg leading-none">+</span>
          <span>Nuevo consejo</span>
        </a>
      </div>

      <!-- Table Wrapper -->
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl">
          <div class="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <span class="text-sm text-slate-500 dark:text-slate-400 mt-4 font-semibold animate-pulse">Cargando consejos comunales...</span>
        </div>
      } @else {
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/75 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th class="px-6 py-4">Nombre</th>
                  <th class="px-6 py-4">RIF</th>
                  <th class="px-6 py-4">Parroquia</th>
                  <th class="px-6 py-4">Estado</th>
                  <th class="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-750 dark:text-slate-300">
                @for (c of consejos(); track c.id) {
                  <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td class="px-6 py-4">
                      <div class="font-bold text-slate-850 dark:text-white text-sm">{{ c.nombre }}</div>
                    </td>
                    <td class="px-6 py-4 text-xs font-mono text-slate-550 dark:text-slate-400">{{ c.rif }}</td>
                    <td class="px-6 py-4 text-sm">{{ c.parroquia }}</td>
                    <td class="px-6 py-4">
                      <span 
                        class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold"
                        [class]="c.activo ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'"
                      >
                        {{ c.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="inline-flex items-center gap-3">
                        <a 
                          [routerLink]="[c.id]" 
                          class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Ver
                        </a>
                        <a 
                          [routerLink]="[c.id, 'editar']" 
                          class="text-xs font-bold text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
                        >
                          Editar
                        </a>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500 font-medium">
                      No se encontraron consejos comunales.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class ConsejoListComponent implements OnInit {
  private svc = inject(ConsejosService);
  consejos = signal<ConsejoComunal[]>([]);
  loading  = signal(true);

  ngOnInit() {
    this.svc.getAll().subscribe({
      next: (r) => { this.consejos.set(r.data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }
}
