import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MiembrosService } from '../../core/services/miembros.service';
import { CatalogoService, CatalogoItem } from '../../core/services/catalogo.service';
import { NotificationService } from '../../core/services/notification.service';
import { Miembro } from '../../core/models/usuario.model';

@Component({
  selector: 'app-miembro-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">

      <div>
        <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{{ isEdit() ? 'Editar Miembro' : 'Nuevo Miembro' }}</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">Datos del integrante del núcleo familiar.</p>
      </div>

      @if (error()) {
        <div class="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl p-4 text-sm font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>{{ error() }}</span>
        </div>
      }

      <form (ngSubmit)="save()" class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">

          <!-- Nombre -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Nombre *</label>
            <input [(ngModel)]="form.nombre" name="nombre" required placeholder="Ej: Carlos"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium"/>
          </div>

          <!-- Apellido -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Apellido *</label>
            <input [(ngModel)]="form.apellido" name="apellido" required placeholder="Ej: Rodríguez"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium"/>
          </div>

          <!-- Cédula -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Cédula *</label>
            <input [(ngModel)]="form.cedula" name="cedula" required placeholder="Ej: V-12345678"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium text-sm"/>
          </div>

          <!-- Fecha de nacimiento -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Fecha de nacimiento</label>
            <input [(ngModel)]="form.fechaNacimiento" name="fechaNacimiento" type="date"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium text-sm"/>
          </div>

          <!-- Sexo -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Sexo</label>
            <select [(ngModel)]="form.sexo" name="sexo"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium">
              <option value="">— Sin especificar —</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>

          <!-- Parentesco -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Parentesco</label>
            <select [(ngModel)]="form.parentesco" name="parentesco"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium">
              <option value="">— Seleccionar —</option>
              @for (p of parentescos(); track p.id) {
                <option [value]="p.nombre">{{ p.nombre }}</option>
              }
            </select>
          </div>

          <!-- Estado Civil -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Estado civil</label>
            <select [(ngModel)]="form.estadoCivil" name="estadoCivil"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium">
              <option value="">— Seleccionar —</option>
              @for (e of estadosCiviles(); track e.id) {
                <option [value]="e.nombre">{{ e.nombre }}</option>
              }
            </select>
          </div>

          <!-- Nivel Educativo -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Nivel educativo</label>
            <select [(ngModel)]="form.nivelEducativo" name="nivelEducativo"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium">
              <option value="">— Seleccionar —</option>
              @for (n of nivelesEducativos(); track n.id) {
                <option [value]="n.nombre">{{ n.nombre }}</option>
              }
            </select>
          </div>

          <!-- Ocupación -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Ocupación</label>
            <select [(ngModel)]="form.ocupacion" name="ocupacion"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium">
              <option value="">— Seleccionar —</option>
              @for (o of ocupaciones(); track o.id) {
                <option [value]="o.nombre">{{ o.nombre }}</option>
              }
            </select>
          </div>

          <!-- Teléfono -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Teléfono</label>
            <input [(ngModel)]="form.telefono" name="telefono" placeholder="Ej: 0414-5555555"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium text-sm"/>
          </div>

          <!-- Email -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Email</label>
            <input [(ngModel)]="form.email" name="email" type="email" placeholder="correo@ejemplo.com"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium text-sm"/>
          </div>

          <!-- Jefe de Familia -->
          <div class="sm:col-span-2 flex items-center gap-3 pt-2">
            <label class="flex items-center gap-3 cursor-pointer group">
              <input [(ngModel)]="form.jefeFamilia" name="jefeFamilia" type="checkbox"
                class="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-700 text-blue-600 cursor-pointer"/>
              <span class="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Es jefe/a de familia
              </span>
            </label>
          </div>

        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
          <button type="button" (click)="cancel()"
            class="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer">
            Cancelar
          </button>
          <button type="submit" [disabled]="saving()"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed text-sm">
            {{ saving() ? 'Guardando...' : 'Guardar Miembro' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: []
})
export class MiembroFormComponent implements OnInit {
  private svc    = inject(MiembrosService);
  private catSvc = inject(CatalogoService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private notify = inject(NotificationService);

  isEdit  = signal(false);
  saving  = signal(false);
  error   = signal('');

  parentescos       = signal<CatalogoItem[]>([]);
  estadosCiviles    = signal<CatalogoItem[]>([]);
  nivelesEducativos = signal<CatalogoItem[]>([]);
  ocupaciones       = signal<CatalogoItem[]>([]);

  form: Partial<Miembro> = { nombre: '', apellido: '', cedula: '', jefeFamilia: false };

  ngOnInit() {
    const familiaId = +this.route.snapshot.paramMap.get('familiaId')!;
    this.form.familiaId = familiaId;

    this.catSvc.getActive('parentescos').subscribe((r) => this.parentescos.set(r.data));
    this.catSvc.getActive('estados-civiles').subscribe((r) => this.estadosCiviles.set(r.data));
    this.catSvc.getActive('niveles-educativos').subscribe((r) => this.nivelesEducativos.set(r.data));
    this.catSvc.getActive('ocupaciones').subscribe((r) => this.ocupaciones.set(r.data));

    const miembroId = this.route.snapshot.paramMap.get('id');
    if (miembroId) {
      this.isEdit.set(true);
      this.svc.getById(+miembroId).subscribe((r) => {
        if (r.success) this.form = { ...r.data };
      });
    }
  }

  save() {
    this.saving.set(true);
    const miembroId = this.route.snapshot.paramMap.get('id');
    const familiaId = this.route.snapshot.paramMap.get('familiaId');
    const obs = miembroId ? this.svc.update(+miembroId, this.form) : this.svc.create(this.form);
    obs.subscribe({
      next: () => { this.saving.set(false); this.notify.success(miembroId ? 'Miembro actualizado' : 'Miembro creado', 'Los datos del miembro se han guardado.'); this.router.navigate(['/app/familias', familiaId]); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Error.'); this.saving.set(false); this.notify.error('Error', e?.error?.message ?? 'Error al guardar el miembro.'); },
    });
  }

  cancel() {
    const familiaId = this.route.snapshot.paramMap.get('familiaId');
    this.router.navigate(['/app/familias', familiaId]);
  }
}
