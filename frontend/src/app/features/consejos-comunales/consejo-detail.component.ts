import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConsejosService } from '../../core/services/consejos.service';
import { ConsejoComunal } from '../../core/models/usuario.model';

@Component({
  selector: 'app-consejo-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl">
          <div class="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <span class="text-sm text-slate-500 dark:text-slate-400 mt-4 font-semibold animate-pulse">Cargando información...</span>
        </div>
      } @else if (consejo()) {

        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div class="space-y-2">
            <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{{ consejo()!.nombre }}</h2>
            <span 
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
              [class]="consejo()!.activo ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'"
            >
              {{ consejo()!.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
          <a 
            [routerLink]="['..', consejo()!.id, 'editar']" 
            class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 transition-all text-sm cursor-pointer"
          >
            <span>✏️</span>
            <span>Editar</span>
          </a>
        </div>

        <!-- Detail Card -->
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-sm">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            
            <div class="space-y-1">
              <dt class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">RIF</dt>
              <dd class="font-mono text-sm font-bold text-slate-800 dark:text-white">{{ consejo()!.rif }}</dd>
            </div>

            <div class="space-y-1">
              <dt class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">Teléfono</dt>
              <dd class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ consejo()!.telefono || '—' }}</dd>
            </div>

            <div class="sm:col-span-2 space-y-1">
              <dt class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">Dirección</dt>
              <dd class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ consejo()!.direccion }}</dd>
            </div>

            <div class="space-y-1">
              <dt class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">Parroquia</dt>
              <dd class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ consejo()!.parroquia }}</dd>
            </div>

            <div class="space-y-1">
              <dt class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">Municipio</dt>
              <dd class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ consejo()!.municipio }}</dd>
            </div>

            <div class="space-y-1">
              <dt class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">Estado</dt>
              <dd class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ consejo()!.estado }}</dd>
            </div>

            <div class="space-y-1">
              <dt class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">Email institucional</dt>
              <dd class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ consejo()!.email || '—' }}</dd>
            </div>

          </div>
        </div>

        <!-- Back Link -->
        <a 
          routerLink="/app/consejos" 
          class="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          ← Volver a consejos
        </a>
      }
    </div>
  `,
  styles: []
})
export class ConsejoDetailComponent implements OnInit {
  private svc   = inject(ConsejosService);
  private route = inject(ActivatedRoute);

  consejo = signal<ConsejoComunal | null>(null);
  loading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(+id).subscribe({
      next: (r) => { this.consejo.set(r.data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }
}
