import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConsejosService } from '../../core/services/consejos.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConsejoComunal } from '../../core/models/usuario.model';

@Component({
  selector: 'app-consejo-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <!-- Page Title -->
      <div>
        <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{{ isEdit() ? 'Editar Consejo' : 'Nuevo Consejo' }}</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">Completa la información formal de este consejo comunal.</p>
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
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Nombre del consejo *</label>
            <input 
              [(ngModel)]="form.nombre" 
              name="nombre" 
              required 
              placeholder="Ej: Consejo Comunal Patria Querida"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium"
            />
          </div>

          <!-- RIF Field -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">RIF *</label>
            <input 
              [(ngModel)]="form.rif" 
              name="rif" 
              placeholder="J-12345678-9" 
              required 
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium text-sm"
            />
          </div>

          <!-- Telephone Field -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Teléfono</label>
            <input 
              [(ngModel)]="form.telefono" 
              name="telefono" 
              placeholder="Ej: 0212-5555555"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium text-sm"
            />
          </div>

          <!-- Address Field -->
          <div class="sm:col-span-2 space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Dirección detallada *</label>
            <input 
              [(ngModel)]="form.direccion" 
              name="direccion" 
              required 
              placeholder="Ej: Calle Principal Sector 3, casa N-12"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium"
            />
          </div>

          <!-- Parroquia Field -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Parroquia *</label>
            <input 
              [(ngModel)]="form.parroquia" 
              name="parroquia" 
              required 
              placeholder="Ej: El Valle"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium text-sm"
            />
          </div>

          <!-- Municipio Field -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Municipio *</label>
            <input 
              [(ngModel)]="form.municipio" 
              name="municipio" 
              required 
              placeholder="Ej: Libertador"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium text-sm"
            />
          </div>

          <!-- Estado Field -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Estado *</label>
            <input 
              [(ngModel)]="form.estado" 
              name="estado" 
              required 
              placeholder="Ej: Distrito Capital"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium text-sm"
            />
          </div>

          <!-- Email Field -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Email institucional</label>
            <input 
              [(ngModel)]="form.email" 
              name="email" 
              type="email" 
              placeholder="ejemplo@consejo.com"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium text-sm"
            />
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
            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed text-sm"
          >
            {{ saving() ? 'Guardando...' : 'Guardar Consejo' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: []
})
export class ConsejoFormComponent implements OnInit {
  private svc    = inject(ConsejosService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private notify = inject(NotificationService);

  isEdit = signal(false);
  saving = signal(false);
  error  = signal('');

  form: Partial<ConsejoComunal> = {
    nombre: '', rif: '', direccion: '', parroquia: '',
    municipio: '', estado: '', telefono: '', email: '',
  };

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
    this.error.set('');
    const id = this.route.snapshot.paramMap.get('id');
    const obs = id
      ? this.svc.update(+id, this.form)
      : this.svc.create(this.form);

    obs.subscribe({
      next: () => { this.saving.set(false); this.notify.success(id ? 'Consejo actualizado' : 'Consejo creado', 'El consejo comunal se ha guardado correctamente.'); this.router.navigate(['/app/consejos']); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Error al guardar.'); this.saving.set(false); this.notify.error('Error', e?.error?.message ?? 'Error al guardar el consejo.'); },
    });
  }

  cancel() { this.router.navigate(['/app/consejos']); }
}
