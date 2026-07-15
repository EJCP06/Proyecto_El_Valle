import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { AuditoriaService } from '../../core/services/auditoria.service';
import { RegistroAuditoria } from '../../core/models/usuario.model';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [FormsModule, SlicePipe],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      
      <!-- Page Title -->
      <div>
        <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Bitácora de Auditoría</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 font-normal">Inspecciona los logs históricos de acciones tomadas por los usuarios dentro del sistema.</p>
      </div>

      <!-- Filters Section -->
      <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Entidad</label>
            <input 
              [(ngModel)]="filters.entidad" 
              name="entidad" 
              placeholder="Ej: Familia" 
              class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-sm"
            />
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Desde</label>
            <input 
              [(ngModel)]="filters.desde" 
              name="desde" 
              type="date" 
              class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-sm"
            />
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Hasta</label>
            <input 
              [(ngModel)]="filters.hasta" 
              name="hasta" 
              type="date" 
              class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-sm"
            />
          </div>

          <button 
            (click)="load()" 
            class="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm cursor-pointer w-full"
          >
            Buscar
          </button>
        </div>
      </div>

      <!-- Logs Table -->
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl">
          <div class="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <span class="text-sm text-slate-500 dark:text-slate-400 mt-4 font-semibold animate-pulse">Cargando registros...</span>
        </div>
      } @else {
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm mt-4">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/75 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th class="px-6 py-4">Fecha</th>
                  <th class="px-6 py-4">Usuario</th>
                  <th class="px-6 py-4">Acción</th>
                  <th class="px-6 py-4">Entidad</th>
                  <th class="px-6 py-4">IP</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                @for (log of logs(); track log.id) {
                  <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td class="px-6 py-4 text-xs font-mono">{{ log.createdAt | slice:0:16 }}</td>
                    <td class="px-6 py-4 text-sm font-bold text-slate-800 dark:text-white">{{ log.usuario?.nombre ?? log.usuarioId }}</td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                        {{ log.accion }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm">
                      <span class="font-semibold">{{ log.entidad }}</span>
                      @if (log.entidadId) {
                        <span class="text-xs text-slate-400 dark:text-slate-500 font-bold ml-1">#{{ log.entidadId }}</span>
                      }
                    </td>
                    <td class="px-6 py-4 text-xs font-mono">{{ log.ip ?? '—' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500 font-normal">
                      No se encontraron registros de auditoría.
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
export class AuditoriaComponent implements OnInit {
  private svc = inject(AuditoriaService);
  logs    = signal<RegistroAuditoria[]>([]);
  loading = signal(true);
  filters = { entidad: '', desde: '', hasta: '' };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getLogs(1, 50, this.filters).subscribe({
      next: (r) => { this.logs.set(r.data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }
}

