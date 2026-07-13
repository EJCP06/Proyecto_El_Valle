import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  LucideAngularModule,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Sun,
  Moon,
  LogIn,
  ShieldCheck,
  AlertCircle
} from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-[100dvh] w-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      <!-- Decorative background elements -->
      <div class="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[120px] animate-pulse"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <!-- Theme Toggle (Desktop/Mobile top right) -->
      <div class="absolute top-6 right-6 z-50 flex items-center gap-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
        <lucide-icon [name]="Sun" class="w-4 h-4 text-amber-500"></lucide-icon>
        
        <label class="relative inline-flex items-center cursor-pointer group">
          <input id="theme-toggle" type="checkbox" [checked]="themeService.isDark()" (change)="toggleDarkMode()" class="sr-only peer" />
          <div class="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer-checked:bg-blue-600 peer-focus:outline-none after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 peer-checked:after:translate-x-4 after:transition-all after:duration-300 transition-all duration-300 shadow-inner"></div>
        </label>

        <lucide-icon [name]="Moon" class="w-4 h-4 text-slate-400 dark:text-blue-400"></lucide-icon>
      </div>

      <div class="w-full max-w-5xl flex flex-col lg:flex-row rounded-[24px] md:rounded-[36px] overflow-hidden shadow-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 relative z-10 backdrop-blur-xl transition-all duration-300">
        
        <!-- Left Panel: Branding & Info -->
        <div class="hidden lg:flex lg:w-[45%] flex-col justify-between p-14 bg-gradient-to-tr from-blue-700 to-indigo-800 text-white relative overflow-hidden">
          <!-- Dot grid pattern -->
          <div class="absolute inset-0 opacity-10">
            <div class="absolute top-0 left-0 w-full h-full" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 24px 24px;"></div>
          </div>
          
          <div class="relative z-10 flex flex-col h-full justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/20 text-2xl font-bold">
                🏘️
              </div>
              <div>
                <h3 class="text-sm font-black tracking-tight leading-none uppercase">Consejo Comunal</h3>
                <span class="text-[10px] font-semibold text-blue-200 tracking-wider">EL VALLE</span>
              </div>
            </div>

            <div class="my-auto py-12">
              <h1 class="text-4xl lg:text-5xl font-black leading-tight tracking-tight mb-6">
                Gestión Comunal <br/>
                <span class="text-blue-300">Digital</span>
              </h1>
              <p class="text-blue-100 text-sm leading-relaxed font-normal opacity-90 max-w-sm">
                Controla censos, asocia familias, gestiona miembros y responde formularios comunales de forma ágil y centralizada.
              </p>
            </div>

            <div class="flex items-center gap-2 text-xs text-blue-200 font-semibold">
              <lucide-icon [name]="ShieldCheck" class="w-4 h-4"></lucide-icon>
              <span>Acceso Seguro</span>
              <span>•</span>
              <span>v2.0</span>
            </div>
          </div>
        </div>

        <!-- Right Panel: Login Form -->
        <div class="w-full lg:w-[55%] p-8 md:p-12 lg:p-20 flex flex-col justify-center bg-white dark:bg-transparent transition-all">
          <div class="max-w-md mx-auto w-full">
            
            <!-- Welcome Header -->
            <div class="mb-10 text-center lg:text-left">
              <!-- Mobile view header branding -->
              <div class="flex lg:hidden items-center justify-center gap-3 mb-6">
                <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg text-lg font-bold">
                  🏘️
                </div>
                <div class="text-left">
                  <h3 class="text-sm font-black tracking-tight leading-none uppercase text-slate-800 dark:text-white">Consejo Comunal</h3>
                  <span class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider">EL VALLE</span>
                </div>
              </div>

              <h2 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Bienvenido</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 font-normal">Ingresa tus credenciales para acceder al sistema</p>
            </div>

            <!-- Error message banner -->
            @if (error()) {
              <div class="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl p-4 mb-6 text-sm font-normal animate-in fade-in duration-300">
                <lucide-icon [name]="AlertCircle" class="w-5 h-5 shrink-0"></lucide-icon>
                <span>{{ error() }}</span>
              </div>
            }

            <!-- Form -->
            <form (ngSubmit)="onSubmit()" class="space-y-6">
              
              <!-- Email Field -->
              <div class="space-y-2">
                <label for="email" class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Correo electrónico</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 transition-colors">
                    <lucide-icon [name]="Mail" class="w-5 h-5"></lucide-icon>
                  </div>
                  <input
                    id="email"
                    type="email"
                    [(ngModel)]="email"
                    name="email"
                    placeholder="admin@elvalle.com"
                    required
                    autocomplete="email"
                    class="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"
                  />
                </div>
              </div>

              <!-- Password Field -->
              <div class="space-y-2">
                <label for="password" class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Contraseña</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 transition-colors">
                    <lucide-icon [name]="Lock" class="w-5 h-5"></lucide-icon>
                  </div>
                  <input
                    id="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    [(ngModel)]="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    autocomplete="current-password"
                    class="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"
                  />
                  <!-- Toggle password button -->
                  <button type="button" (click)="togglePasswordVisibility()" class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                    <lucide-icon [name]="showPassword() ? EyeOff : Eye" class="w-5 h-5"></lucide-icon>
                  </button>
                </div>
              </div>

              <!-- Submit button -->
              <div class="pt-2">
                <button
                  id="submit-login"
                  type="submit"
                  [disabled]="loading()"
                  class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 dark:shadow-none hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3 text-sm uppercase tracking-widest cursor-pointer disabled:cursor-not-allowed"
                >
                  @if (!loading()) {
                    <span class="flex items-center gap-2">
                      Iniciar Sesión
                      <lucide-icon [name]="LogIn" class="w-5 h-5"></lucide-icon>
                    </span>
                  } @else {
                    <div class="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-[800ms]">
                      <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span class="animate-pulse">Ingresando...</span>
                    </div>
                  }
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);
  themeService = inject(ThemeService);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  showPassword = signal(false);

  // Expose icons
  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly LogIn = LogIn;
  readonly ShieldCheck = ShieldCheck;
  readonly AlertCircle = AlertCircle;

  toggleDarkMode() {
    this.themeService.toggle();
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.error.set('Completa todos los campos.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        if (res.success) {
          // Wait 2000ms to show the loading animation
          setTimeout(() => {
            this.loading.set(false);
            this.notify.success(`¡Bienvenido, ${res.data.user.nombre}!`);
            this.router.navigate(['/app/dashboard']);
          }, 2000);
        } else {
          this.loading.set(false);
          this.notify.error('Error de inicio de sesión', res.message ?? 'Credenciales inválidas.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error('Error de inicio de sesión', err?.error?.message ?? 'Credenciales incorrectas.');
      },
    });
  }
}

