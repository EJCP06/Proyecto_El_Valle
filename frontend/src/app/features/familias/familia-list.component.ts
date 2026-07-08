import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FamiliasService } from '../../core/services/familias.service';
import { Familia } from '../../core/models/usuario.model';

@Component({
  selector: 'app-familia-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">

      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Familias</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">Registro de núcleos familiares censados en los consejos comunales.</p>
        </div>
        <a
          routerLink="nueva"
          class="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 text-sm cursor-pointer"
        >
          <span class="text-lg leading-none">+</span>
          <span>Nueva familia</span>
        </a>
      </div>

      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl">
          <div class="w-8 h-8 border-[3px] border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <span class="text-sm text-slate-500 dark:text-slate-400 mt-4 font-semibold animate-pulse">Cargando familias...</span>
        </div>
      } @else {
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/75 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th class="px-6 py-4">Nombre</th>
                  <th class="px-6 py-4">Dirección</th>
                  <th class="px-6 py-4">Consejo</th>
                  <th class="px-6 py-4">Miembros</th>
                  <th class="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                @for (f of familias(); track f.id) {
                  <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td class="px-6 py-4">
                      <div class="font-bold text-slate-800 dark:text-white text-sm">{{ f.nombre }}</div>
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{{ f.direccion }}</td>
                    <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{{ f.consejo?.nombre ?? '—' }}</td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-black">
                        {{ f.miembros?.length ?? 0 }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="inline-flex items-center gap-3">
                        <a [routerLink]="[f.id]" class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Ver</a>
                        <a [routerLink]="[f.id, 'editar']" class="text-xs font-bold text-slate-600 dark:text-slate-400 hover:underline cursor-pointer">Editar</a>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500 font-medium">
                      No se encontraron familias registradas.
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
export class FamiliaListComponent implements OnInit {
  private svc = inject(FamiliasService);
  familias = signal<Familia[]>([]);
  loading  = signal(true);

  ngOnInit() {
    this.svc.getAll().subscribe({
      next: (r) => { this.familias.set(r.data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }
}
