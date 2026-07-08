import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormulariosService } from '../../core/services/formularios.service';
import { Formulario } from '../../core/models/usuario.model';

@Component({
  selector: 'app-formulario-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">

      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Formularios</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">Gestiona formularios dinámicos para censos y encuestas comunales.</p>
        </div>
        <a routerLink="nuevo"
          class="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 text-sm cursor-pointer">
          <span class="text-lg leading-none">+</span>
          <span>Nuevo formulario</span>
        </a>
      </div>

      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl">
          <div class="w-8 h-8 border-[3px] border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <span class="text-sm text-slate-500 dark:text-slate-400 mt-4 font-semibold animate-pulse">Cargando formularios...</span>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (f of formularios(); track f.id) {
            <div class="flex flex-col gap-4 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
              
              <!-- Header -->
              <div class="flex items-center justify-between">
                <div class="w-11 h-11 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📋
                </div>
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold"
                  [class]="f.activo ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'">
                  {{ f.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </div>

              <!-- Content -->
              <div class="flex-1 space-y-1">
                <h3 class="font-black text-slate-800 dark:text-white text-sm leading-snug">{{ f.titulo }}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{{ f.descripcion || 'Sin descripción.' }}</p>
              </div>

              <!-- Meta + Actions -->
              <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60">
                <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {{ f.campos.length }} campo(s)
                </span>
                <div class="flex items-center gap-3">
                  <a [routerLink]="[f.id, 'editar']" class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Editar</a>
                  <a [routerLink]="[f.id, 'asignar']" class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">Asignar</a>
                </div>
              </div>
            </div>
          } @empty {
            <div class="sm:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl">
              <span class="text-5xl mb-4">📋</span>
              <p class="text-sm text-slate-400 dark:text-slate-500 font-medium">No hay formularios registrados aún.</p>
              <a routerLink="nuevo" class="mt-4 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Crear el primero</a>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: []
})
export class FormularioListComponent implements OnInit {
  private svc = inject(FormulariosService);
  formularios = signal<Formulario[]>([]);
  loading     = signal(true);

  ngOnInit() {
    this.svc.getAll().subscribe({
      next: (r) => { this.formularios.set(r.data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }
}
