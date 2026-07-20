import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Users, ClipboardList, BarChart3 } from 'lucide-angular';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen w-screen flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden bg-no-repeat bg-center bg-fixed" style="background-image: url('foto.jpg'); background-size: cover;">

      <div class="absolute inset-0 z-0" style="background: linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 100%)"></div>

      <div class="absolute top-0 right-0 z-20 p-4">
        <a routerLink="/login"
          class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-xl shadow-blue-600/20 hover:-translate-y-0.5 transition-all duration-200 text-sm cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Iniciar sesión
        </a>
      </div>

      <div class="relative z-10 text-center max-w-2xl mx-auto space-y-8">
        <h1 class="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
          Consejo Comunal<br/>
          <span class="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">El Valle</span>
        </h1>
        <p class="text-lg text-white leading-relaxed font-normal max-w-lg mx-auto">
          Plataforma digital para la gestión integral de familias, formularios y reportes del consejo comunal.
        </p>
      </div>

      <div class="relative z-10 mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto w-full">
        @for (f of features; track f.title) {
          <div class="flex flex-col items-center gap-4 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-blue-400/40 p-6 rounded-3xl backdrop-blur-sm hover:-translate-y-1 transition-all duration-300 cursor-default group">
            <lucide-icon [name]="f.icon" class="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300"></lucide-icon>
            <div class="text-center">
              <h3 class="font-black text-white text-lg mb-1">{{ f.title }}</h3>
              <p class="text-base text-white leading-relaxed">{{ f.desc }}</p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class InicioComponent {
  readonly Users = Users;
  readonly ClipboardList = ClipboardList;
  readonly BarChart3 = BarChart3;

  features = [
    { icon: Users, title: 'Gestión Familiar', desc: 'Registro y seguimiento completo de familias y sus miembros.' },
    { icon: ClipboardList, title: 'Formularios', desc: 'Crea, asigna y gestiona formularios dinámicos fácilmente.' },
    { icon: BarChart3, title: 'Reportes', desc: 'Genera informes detallados en PDF y otros formatos.' },
  ];
}
