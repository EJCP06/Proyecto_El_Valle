import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { CatalogoService, CatalogoItem } from '../../core/services/catalogo.service';
import {
  LucideAngularModule,
  KeyRound,
  ShieldQuestion,
  Shield,
  User,
  Mail,
  Save,
  Plus,
  X,
  UserCog,
  Eye,
  EyeOff,
} from 'lucide-angular';

interface PreguntaRow {
  id: number | null;
  preguntaId: number | null;
  preguntaIdOriginal: number | null;
  respuesta: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  template: `
    <div class="flex flex-col flex-1 min-h-0 space-y-4 animate-in fade-in duration-300">
      <!-- Page Header -->
      <header>
        <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Mi Perfil</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 font-normal">Administra los datos de tu cuenta, tu contraseña y tus preguntas de seguridad.</p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Datos de la cuenta -->
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <lucide-icon [name]="UserCog" class="w-4 h-4 text-white"></lucide-icon>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Datos de la cuenta</h3>
              <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Información registrada de tu usuario.</p>
            </div>
          </div>
            <div class="space-y-3">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Nombre completo</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <lucide-icon [name]="User" [size]="16" class="text-slate-400"></lucide-icon>
                  </div>
                  <input [(ngModel)]="cuentaForm.nombre" name="cuentaNombre" type="text" autocomplete="name" placeholder="Tu nombre..."
                    class="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"/>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Correo electrónico</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <lucide-icon [name]="Mail" [size]="16" class="text-slate-400"></lucide-icon>
                  </div>
                  <input [(ngModel)]="cuentaForm.email" name="cuentaEmail" type="email" autocomplete="email" placeholder="tu@correo.com"
                    class="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"/>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Rol del sistema</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <lucide-icon [name]="Shield" [size]="16" class="text-slate-400"></lucide-icon>
                  </div>
                  <div class="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-normal capitalize flex items-center">
                    <span class="truncate">{{ user()?.rol === 'admin' ? 'Administrador' : 'Vocero' }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <button type="button" (click)="resetCuenta()" class="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer">Cancelar</button>
                <button type="button" (click)="guardarCuenta()" [disabled]="cuentaSaving()" class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed text-sm">
                  @if (!cuentaSaving()) {
                    <lucide-icon [name]="Save" class="w-4 h-4"></lucide-icon>
                    <span>Guardar cambios</span>
                  } @else {
                    <div class="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-[800ms]">
                      <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span class="animate-pulse">Guardando...</span>
                    </div>
                  }
                </button>
              </div>
            </div>
          </div>

          <!-- Cambiar contraseña -->
          <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm p-4">
            <div class="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <lucide-icon [name]="KeyRound" class="w-4 h-4 text-white"></lucide-icon>
                </div>
                <div class="min-w-0">
                  <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Cambiar contraseña</h3>
                  <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.</p>
                </div>
              </div>
            </div>

            <form id="formCambiarPassword" (ngSubmit)="cambiarContrasena()" class="space-y-3">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Contraseña actual <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input [(ngModel)]="passForm.currentPassword" name="currentPassword" [type]="showCurrentPassword() ? 'text' : 'password'" autocomplete="current-password" placeholder="••••••••"
                    class="w-full pl-5 pr-12 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"/>
                  <button type="button" (click)="showCurrentPassword.update(v => !v)" aria-label="Mostrar u ocultar contraseña" class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                    <lucide-icon [name]="showCurrentPassword() ? EyeOff : Eye" class="w-4 h-4"></lucide-icon>
                  </button>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Nueva contraseña <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input [(ngModel)]="passForm.newPassword" name="newPassword" [type]="showNewPassword() ? 'text' : 'password'" autocomplete="new-password" placeholder="••••••••"
                    class="w-full pl-5 pr-12 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"/>
                  <button type="button" (click)="showNewPassword.update(v => !v)" aria-label="Mostrar u ocultar contraseña" class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                    <lucide-icon [name]="showNewPassword() ? EyeOff : Eye" class="w-4 h-4"></lucide-icon>
                  </button>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Confirmar nueva contraseña <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input [(ngModel)]="passForm.confirmPassword" name="confirmPassword" [type]="showConfirmPassword() ? 'text' : 'password'" autocomplete="new-password" placeholder="••••••••"
                    class="w-full pl-5 pr-12 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"/>
                  <button type="button" (click)="showConfirmPassword.update(v => !v)" aria-label="Mostrar u ocultar contraseña" class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                    <lucide-icon [name]="showConfirmPassword() ? EyeOff : Eye" class="w-4 h-4"></lucide-icon>
                  </button>
                </div>
              </div>
              <div class="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <button type="button" (click)="resetContrasena()" class="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer">Cancelar</button>
                <button type="submit" [disabled]="passSaving()" class="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed text-sm">
                  @if (!passSaving()) {
                    <lucide-icon [name]="Save" class="w-4 h-4"></lucide-icon>
                    <span>Actualizar contraseña</span>
                  } @else {
                    <div class="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-[800ms]">
                      <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span class="animate-pulse">Guardando...</span>
                    </div>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Preguntas de seguridad (ancho completo) -->
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm p-4 flex flex-col card-grow">
          <div class="flex items-center justify-between gap-3 mb-3 flex-wrap shrink-0">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <lucide-icon [name]="ShieldQuestion" class="w-4 h-4 text-white"></lucide-icon>
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Preguntas de seguridad</h3>
                <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Úsalas para recuperar tu contraseña. Puedes modificarlas o eliminarlas cuando quieras.</p>
              </div>
            </div>
            @if (!qLoading() && preguntas.length < 3) {
              <button type="button" (click)="addPregunta()" class="hidden md:inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-all cursor-pointer text-xs font-bold shrink-0">
                <lucide-icon [name]="Plus" class="w-4 h-4"></lucide-icon>
                Agregar pregunta
              </button>
            }
          </div>

          @if (qLoading()) {
            <div class="flex flex-1 flex-col items-center justify-center py-12">
              <div class="w-8 h-8 border-[3px] border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
              <span class="text-sm text-slate-500 dark:text-slate-400 mt-4 font-semibold animate-pulse">Cargando preguntas...</span>
            </div>
          } @else {
            @if (qError()) {
              <div class="mb-4 flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl p-4 text-sm font-normal">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
                </svg>
                <span>{{ qError() }}</span>
              </div>
            }

            <div class="fill-area">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-auto">
              @for (row of preguntas; track $index; let i = $index) {
                <div class="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-3 relative">
                  <button type="button" (click)="removePregunta(i)" title="Eliminar pregunta" class="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all cursor-pointer">
                    <lucide-icon [name]="X" class="w-4 h-4"></lucide-icon>
                  </button>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Pregunta {{ i + 1 }}</label>
                    <select [(ngModel)]="row.preguntaId" [name]="'pq' + i"
                      class="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-sm pr-10">
                      <option [ngValue]="null">— Seleccionar —</option>
                      @for (q of preguntasDisponibles(i); track q.id) {
                        <option [ngValue]="q.id">{{ q.nombre }}</option>
                      }
                    </select>
                  </div>
                  <div class="space-y-2 mb-3">
                    <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Respuesta</label>
                    <input [(ngModel)]="row.respuesta" [name]="'pqr' + i" type="text" autocomplete="off" [placeholder]="row.id ? 'Nueva respuesta (opcional)' : 'Tu respuesta...'"
                      class="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-sm"/>
                  </div>
                </div>
              } @empty {
                <div class="flex flex-col items-center justify-center gap-3 py-6 text-center">
                  <lucide-icon [name]="ShieldQuestion" class="text-4xl text-slate-300 dark:text-slate-600"></lucide-icon>
                  <span class="text-sm text-slate-400 dark:text-slate-500 font-normal">No tienes preguntas de seguridad registradas.<br>Agrega al menos una para poder recuperar tu contraseña.</span>
                </div>
              }
            </div>

            @if (!qLoading() && preguntas.length < 3) {
              <div class="flex md:hidden justify-center mt-5">
                <button type="button" (click)="addPregunta()" class="inline-flex items-center gap-2 px-6 py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-all cursor-pointer text-sm font-bold">
                  <lucide-icon [name]="Plus" class="w-4 h-4"></lucide-icon>
                  Agregar pregunta
                </button>
              </div>
            }
            </div>

            <div class="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 shrink-0">
              <button type="button" (click)="loadMisPreguntas()" class="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer">Cancelar</button>
              <button type="button" (click)="guardarPreguntas()" [disabled]="qSaving()" class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed text-sm">
                @if (!qSaving()) {
                  <lucide-icon [name]="Save" class="w-4 h-4"></lucide-icon>
                  <span>Guardar preguntas</span>
                } @else {
                  <div class="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-[800ms]">
                    <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span class="animate-pulse">Guardando...</span>
                  </div>
                }
              </button>
            </div>
          }
        </div>
    </div>
  `,
  styles: [`
    @media (min-width: 768px) {
      :host {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-height: 0;
      }
      .card-grow {
        flex: 1 1 auto;
      }
      .fill-area {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }
    }
  `],
})
export class PerfilComponent implements OnInit {
  readonly KeyRound = KeyRound;
  readonly ShieldQuestion = ShieldQuestion;
  readonly Shield = Shield;
  readonly User = User;
  readonly Mail = Mail;
  readonly Save = Save;
  readonly Plus = Plus;
  readonly X = X;
  readonly UserCog = UserCog;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;

  private authSvc = inject(AuthService);
  private notify = inject(NotificationService);
  private catSvc = inject(CatalogoService);

  user = this.authSvc.currentUser;

  cuentaForm = { nombre: '', email: '' };
  cuentaSaving = signal(false);

  passForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  passSaving = signal(false);
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  preguntasCatalogo = signal<CatalogoItem[]>([]);
  preguntas: PreguntaRow[] = [];
  qLoading = signal(true);
  qSaving = signal(false);
  qError = signal('');

  ngOnInit() {
    const u = this.user();
    if (u) {
      this.cuentaForm = { nombre: u.nombre, email: u.email };
    }
    this.catSvc.getActive('preguntas-seguridad').subscribe({
      next: (r) => this.preguntasCatalogo.set(r.data),
    });
    this.loadMisPreguntas();
  }

  resetCuenta() {
    const u = this.user();
    if (u) {
      this.cuentaForm = { nombre: u.nombre, email: u.email };
    }
  }

  guardarCuenta() {
    const nombre = this.cuentaForm.nombre.trim();
    const email = this.cuentaForm.email.trim();

    if (!nombre) {
      this.notify.errorToast('Nombre requerido', 'El nombre completo no puede estar vacío.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.notify.errorToast('Correo inválido', 'Ingresa un correo electrónico válido.');
      return;
    }

    this.cuentaSaving.set(true);
    this.authSvc.updateProfile(nombre, email).subscribe({
      next: () => {
        this.cuentaSaving.set(false);
        this.cuentaForm = { nombre, email };
        this.notify.success('Perfil actualizado', 'Tus datos de cuenta se guardaron correctamente.');
      },
      error: (e) => {
        this.cuentaSaving.set(false);
        this.notify.errorToast('Error', e?.error?.message ?? 'No se pudo actualizar el perfil.');
      },
    });
  }

  loadMisPreguntas() {
    this.qLoading.set(true);
    this.qError.set('');
    this.authSvc.getMisPreguntas().subscribe({
      next: (r) => {
        const data: { id?: number; pregunta_id: number | null; pregunta: string }[] = r.data ?? [];
        // La respuesta viene encriptada en el backend: se deja vacía.
        this.preguntas = data.map((p) => ({
          id: p.id ?? null,
          preguntaId: p.pregunta_id,
          preguntaIdOriginal: p.pregunta_id,
          respuesta: '',
        }));
        this.qLoading.set(false);
      },
      error: () => {
        this.qLoading.set(false);
        this.qError.set('No se pudieron cargar tus preguntas de seguridad.');
      },
    });
  }

  preguntasDisponibles(index: number): CatalogoItem[] {
    const seleccionadas = new Set(
      this.preguntas.map((p, i) => (i === index ? null : p.preguntaId)).filter((id): id is number => id != null),
    );
    return this.preguntasCatalogo().filter((q) => !seleccionadas.has(q.id));
  }

  addPregunta() {
    if (this.preguntas.length < 3) {
      this.preguntas.push({ id: null, preguntaId: null, preguntaIdOriginal: null, respuesta: '' });
    }
  }

  removePregunta(index: number) {
    this.preguntas.splice(index, 1);
    this.qError.set('');
  }

  private validarPassword(pw: string): string[] {
    const errors: string[] = [];
    if (pw.length < 8) errors.push('Mínimo 8 caracteres');
    if (!/[A-Z]/.test(pw)) errors.push('Al menos 1 letra mayúscula');
    if (!/[a-z]/.test(pw)) errors.push('Al menos 1 letra minúscula');
    if (!/[0-9]/.test(pw)) errors.push('Al menos 1 número');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) errors.push('Al menos 1 carácter especial');
    return errors;
  }

  resetContrasena() {
    this.passForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  }

  cambiarContrasena() {
    const { currentPassword, newPassword, confirmPassword } = this.passForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.notify.warning('Completa todos los campos');
      return;
    }
    if (newPassword !== confirmPassword) {
      this.notify.errorToast('Las contraseñas no coinciden', 'La nueva contraseña y su confirmación deben ser iguales.');
      return;
    }
    if (newPassword === currentPassword) {
      this.notify.warning('Contraseña repetida', 'La nueva contraseña debe ser diferente a la actual.');
      return;
    }
    const errores = this.validarPassword(newPassword);
    if (errores.length > 0) {
      this.notify.errorToast('Contraseña no válida', `La contraseña no cumple los requisitos: ${errores.join(', ')}.`);
      return;
    }

    this.passSaving.set(true);
    this.authSvc.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.passSaving.set(false);
        this.passForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.notify.success('Contraseña actualizada', 'Tu contraseña se cambió correctamente.');
      },
      error: (e) => {
        this.passSaving.set(false);
        this.notify.errorToast('Error', e?.error?.message ?? 'No se pudo actualizar la contraseña.');
      },
    });
  }

  guardarPreguntas() {
    this.qError.set('');

    const filas = this.preguntas.filter((p) => p.preguntaId != null || p.respuesta.trim() !== '');
    // Una fila necesita respuesta cuando: es nueva (sin id), el usuario escribió una,
    // o se cambió la pregunta seleccionada. Las filas existentes sin cambios y con
    // respuesta vacía se conservan tal cual (siguen encriptadas).
    const incompletas = filas.some((p) => {
      if (p.preguntaId == null) return true;
      if (p.id == null && p.respuesta.trim() === '') return true;
      if (p.preguntaIdOriginal != null && p.preguntaId !== p.preguntaIdOriginal && p.respuesta.trim() === '') return true;
      return false;
    });
    if (incompletas) {
      this.qError.set('Cada pregunta nueva o con nueva respuesta debe tener una pregunta seleccionada y su respuesta escrita.');
      return;
    }
    const payload = filas.map((p) => ({
      id: p.id,
      preguntaId: p.preguntaId!,
      respuesta: p.respuesta.trim(),
    }));

    this.qSaving.set(true);
    this.authSvc.updateMisPreguntas(payload).subscribe({
      next: () => {
        this.qSaving.set(false);
        this.notify.success(
          payload.length > 0 ? 'Preguntas guardadas' : 'Preguntas eliminadas',
          payload.length > 0 ? 'Tus preguntas de seguridad se actualizaron correctamente.' : 'Se eliminaron todas tus preguntas de seguridad.',
        );
        this.loadMisPreguntas();
      },
      error: (e) => {
        this.qSaving.set(false);
        this.qError.set(e?.error?.message ?? 'No se pudieron guardar las preguntas de seguridad.');
      },
    });
  }
}
