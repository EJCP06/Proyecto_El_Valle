import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CatalogoService, CatalogoItem, CatalogoNombre } from '../../core/services/catalogo.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, HelpCircle, Plus, Trash2 } from 'lucide-angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [FormsModule, CommonModule, LucideAngularModule],
  template: `
    <div class="animate-in fade-in duration-300">
      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{{ tituloSeccion() }}</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 font-normal">{{ subtituloSeccion() }}</p>
      </div>

      <!-- Preguntas de Seguridad -->
      @if (seccion() === 'preguntas') {
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Preguntas de Seguridad</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Configura tus 3 preguntas de seguridad para recuperar tu contraseña.</p>
            </div>
            @if (preguntasSeguridad().length < 3) {
              <button (click)="mostrarFormPregunta()" class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition-all text-xs cursor-pointer">
                <lucide-icon [name]="Plus" class="w-4 h-4"></lucide-icon>
                Agregar
              </button>
            }
          </div>
          @if (loadingPreguntas()) {
            <div class="flex flex-col items-center justify-center py-12">
              <div class="w-8 h-8 border-[3px] border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          } @else {
            @if (showFormPregunta()) {
              <div class="mb-6 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl space-y-3">
                <input [(ngModel)]="nuevaPregunta.pregunta" name="nuevaPregunta" placeholder="Ejemplo: ¿Cuál es el nombre de tu primera mascota?" class="w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-normal text-sm" />
                <input [(ngModel)]="nuevaPregunta.respuesta" name="nuevaRespuesta" placeholder="Tu respuesta (se guardará en minúsculas)" class="w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-normal text-sm" />
                <div class="flex items-center gap-2">
                  <button (click)="guardarPregunta()" [disabled]="guardandoPregunta()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-xs cursor-pointer">
                    {{ guardandoPregunta() ? 'Guardando...' : 'Guardar' }}
                  </button>
                  <button (click)="cancelarFormPregunta()" class="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all text-xs cursor-pointer">Cancelar</button>
                </div>
              </div>
            }
            <div class="space-y-3">
              @for (pregunta of preguntasSeguridad(); track pregunta.id) {
                <div class="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                  <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
                    <lucide-icon [name]="HelpCircle" class="w-5 h-5 text-amber-600 dark:text-amber-400"></lucide-icon>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-slate-800 dark:text-white truncate">{{ pregunta.pregunta }}</p>
                  </div>
                  <button (click)="eliminarPregunta(pregunta)" class="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors cursor-pointer shrink-0">
                    <lucide-icon [name]="Trash2" class="w-4 h-4"></lucide-icon>
                  </button>
                </div>
              } @empty {
                <div class="text-center py-8">
                  <lucide-icon [name]="HelpCircle" class="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3"></lucide-icon>
                  <p class="text-sm text-slate-400 dark:text-slate-500 font-normal">No tienes preguntas de seguridad configuradas.</p>
                  <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Agrega 3 preguntas para poder recuperar tu contraseña.</p>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Catálogos -->
      @if (isCatalogo()) {
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">{{ tituloCatalogo() }}</h3>
            <button (click)="addItem()" class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition-all text-xs cursor-pointer">
              <lucide-icon [name]="Plus" class="w-4 h-4"></lucide-icon>
              Agregar
            </button>
          </div>
          @if (loadingCatalogo()) {
            <div class="flex flex-col items-center justify-center py-12">
              <div class="w-8 h-8 border-[3px] border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          } @else {
            @if (showForm()) {
              <div class="flex items-center gap-3 mb-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                <input #newInput [(ngModel)]="newNombre" name="newNombre" placeholder="Nombre del nuevo elemento" class="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-normal text-sm" (keyup.enter)="saveNew()" />
                <button (click)="saveNew()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all text-xs cursor-pointer">Guardar</button>
                <button (click)="cancelNew()" class="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all text-xs cursor-pointer">Cancelar</button>
              </div>
            }
            <div class="overflow-x-auto">
              <table class="w-full min-w-[600px] text-left border-collapse">
                <thead>
                  <tr class="bg-slate-50/75 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th class="px-4 py-3">#</th>
                    <th class="px-4 py-3">Nombre</th>
                    <th class="px-4 py-3">Estado</th>
                    <th class="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                  @for (item of catalogoItems(); track item.id) {
                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td class="px-4 py-3 text-xs text-slate-400 font-mono">{{ item.id }}</td>
                      <td class="px-4 py-3 text-sm font-bold text-slate-800 dark:text-white">{{ item.nombre }}</td>
                      <td class="px-4 py-3">
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold" [class]="item.activo ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'">
                          {{ item.activo ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-right">
                        <div class="inline-flex items-center gap-2">
                          <button (click)="toggleActivo(item)" class="text-xs font-bold text-slate-600 dark:text-slate-400 hover:underline cursor-pointer">
                            {{ item.activo ? 'Desactivar' : 'Activar' }}
                          </button>
                          <button (click)="deleteItem(item)" class="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4" class="px-4 py-10 text-center text-sm text-slate-400 dark:text-slate-500 font-normal">No hay elementos en este catálogo.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: []
})
export class ConfiguracionComponent implements OnInit, OnDestroy {
  private catSvc = inject(CatalogoService);
  private notify = inject(NotificationService);
  private authSvc = inject(AuthService);
  private route = inject(ActivatedRoute);

  private sub?: Subscription;

  seccion = signal('general');

  readonly HelpCircle = HelpCircle;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;

  catalogoItems = signal<CatalogoItem[]>([]);
  loadingCatalogo = signal(false);
  showForm = signal(false);
  newNombre = '';

  preguntasSeguridad = signal<{ id: number; pregunta: string }[]>([]);
  loadingPreguntas = signal(false);
  showFormPregunta = signal(false);
  guardandoPregunta = signal(false);
  nuevaPregunta = { pregunta: '', respuesta: '' };

  tituloSeccion(): string {
    const map: Record<string, string> = {
      preguntas: 'Preguntas de Seguridad',
      parentescos: 'Parentescos',
      'estados-civiles': 'Estados Civiles',
      'niveles-educativos': 'Niveles Educativos',
      ocupaciones: 'Ocupaciones',
      'tipos-vivienda': 'Tipos de Vivienda',
      'tipos-discapacidad': 'Tipos de Discapacidad',
    };
    return map[this.seccion()] || 'Configuración';
  }

  subtituloSeccion(): string {
    const map: Record<string, string> = {
      preguntas: 'Configura tus preguntas de seguridad para recuperar tu contraseña.',
    };
    return map[this.seccion()] || 'Administra los catálogos del sistema.';
  }

  isCatalogo(): boolean {
    const id = this.seccion();
    return id !== 'general' && id !== 'preguntas';
  }

  tituloCatalogo(): string {
    const map: Record<string, string> = {
      parentescos: 'Parentescos',
      'estados-civiles': 'Estados Civiles',
      'niveles-educativos': 'Niveles Educativos',
      ocupaciones: 'Ocupaciones',
      'tipos-vivienda': 'Tipos de Vivienda',
      'tipos-discapacidad': 'Tipos de Discapacidad',
    };
    return map[this.seccion()] || '';
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.seccion.set(params['seccion'] || 'preguntas');
      this.cargarSeccion();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  cargarSeccion() {
    const sec = this.seccion();
    if (sec === 'preguntas') {
      this.loadPreguntas();
    } else if (this.isCatalogo()) {
      this.loadCatalogo();
    }
  }

  loadCatalogo() {
    if (!this.isCatalogo()) return;
    const catalogo = this.seccion() as CatalogoNombre;
    this.loadingCatalogo.set(true);
    this.catSvc.getAll(catalogo).subscribe({
      next: (r) => { this.catalogoItems.set(r.data); this.loadingCatalogo.set(false); },
      error: () => this.loadingCatalogo.set(false),
    });
  }

  addItem() {
    this.showForm.set(true);
    this.newNombre = '';
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>('[name="newNombre"]');
      el?.focus();
    }, 50);
  }

  cancelNew() {
    this.showForm.set(false);
    this.newNombre = '';
  }

  saveNew() {
    if (!this.newNombre.trim()) return;
    this.catSvc.create(this.seccion() as CatalogoNombre, this.newNombre.trim()).subscribe({
      next: () => {
        this.notify.success('Elemento agregado');
        this.showForm.set(false);
        this.newNombre = '';
        this.loadCatalogo();
      },
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al guardar.'),
    });
  }

  async toggleActivo(item: CatalogoItem) {
    const confirmed = await this.notify.confirm(
      item.activo ? '¿Desactivar elemento?' : '¿Activar elemento?',
      `Se cambiará el estado de "${item.nombre}".`
    );
    if (!confirmed) return;
    this.catSvc.update(this.seccion() as CatalogoNombre, item.id, { activo: !item.activo }).subscribe({
      next: () => { this.notify.success('Estado actualizado'); this.loadCatalogo(); },
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al actualizar.'),
    });
  }

  async deleteItem(item: CatalogoItem) {
    const confirmed = await this.notify.confirm('¿Eliminar elemento?', `Se eliminará "${item.nombre}" de forma permanente.`);
    if (!confirmed) return;
    this.catSvc.delete(this.seccion() as CatalogoNombre, item.id).subscribe({
      next: () => { this.notify.success('Elemento eliminado'); this.loadCatalogo(); },
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al eliminar.'),
    });
  }

  loadPreguntas() {
    const user = this.authSvc.currentUser();
    if (!user) return;
    this.loadingPreguntas.set(true);
    this.authSvc.getPreguntasByUsuario(user.id).subscribe({
      next: (r) => { this.preguntasSeguridad.set(r.data); this.loadingPreguntas.set(false); },
      error: () => { this.preguntasSeguridad.set([]); this.loadingPreguntas.set(false); },
    });
  }

  mostrarFormPregunta() {
    this.nuevaPregunta = { pregunta: '', respuesta: '' };
    this.showFormPregunta.set(true);
  }

  cancelarFormPregunta() {
    this.showFormPregunta.set(false);
    this.nuevaPregunta = { pregunta: '', respuesta: '' };
  }

  guardarPregunta() {
    if (!this.nuevaPregunta.pregunta.trim() || !this.nuevaPregunta.respuesta.trim()) {
      this.notify.warning('Campos requeridos', 'Ingresa la pregunta y la respuesta.');
      return;
    }
    const user = this.authSvc.currentUser();
    if (!user) return;
    this.guardandoPregunta.set(true);
    this.authSvc.crearPregunta(user.id, this.nuevaPregunta.pregunta.trim(), this.nuevaPregunta.respuesta.trim()).subscribe({
      next: () => {
        this.notify.success('Pregunta agregada', 'Tu pregunta de seguridad ha sido guardada.');
        this.showFormPregunta.set(false);
        this.nuevaPregunta = { pregunta: '', respuesta: '' };
        this.guardandoPregunta.set(false);
        this.loadPreguntas();
      },
      error: (e) => {
        this.notify.error('Error', e?.error?.message ?? 'Error al guardar la pregunta.');
        this.guardandoPregunta.set(false);
      },
    });
  }

  async eliminarPregunta(pregunta: { id: number; pregunta: string }) {
    const confirmed = await this.notify.confirm('¿Eliminar pregunta?', `Se eliminará "${pregunta.pregunta}" de forma permanente.`);
    if (!confirmed) return;
    this.authSvc.eliminarPregunta(pregunta.id).subscribe({
      next: () => { this.notify.success('Pregunta eliminada'); this.loadPreguntas(); },
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al eliminar.'),
    });
  }
}
