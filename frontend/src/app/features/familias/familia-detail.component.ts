import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FamiliasService } from '../../core/services/familias.service';
import { Familia } from '../../core/models/usuario.model';

@Component({
  selector: 'app-familia-detail',
  standalone: true,
  imports: [RouterLink],
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
            <p class="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{{ familia()!.direccion }}</p>
          </div>
          <div class="flex items-center gap-3">
            <a [routerLink]="['..', familia()!.id, 'editar']"
              class="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-sm transition-all cursor-pointer">
              Editar
            </a>
            <a [routerLink]="['..', familia()!.id, 'miembros', 'nuevo']"
              class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-blue-600/10 hover:-translate-y-0.5 transition-all text-sm cursor-pointer">
              <span>+</span><span>Miembro</span>
            </a>
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
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/75 dark:bg-slate-800/40 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th class="px-6 py-4">Nombre</th>
                  <th class="px-6 py-4">Cédula</th>
                  <th class="px-6 py-4">Rol</th>
                  <th class="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                @for (m of familia()!.miembros; track m.id) {
                  <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td class="px-6 py-4 font-bold text-slate-800 dark:text-white text-sm">{{ m.nombre }} {{ m.apellido }}</td>
                    <td class="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-400">{{ m.cedula }}</td>
                    <td class="px-6 py-4">
                      @if (m.jefeFamilia) {
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">
                          Jefe de familia
                        </span>
                      }
                    </td>
                    <td class="px-6 py-4 text-right">
                      <a [routerLink]="['..', familia()!.id, 'miembros', m.id, 'editar']"
                        class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                        Editar
                      </a>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500 font-medium">
                      Sin miembros registrados en esta familia.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <a routerLink="/app/familias" class="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
          ← Volver a familias
        </a>
      }
    </div>
  `,
  styles: []
})
export class FamiliaDetailComponent implements OnInit {
  private svc   = inject(FamiliasService);
  private route = inject(ActivatedRoute);

  familia = signal<Familia | null>(null);
  loading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(+id).subscribe({
      next: (r) => { this.familia.set(r.data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }
}
