import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UsuariosService } from '../../core/services/usuarios.service';
import { NotificationService } from '../../core/services/notification.service';
import { Usuario } from '../../core/models/usuario.model';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Usuarios</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">Gestiona las cuentas de acceso y roles del personal del consejo.</p>
        </div>
        <a 
          routerLink="nuevo" 
          class="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 text-sm cursor-pointer"
        >
          <span class="text-lg leading-none">+</span>
          <span>Nuevo usuario</span>
        </a>
      </div>

      <!-- Content Container -->
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl">
          <div class="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <span class="text-sm text-slate-500 dark:text-slate-400 mt-4 font-semibold animate-pulse">Cargando usuarios...</span>
        </div>
      } @else {
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/75 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th class="px-6 py-4">Nombre</th>
                  <th class="px-6 py-4">Correo</th>
                  <th class="px-6 py-4">Rol</th>
                  <th class="px-6 py-4">Estado</th>
                  <th class="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                @for (u of usuarios(); track u.id) {
                  <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td class="px-6 py-4">
                      <div class="font-bold text-slate-800 dark:text-white text-sm">{{ u.nombre }}</div>
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{{ u.email }}</td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {{ u.rol }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span 
                        class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold"
                        [class]="u.activo ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'"
                      >
                        {{ u.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="inline-flex items-center gap-3">
                        <a 
                          [routerLink]="[u.id, 'editar']" 
                          class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Editar
                        </a>
                        @if (u.activo) {
                          <button 
                            (click)="deactivate(u)" 
                            class="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                          >
                            Desactivar
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500 font-medium">
                      No se encontraron usuarios en el sistema.
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
export class UsuarioListComponent implements OnInit {
  private svc = inject(UsuariosService);
  private notify = inject(NotificationService);
  usuarios = signal<Usuario[]>([]);
  loading  = signal(true);

  ngOnInit() { this.load(); }

  load() {
    this.svc.getAll().subscribe({
      next: (r) => { this.usuarios.set(r.data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  async deactivate(u: Usuario) {
    const confirmed = await this.notify.confirm('¿Desactivar usuario?', `Se desactivará la cuenta de "${u.nombre}". Podrás activarla nuevamente después.`);
    if (!confirmed) return;
    this.svc.deactivate(u.id).subscribe({
      next: () => { this.notify.success('Usuario desactivado'); this.load(); },
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al desactivar.'),
    });
  }
}
