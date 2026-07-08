import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen w-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
      
      <!-- Background glow blobs -->
      <div class="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
      <div class="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse delay-1000 pointer-events-none"></div>

      <!-- Hero Section -->
      <div class="relative z-10 text-center max-w-2xl mx-auto space-y-8">
        
        <div class="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-full px-5 py-2 text-sm font-bold tracking-wider">
          🏘️ <span>Sistema de Gestión Comunal</span>
        </div>

        <h1 class="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
          Consejo Comunal<br/>
          <span class="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">El Valle</span>
        </h1>

        <p class="text-lg text-slate-400 leading-relaxed font-medium max-w-lg mx-auto">
          Plataforma digital para la gestión integral de familias, formularios y reportes del consejo comunal.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a routerLink="/login"
            class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all text-base cursor-pointer">
            Iniciar sesión
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </a>
        </div>
      </div>

      <!-- Feature Cards -->
      <div class="relative z-10 mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto w-full">
        @for (f of features; track f.icon) {
          <div class="flex flex-col gap-4 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-blue-500/30 p-6 rounded-3xl backdrop-blur-sm hover:-translate-y-1 transition-all duration-300 cursor-default group">
            <span class="text-3xl block group-hover:scale-110 transition-transform duration-300">{{ f.icon }}</span>
            <div>
              <h3 class="font-black text-white text-sm mb-1">{{ f.title }}</h3>
              <p class="text-xs text-slate-400 leading-relaxed">{{ f.desc }}</p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class InicioComponent {
  features = [
    { icon: '👨‍👩‍👧', title: 'Gestión Familiar',  desc: 'Registro y seguimiento completo de familias y sus miembros.' },
    { icon: '📋',    title: 'Formularios',      desc: 'Crea, asigna y gestiona formularios dinámicos fácilmente.' },
    { icon: '📈',    title: 'Reportes',         desc: 'Genera informes detallados en PDF y otros formatos.' },
    { icon: '🔍',    title: 'Auditoría',        desc: 'Rastrea cada acción realizada en el sistema.' },
  ];
}
