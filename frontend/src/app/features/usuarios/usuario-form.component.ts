import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../core/services/usuarios.service';
import { NotificationService } from '../../core/services/notification.service';
import { Usuario } from '../../core/models/usuario.model';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <!-- Page Title -->
      <div>
        <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{{ isEdit() ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">Completa la información para configurar la cuenta del usuario.</p>
      </div>

      <!-- Error Alert -->
      @if (error()) {
        <div class="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl p-4 text-sm font-medium animate-in fade-in duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ error() }}</span>
        </div>
      }

      <!-- Form Card -->
      <form (ngSubmit)="save()" class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          <!-- Name Field -->
          <div class="sm:col-span-2 space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Nombre completo *</label>
            <input 
              [(ngModel)]="form.nombre" 
              name="nombre" 
              required 
              placeholder="Ej: Edward Pérez"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium"
            />
          </div>

          <!-- Email Field -->
          <div class="sm:col-span-2 space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Email *</label>
            <input 
              [(ngModel)]="form.email" 
              name="email" 
              type="email" 
              required 
              placeholder="correo@elvalle.com"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium"
            />
          </div>

          <!-- Password Field (Only on Create) -->
          @if (!isEdit()) {
            <div class="sm:col-span-2 space-y-2">
              <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Contraseña *</label>
              <input 
                [(ngModel)]="password" 
                name="password" 
                type="password" 
                required 
                placeholder="••••••••"
                class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium"
              />
            </div>
          }

          <!-- Role Selection -->
          <div class="sm:col-span-2 space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Rol del sistema *</label>
            <select 
              [(ngModel)]="form.rol" 
              name="rol" 
              required
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium"
            >
              <option value="vocero">Vocero</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

        </div>

        <!-- Form Actions -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
          <button 
            type="button" 
            (click)="cancel()" 
            class="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            [disabled]="saving()" 
            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {{ saving() ? 'Guardando...' : 'Guardar Usuario' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: []
})
export class UsuarioFormComponent implements OnInit {
  private svc    = inject(UsuariosService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private notify = inject(NotificationService);

  isEdit  = signal(false);
  saving  = signal(false);
  error   = signal('');
  password = '';

  form: Partial<Usuario> = { nombre: '', email: '', rol: 'vocero' };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.svc.getById(+id).subscribe((r) => {
        if (r.success) this.form = { ...r.data };
      });
    }
  }

  save() {
    this.saving.set(true);
    const id = this.route.snapshot.paramMap.get('id');
    const payload = id
      ? this.form
      : { ...this.form, password: this.password };

    const obs = id
      ? this.svc.update(+id, this.form)
      : this.svc.create(payload as Partial<Usuario> & { password: string });

    obs.subscribe({
      next: () => { this.saving.set(false); this.notify.success(id ? 'Usuario actualizado' : 'Usuario creado', 'La cuenta de usuario se ha guardado correctamente.'); this.router.navigate(['/app/usuarios']); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Error.'); this.saving.set(false); this.notify.error('Error', e?.error?.message ?? 'Error al guardar el usuario.'); },
    });
  }

  cancel() { this.router.navigate(['/app/usuarios']); }
}
