import { Component, inject, signal, OnDestroy } from '@angular/core';
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
  AlertCircle,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  Shield,
  Clock,
  CheckCircle2,
  HelpCircle
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

            @if (!mostrarRecuperacion()) {
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

                <!-- Forgot password link -->
                <div class="text-center">
                  <button type="button" (click)="toggleRecuperacion()" (mouseenter)="forgotHover = true" (mouseleave)="forgotHover = false" [style.color]="forgotHover ? '#2563eb' : ''" [style.textDecoration]="forgotHover ? 'underline' : 'none'" class="text-xs font-bold text-slate-400 uppercase tracking-[2px] cursor-pointer">
                    ¿Olvidó la contraseña?
                  </button>
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
            } @else {
              <!-- Recuperación de Contraseña -->
              <div class="space-y-6">
                <div class="relative flex items-center justify-center mb-6">
                  <button type="button" (click)="volverAtras()" class="absolute left-0 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
                    <lucide-icon [name]="ArrowLeft" class="w-6 h-6 text-slate-500 dark:text-slate-400"></lucide-icon>
                  </button>
                  <div class="text-center">
                    <h3 class="text-lg font-black text-slate-900 dark:text-white tracking-tight">Recuperar Contraseña</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-normal">{{ tituloRecuperacion }}</p>
                  </div>
                </div>

                <!-- ===================== SELECCIÓN DE MÉTODO ===================== -->
                @if (!metodoRecuperacion()) {
                  <div class="space-y-3">
                    <p class="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">Elige cómo deseas recuperar tu contraseña</p>

                    <!-- Opción: Correo electrónico -->
                    <button (click)="seleccionarMetodo('correo')" class="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all group cursor-pointer text-left">
                      <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
                        <lucide-icon [name]="Mail" class="w-6 h-6 text-blue-600 dark:text-blue-400"></lucide-icon>
                      </div>
                      <div class="flex-1">
                        <p class="text-sm font-bold text-slate-800 dark:text-white">Correo electrónico</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400">Recibe un código de verificación en tu correo</p>
                      </div>
                    </button>

                    <!-- Opción: Preguntas de seguridad -->
                    <button (click)="seleccionarMetodo('preguntas')" class="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all group cursor-pointer text-left">
                      <div class="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-800/40 transition-colors">
                        <lucide-icon [name]="HelpCircle" class="w-6 h-6 text-amber-600 dark:text-amber-400"></lucide-icon>
                      </div>
                      <div class="flex-1">
                        <p class="text-sm font-bold text-slate-800 dark:text-white">Preguntas de seguridad</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400">Responde tus preguntas personales de seguridad</p>
                      </div>
                    </button>


                  </div>
                }

                <!-- ===================== FLUJO POR CORREO ===================== -->
                @if (metodoRecuperacion() === 'correo') {
                  <!-- Step indicator -->
                  <div class="flex justify-center mb-4" style="gap: 8px;">
                    <div style="width: 32px; height: 6px; border-radius: 9999px; transition: background-color 0.3s; background-color: {{ paso >= 1 ? '#2563eb' : '#e2e8f0' }}"></div>
                    <div style="width: 32px; height: 6px; border-radius: 9999px; transition: background-color 0.3s; background-color: {{ paso >= 2 ? '#2563eb' : '#e2e8f0' }}"></div>
                    <div style="width: 32px; height: 6px; border-radius: 9999px; transition: background-color 0.3s; background-color: {{ paso >= 3 ? '#2563eb' : '#e2e8f0' }}"></div>
                  </div>

                  <!-- PASO 1: Correo -->
                  @if (paso === 1) {
                    <div class="space-y-4">
                      <div class="space-y-2">
                        <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Correo</label>
                        <div class="relative group">
                          <div class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 transition-colors">
                            <lucide-icon [name]="Mail" class="w-5 h-5"></lucide-icon>
                          </div>
                          <input type="email" [(ngModel)]="recuperacionEmail" name="recuperacionEmail" placeholder="Ej: correo@ejemplo.com" class="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal" />
                        </div>
                      </div>
                      <button (click)="solicitarCodigo()" [disabled]="cargandoReset()" class="!mt-8 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-transform flex items-center justify-center gap-3 text-sm uppercase tracking-widest cursor-pointer disabled:cursor-not-allowed">
                        @if (!cargandoReset()) {
                          <span class="flex items-center gap-2">
                            Enviar Código
                            <lucide-icon [name]="Mail" class="w-5 h-5"></lucide-icon>
                          </span>
                        } @else {
                          <div class="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-[800ms]">
                            <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span class="animate-pulse">Enviando...</span>
                          </div>
                        }
                      </button>
                    </div>
                  }

                  <!-- PASO 2: Código OTP -->
                  @if (paso === 2) {
                    <div class="space-y-4">
                      <div class="text-center mb-4">
                        <p class="text-xs text-slate-500 dark:text-slate-400 font-normal">Enviamos un código a <strong class="text-slate-700 dark:text-slate-300">{{ recuperacionEmail }}</strong></p>
                      </div>
                      <div class="space-y-2">
                        <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Código de verificación</label>
                        <div class="relative group">
                          <div class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 transition-colors">
                            <lucide-icon [name]="Shield" class="w-5 h-5"></lucide-icon>
                          </div>
                          <input type="text" [(ngModel)]="recuperacionCodigo" name="recuperacionCodigo" (keypress)="soloNumeros($event)" maxlength="6" placeholder="000000" class="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-center text-2xl tracking-[8px]" />
                        </div>
                      </div>
                      <div class="flex items-center justify-center gap-2 text-sm">
                        <lucide-icon [name]="Clock" class="w-4 h-4" [class]="tiempoAgotado ? 'text-red-500' : 'text-amber-500'"></lucide-icon>
                        <span class="font-bold" [class]="tiempoAgotado ? 'text-red-500' : 'text-amber-500'">
                          {{ tiempoAgotado ? 'Código expirado' : tiempoFormateado }}
                        </span>
                      </div>
                      @if (!tiempoAgotado) {
                        <button (click)="verificarCodigo()" [disabled]="cargandoReset()" class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-transform flex items-center justify-center gap-3 text-sm uppercase tracking-widest cursor-pointer disabled:cursor-not-allowed">
                          @if (!cargandoReset()) {
                            <span class="flex items-center gap-2">
                              Verificar Código
                              <lucide-icon [name]="CheckCircle2" class="w-5 h-5"></lucide-icon>
                            </span>
                          } @else {
                            <div class="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-[800ms]">
                              <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span class="animate-pulse">Verificando...</span>
                            </div>
                          }
                        </button>
                      } @else {
                        <button (click)="solicitarCodigo()" [disabled]="cargandoReset()" class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-transform flex items-center justify-center gap-3 text-sm uppercase tracking-widest cursor-pointer disabled:cursor-not-allowed">
                          @if (!cargandoReset()) {
                            <span class="flex items-center gap-2">
                              Reenviar Código
                              <lucide-icon [name]="Mail" class="w-5 h-5"></lucide-icon>
                            </span>
                          } @else {
                            <div class="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-[800ms]">
                              <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span class="animate-pulse">Enviando...</span>
                            </div>
                          }
                        </button>
                      }
                    </div>
                  }

                  <!-- PASO 3: Nueva Contraseña (compartido con preguntas) -->
                  @if (paso === 3) {
                    <div class="space-y-4">
                      <div class="space-y-2">
                        <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Nueva Contraseña</label>
                        <div class="relative group">
                          <div class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 transition-colors">
                            <lucide-icon [name]="Lock" class="w-5 h-5"></lucide-icon>
                          </div>
                          <input [type]="mostrarNewPassword() ? 'text' : 'password'" [(ngModel)]="newPassword" name="newPassword" placeholder="••••••••" class="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal" />
                          <button type="button" (click)="mostrarNewPassword.update(v => !v)" class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
                            <lucide-icon [name]="mostrarNewPassword() ? EyeOff : Eye" class="w-5 h-5"></lucide-icon>
                          </button>
                        </div>
                      </div>
                      <div class="space-y-2">
                        <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Confirmar Contraseña</label>
                        <div class="relative group">
                          <div class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 transition-colors">
                            <lucide-icon [name]="KeyRound" class="w-5 h-5"></lucide-icon>
                          </div>
                          <input [type]="mostrarConfirmPassword() ? 'text' : 'password'" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="••••••••" class="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal" />
                          <button type="button" (click)="mostrarConfirmPassword.update(v => !v)" class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
                            <lucide-icon [name]="mostrarConfirmPassword() ? EyeOff : Eye" class="w-5 h-5"></lucide-icon>
                          </button>
                        </div>
                      </div>
                      <button (click)="restablecerPassword()" [disabled]="cargandoReset()" class="!mt-8 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-transform flex items-center justify-center gap-3 text-sm uppercase tracking-widest cursor-pointer disabled:cursor-not-allowed">
                        @if (!cargandoReset()) {
                          <span class="flex items-center gap-2">
                            Restablecer Contraseña
                            <lucide-icon [name]="KeyRound" class="w-5 h-5"></lucide-icon>
                          </span>
                        } @else {
                          <div class="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-[800ms]">
                            <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span class="animate-pulse">Restableciendo...</span>
                          </div>
                        }
                      </button>
                    </div>
                  }
                }

                <!-- ===================== FLUJO POR PREGUNTAS DE SEGURIDAD ===================== -->
                @if (metodoRecuperacion() === 'preguntas') {
                  <!-- Step indicator -->
                  <div class="flex justify-center mb-4" style="gap: 8px;">
                    <div style="width: 32px; height: 6px; border-radius: 9999px; transition: background-color 0.3s; background-color: {{ paso >= 1 ? '#2563eb' : '#e2e8f0' }}"></div>
                    <div style="width: 32px; height: 6px; border-radius: 9999px; transition: background-color 0.3s; background-color: {{ paso >= 2 ? '#2563eb' : '#e2e8f0' }}"></div>
                    <div style="width: 32px; height: 6px; border-radius: 9999px; transition: background-color 0.3s; background-color: {{ paso >= 3 ? '#2563eb' : '#e2e8f0' }}"></div>
                  </div>

                  <!-- PASO 1: Correo (para buscar preguntas) -->
                  @if (paso === 1) {
                    <div class="space-y-4">
                      <p class="text-sm text-slate-500 dark:text-slate-400 text-center">Ingresa tu correo para ver tus preguntas de seguridad</p>
                      <div class="space-y-2">
                        <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Correo</label>
                        <div class="relative group">
                          <div class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 transition-colors">
                            <lucide-icon [name]="Mail" class="w-5 h-5"></lucide-icon>
                          </div>
                          <input type="email" [(ngModel)]="recuperacionEmail" name="recuperacionEmailPreguntas" placeholder="Ej: correo@ejemplo.com" class="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal" />
                        </div>
                      </div>
                      <button (click)="cargarPreguntas()" [disabled]="cargandoReset()" class="!mt-8 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-transform flex items-center justify-center gap-3 text-sm uppercase tracking-widest cursor-pointer disabled:cursor-not-allowed">
                        @if (!cargandoReset()) {
                          <span class="flex items-center gap-2">
                            Continuar
                            <lucide-icon [name]="ArrowRight" class="w-5 h-5"></lucide-icon>
                          </span>
                        } @else {
                          <div class="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-[800ms]">
                            <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span class="animate-pulse">Buscando...</span>
                          </div>
                        }
                      </button>
                    </div>
                  }

                  <!-- PASO 2: Responder preguntas -->
                  @if (paso === 2) {
                    <div class="space-y-4">
                      <p class="text-sm text-slate-500 dark:text-slate-400 text-center">Responde tus 3 preguntas de seguridad</p>
                      @for (pregunta of preguntasSeguridad; track pregunta.id; let i = $index) {
                        <div class="space-y-2">
                          <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">{{ pregunta.pregunta }}</label>
                          <div class="relative group">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 transition-colors">
                              <lucide-icon [name]="HelpCircle" class="w-5 h-5"></lucide-icon>
                            </div>
                            <input type="text" [(ngModel)]="respuestasPreguntas[i]" [name]="'respuesta_' + i" placeholder="Tu respuesta..." class="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal" />
                          </div>
                        </div>
                      }
                      <button (click)="verificarPreguntas()" [disabled]="cargandoReset()" class="!mt-8 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-transform flex items-center justify-center gap-3 text-sm uppercase tracking-widest cursor-pointer disabled:cursor-not-allowed">
                        @if (!cargandoReset()) {
                          <span class="flex items-center gap-2">
                            Verificar Respuestas
                            <lucide-icon [name]="CheckCircle2" class="w-5 h-5"></lucide-icon>
                          </span>
                        } @else {
                          <div class="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-[800ms]">
                            <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span class="animate-pulse">Verificando...</span>
                          </div>
                        }
                      </button>
                    </div>
                  }

                  <!-- PASO 3: Nueva Contraseña -->
                  @if (paso === 3) {
                    <div class="space-y-4">
                      <div class="space-y-2">
                        <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Nueva Contraseña</label>
                        <div class="relative group">
                          <div class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 transition-colors">
                            <lucide-icon [name]="Lock" class="w-5 h-5"></lucide-icon>
                          </div>
                          <input [type]="mostrarNewPassword() ? 'text' : 'password'" [(ngModel)]="newPassword" name="newPasswordPreguntas" placeholder="••••••••" class="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal" />
                          <button type="button" (click)="mostrarNewPassword.update(v => !v)" class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
                            <lucide-icon [name]="mostrarNewPassword() ? EyeOff : Eye" class="w-5 h-5"></lucide-icon>
                          </button>
                        </div>
                      </div>
                      <div class="space-y-2">
                        <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Confirmar Contraseña</label>
                        <div class="relative group">
                          <div class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 transition-colors">
                            <lucide-icon [name]="KeyRound" class="w-5 h-5"></lucide-icon>
                          </div>
                          <input [type]="mostrarConfirmPassword() ? 'text' : 'password'" [(ngModel)]="confirmPassword" name="confirmPasswordPreguntas" placeholder="••••••••" class="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal" />
                          <button type="button" (click)="mostrarConfirmPassword.update(v => !v)" class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
                            <lucide-icon [name]="mostrarConfirmPassword() ? EyeOff : Eye" class="w-5 h-5"></lucide-icon>
                          </button>
                        </div>
                      </div>
                      <button (click)="restablecerPorPreguntas()" [disabled]="cargandoReset()" class="!mt-8 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-transform flex items-center justify-center gap-3 text-sm uppercase tracking-widest cursor-pointer disabled:cursor-not-allowed">
                        @if (!cargandoReset()) {
                          <span class="flex items-center gap-2">
                            Restablecer Contraseña
                            <lucide-icon [name]="KeyRound" class="w-5 h-5"></lucide-icon>
                          </span>
                        } @else {
                          <div class="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-[800ms]">
                            <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span class="animate-pulse">Restableciendo...</span>
                          </div>
                        }
                      </button>
                    </div>
                  }
                }
              </div>
            }

          </div>
        </div>

      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent implements OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);
  themeService = inject(ThemeService);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  showPassword = signal(false);

  mostrarRecuperacion = signal(false);
  metodoRecuperacion = signal<'correo' | 'preguntas' | null>(null);
  recuperacionEmail = '';
  recuperacionCodigo = '';
  newPassword = '';
  confirmPassword = '';
  mostrarNewPassword = signal(false);
  mostrarConfirmPassword = signal(false);
  cargandoReset = signal(false);
  forgotHover = false;
  paso = 1;
  tiempoRestante = 0;
  private intervaloTemporizador: ReturnType<typeof setInterval> | null = null;

  preguntasSeguridad: { id: number; pregunta: string }[] = [];
  respuestasPreguntas: string[] = ['', '', ''];

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
  readonly KeyRound = KeyRound;
  readonly ArrowLeft = ArrowLeft;
  readonly ArrowRight = ArrowRight;
  readonly Shield = Shield;
  readonly Clock = Clock;
  readonly CheckCircle2 = CheckCircle2;
  readonly HelpCircle = HelpCircle;

  get tituloRecuperacion(): string {
    if (!this.metodoRecuperacion()) return 'Elige un método de recuperación';
    if (this.metodoRecuperacion() === 'correo') {
      return this.paso === 1 ? 'Verifica tu identidad' : this.paso === 2 ? 'Ingresa el código recibido' : 'Crea una nueva contraseña';
    }
    return this.paso === 1 ? 'Ingresa tu correo' : this.paso === 2 ? 'Responde tus preguntas de seguridad' : 'Crea una nueva contraseña';
  }

  ngOnDestroy() {
    this.detenerTemporizador();
  }

  get tiempoFormateado(): string {
    const m = Math.floor(this.tiempoRestante / 60);
    const s = this.tiempoRestante % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get tiempoAgotado(): boolean {
    return this.tiempoRestante <= 0;
  }

  toggleDarkMode() {
    this.themeService.toggle();
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  toggleRecuperacion() {
    this.mostrarRecuperacion.update(v => !v);
    if (this.mostrarRecuperacion()) {
      this.paso = 1;
    } else {
      this.resetearRecuperacion();
    }
  }

  volverAtras() {
    if (this.metodoRecuperacion() && this.paso === 1) {
      this.metodoRecuperacion.set(null);
    } else if (this.metodoRecuperacion() && this.paso > 1) {
      this.paso--;
      if (this.metodoRecuperacion() === 'correo' && this.paso === 1) {
        this.tiempoRestante = 0;
        this.detenerTemporizador();
      }
    } else {
      this.mostrarRecuperacion.set(false);
      this.resetearRecuperacion();
    }
  }

  seleccionarMetodo(metodo: 'correo' | 'preguntas') {
    this.metodoRecuperacion.set(metodo);
    this.paso = 1;
  }

  private resetearRecuperacion() {
    this.metodoRecuperacion.set(null);
    this.recuperacionEmail = '';
    this.recuperacionCodigo = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.preguntasSeguridad = [];
    this.respuestasPreguntas = ['', '', ''];
    this.paso = 1;
    this.tiempoRestante = 0;
    this.detenerTemporizador();
  }

  private detenerTemporizador() {
    if (this.intervaloTemporizador) {
      clearInterval(this.intervaloTemporizador);
      this.intervaloTemporizador = null;
    }
  }

  private iniciarTemporizador(segundos: number) {
    this.tiempoRestante = segundos;
    this.detenerTemporizador();
    this.intervaloTemporizador = setInterval(() => {
      this.tiempoRestante--;
      if (this.tiempoRestante <= 0) {
        this.detenerTemporizador();
      }
    }, 1000);
  }

  soloNumeros(event: KeyboardEvent) {
    if (!/^\d$/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete' && event.key !== 'Tab' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      event.preventDefault();
    }
  }

  solicitarCodigo() {
    if (!this.recuperacionEmail) {
      this.notify.warning('Correo requerido', 'Ingrese su correo electrónico.');
      return;
    }
    this.cargandoReset.set(true);
    const inicio = Date.now();
    const MIN_CARGANDO = 800;

    this.auth.solicitarRecuperacion(this.recuperacionEmail).subscribe({
      next: (res) => {
        const elapsed = Date.now() - inicio;
        const restante = Math.max(0, MIN_CARGANDO - elapsed);
        const expiracion = (res as any).expiracion ?? 180;
        setTimeout(() => {
          this.cargandoReset.set(false);
          this.paso = 2;
          this.recuperacionCodigo = '';
          this.iniciarTemporizador(expiracion);
          this.notify.success('Código enviado', 'Revisa el mensaje más reciente en tu correo.');
        }, restante);
      },
      error: (err) => {
        const elapsed = Date.now() - inicio;
        const restante = Math.max(0, MIN_CARGANDO - elapsed);
        setTimeout(() => {
          this.cargandoReset.set(false);
          this.notify.error('Error', err.error?.message ?? 'Error al enviar el código.');
        }, restante);
      }
    });
  }

  verificarCodigo() {
    if (!this.recuperacionCodigo || this.recuperacionCodigo.length < 6) {
      this.notify.warning('Código inválido', 'Ingrese el código de 6 dígitos.');
      return;
    }
    if (this.tiempoAgotado) {
      this.notify.warning('Código expirado', 'El código ha expirado. Solicita uno nuevo.');
      return;
    }
    this.cargandoReset.set(true);
    const inicio = Date.now();
    const MIN_CARGANDO = 800;

    this.auth.verificarOTP(this.recuperacionEmail, this.recuperacionCodigo).subscribe({
      next: () => {
        const elapsed = Date.now() - inicio;
        const restante = Math.max(0, MIN_CARGANDO - elapsed);
        setTimeout(() => {
          this.cargandoReset.set(false);
          this.notify.success('Código verificado', 'Identidad verificada correctamente.');
          this.paso = 3;
          this.detenerTemporizador();
        }, restante);
      },
      error: (err) => {
        const elapsed = Date.now() - inicio;
        const restante = Math.max(0, MIN_CARGANDO - elapsed);
        setTimeout(() => {
          this.cargandoReset.set(false);
          this.notify.error('Error', err.error?.message ?? 'Código incorrecto.');
        }, restante);
      }
    });
  }

  restablecerPassword() {
    if (!this.newPassword || !this.confirmPassword) {
      this.notify.warning('Campos requeridos', 'Complete todos los campos.');
      return;
    }
    if (this.newPassword.length < 8) {
      this.notify.warning('Contraseña corta', 'La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.notify.warning('Contraseñas no coinciden', 'Las contraseñas no coinciden.');
      return;
    }
    this.cargandoReset.set(true);
    const inicio = Date.now();
    const MIN_CARGANDO = 800;

    this.auth.restablecerPassword(this.recuperacionEmail, this.recuperacionCodigo, this.newPassword).subscribe({
      next: () => {
        const elapsed = Date.now() - inicio;
        const restante = Math.max(0, MIN_CARGANDO - elapsed);
        setTimeout(() => {
          this.cargandoReset.set(false);
          this.notify.success('Contraseña actualizada', 'Contraseña actualizada exitosamente.');
          this.mostrarRecuperacion.set(false);
          this.resetearRecuperacion();
        }, restante);
      },
      error: (err) => {
        const elapsed = Date.now() - inicio;
        const restante = Math.max(0, MIN_CARGANDO - elapsed);
        setTimeout(() => {
          this.cargandoReset.set(false);
          this.notify.error('Error', err.error?.message ?? 'Error al restablecer la contraseña.');
        }, restante);
      }
    });
  }

  cargarPreguntas() {
    if (!this.recuperacionEmail) {
      this.notify.warning('Correo requerido', 'Ingrese su correo electrónico.');
      return;
    }
    this.cargandoReset.set(true);
    const inicio = Date.now();
    const MIN_CARGANDO = 800;

    this.auth.verificarPreguntas(this.recuperacionEmail, []).subscribe({
      next: (res) => {
        const elapsed = Date.now() - inicio;
        const restante = Math.max(0, MIN_CARGANDO - elapsed);
        if (res.data?.preguntas) {
          setTimeout(() => {
            this.cargandoReset.set(false);
            this.preguntasSeguridad = res.data.preguntas;
            this.respuestasPreguntas = this.preguntasSeguridad.map(() => '');
            this.paso = 2;
          }, restante);
        } else {
          setTimeout(() => {
            this.cargandoReset.set(false);
            this.notify.error('Error', 'No se pudieron cargar las preguntas.');
          }, restante);
        }
      },
      error: (err) => {
        const elapsed = Date.now() - inicio;
        const restante = Math.max(0, MIN_CARGANDO - elapsed);
        setTimeout(() => {
          this.cargandoReset.set(false);
          this.notify.error('Error', err.error?.message ?? 'Error al buscar preguntas.');
        }, restante);
      }
    });
  }

  verificarPreguntas() {
    const todasRespondidas = this.respuestasPreguntas.every(r => r.trim() !== '');
    if (!todasRespondidas) {
      this.notify.warning('Campos requeridos', 'Debes responder las 3 preguntas de seguridad.');
      return;
    }
    this.cargandoReset.set(true);
    const inicio = Date.now();
    const MIN_CARGANDO = 800;

    const respuestas = this.preguntasSeguridad.map((p, i) => ({
      preguntaId: p.id,
      respuesta: this.respuestasPreguntas[i]
    }));

    this.auth.verificarPreguntas(this.recuperacionEmail, respuestas).subscribe({
      next: () => {
        const elapsed = Date.now() - inicio;
        const restante = Math.max(0, MIN_CARGANDO - elapsed);
        setTimeout(() => {
          this.cargandoReset.set(false);
          this.notify.success('Verificado', 'Respuestas correctas. Crea tu nueva contraseña.');
          this.paso = 3;
        }, restante);
      },
      error: (err) => {
        const elapsed = Date.now() - inicio;
        const restante = Math.max(0, MIN_CARGANDO - elapsed);
        setTimeout(() => {
          this.cargandoReset.set(false);
          this.notify.error('Error', err.error?.message ?? 'Las respuestas no son correctas.');
        }, restante);
      }
    });
  }

  restablecerPorPreguntas() {
    if (!this.newPassword || !this.confirmPassword) {
      this.notify.warning('Campos requeridos', 'Complete todos los campos.');
      return;
    }
    if (this.newPassword.length < 8) {
      this.notify.warning('Contraseña corta', 'La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.notify.warning('Contraseñas no coinciden', 'Las contraseñas no coinciden.');
      return;
    }
    this.cargandoReset.set(true);
    const inicio = Date.now();
    const MIN_CARGANDO = 800;

    const respuestas = this.preguntasSeguridad.map((p, i) => ({
      preguntaId: p.id,
      respuesta: this.respuestasPreguntas[i]
    }));

    this.auth.resetPorPreguntas(this.recuperacionEmail, respuestas, this.newPassword).subscribe({
      next: () => {
        const elapsed = Date.now() - inicio;
        const restante = Math.max(0, MIN_CARGANDO - elapsed);
        setTimeout(() => {
          this.cargandoReset.set(false);
          this.notify.success('Contraseña actualizada', 'Contraseña actualizada exitosamente.');
          this.mostrarRecuperacion.set(false);
          this.resetearRecuperacion();
        }, restante);
      },
      error: (err) => {
        const elapsed = Date.now() - inicio;
        const restante = Math.max(0, MIN_CARGANDO - elapsed);
        setTimeout(() => {
          this.cargandoReset.set(false);
          this.notify.error('Error', err.error?.message ?? 'Error al restablecer la contraseña.');
        }, restante);
      }
    });
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
