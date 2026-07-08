import { Component, inject, OnInit, OnDestroy, signal, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ReportesService } from '../../core/services/reportes.service';
import Chart from 'chart.js/auto';
import {
  LucideAngularModule,
  Building2,
  Users,
  User,
  ClipboardList,
  Venus,
  Mars,
  Heart,
  Baby,
  Activity
} from 'lucide-angular';

interface StatsData {
  consejosCount: number;
  familiasCount: number;
  miembrosCount: number;
  formulariosCount: number;
  hombresCount: number;
  mujeresCount: number;
  adultosMayoresCount: number;
  ninosCount: number;
  familiasPorConsejo: { id: number; nombre: string; total: number }[];
  actividadesRecientes: { accion: string; entidad: string; createdAt: string; usuario: string }[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">

      <!-- Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 p-6 text-white shadow-lg">
        <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 24px 24px;"></div>
        <div class="relative z-10">
          <h2 class="text-2xl font-black tracking-tight">Bienvenido, {{ (auth.currentUser()?.nombre ?? '').split(' ')[0] }}</h2>
          <p class="text-sm text-blue-100/80 font-medium mt-1">Resumen general de la Comuna Venezuela Patria Mía</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        @for (s of statCards; track s.label) {
          <div class="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold" [style.background]="s.color">
                <lucide-icon [name]="s.icon" class="w-5 h-5"></lucide-icon>
              </div>
              <div>
                <p class="text-2xl font-black text-slate-800 dark:text-white leading-none">{{ s.value }}</p>
                <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{{ s.label }}</p>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Three cards side by side -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-[500px]">
          <h3 class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] mb-4 shrink-0">Familias por Consejo Comunal</h3>
          <div class="relative flex-1 min-h-0">
            <canvas #barCanvas></canvas>
          </div>
        </div>
        <div class="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-[500px]">
          <h3 class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] mb-3 shrink-0">Actividad Reciente</h3>
          <div class="space-y-2 flex-1 overflow-y-auto">
            @if (actividades().length === 0) {
              <p class="text-sm text-slate-400 dark:text-slate-500 font-medium text-center py-16">Sin actividad reciente.</p>
            }
            @for (a of actividades(); track a.createdAt) {
              <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <lucide-icon [name]="Activity" class="w-4 h-4"></lucide-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{{ a.usuario }} — {{ a.accion }}</p>
                  <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{{ a.entidad }} · {{ a.createdAt | slice:0:16 }}</p>
                </div>
              </div>
            }
          </div>
        </div>
        <div class="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-[500px]">
          <h3 class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] mb-4 shrink-0">Distribución por Sexo</h3>
          <div class="relative flex-1 min-h-0 flex items-center justify-center">
            <canvas #doughnutCanvas></canvas>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: []
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  auth     = inject(AuthService);
  reportes = inject(ReportesService);
  Activity = Activity;

  @ViewChildren('barCanvas') barCanvas!: QueryList<ElementRef<HTMLCanvasElement>>;
  @ViewChildren('doughnutCanvas') doughnutCanvas!: QueryList<ElementRef<HTMLCanvasElement>>;

  data = signal<StatsData | null>(null);
  actividades = signal<{ usuario: string; accion: string; entidad: string; createdAt: string }[]>([]);

  statCards = [
    { icon: Building2,     label: 'Consejos',    value: '—', color: '#2563eb' },
    { icon: Users,         label: 'Familias',   value: '—', color: '#6366f1' },
    { icon: User,          label: 'Miembros',   value: '—', color: '#059669' },
    { icon: ClipboardList, label: 'Formularios', value: '—', color: '#d97706' },
    { icon: Mars,          label: 'Hombres',    value: '—', color: '#3b82f6' },
    { icon: Venus,         label: 'Mujeres',    value: '—', color: '#ec4899' },
    { icon: Heart,         label: 'Adultos May.', value: '—', color: '#ef4444' },
    { icon: Baby,          label: 'Niños',      value: '—', color: '#f59e0b' },
  ];

  private charts: Chart[] = [];

  ngOnInit() {
    this.reportes.getStats().subscribe({
      next: (r) => {
        if (r.success) {
          const d = r.data as StatsData;
          this.data.set(d);
          this.actividades.set(d.actividadesRecientes ?? []);
          this.updateStats(d);
          setTimeout(() => this.renderCharts(), 50);
        }
      },
    });
  }

  ngOnDestroy() {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
  }

  ngAfterViewInit() {
    setTimeout(() => this.renderCharts(), 100);
  }

  private updateStats(d: StatsData) {
    this.statCards = this.statCards.map((s) => {
      switch (s.label) {
        case 'Consejos':    return { ...s, value: String(d.consejosCount ?? '—') };
        case 'Familias':   return { ...s, value: String(d.familiasCount ?? '—') };
        case 'Miembros':   return { ...s, value: String(d.miembrosCount ?? '—') };
        case 'Formularios': return { ...s, value: String(d.formulariosCount ?? '—') };
        case 'Hombres':    return { ...s, value: String(d.hombresCount ?? '—') };
        case 'Mujeres':    return { ...s, value: String(d.mujeresCount ?? '—') };
        case 'Adultos May.': return { ...s, value: String(d.adultosMayoresCount ?? '—') };
        case 'Niños':      return { ...s, value: String(d.ninosCount ?? '—') };
        default: return s;
      }
    });
  }

  private renderCharts() {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];

    const d = this.data();
    if (!d) return;

    const barEl = this.barCanvas?.first?.nativeElement;
    if (barEl) {
      this.charts.push(new Chart(barEl, {
        type: 'bar',
        data: {
          labels: d.familiasPorConsejo.map((c) => c.nombre.replace('Consejo Comunal ', 'CC ')),
          datasets: [{
            label: 'Familias',
            data: d.familiasPorConsejo.map((c) => c.total),
            backgroundColor: '#3b82f6',
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
            x: { ticks: { font: { size: 10 } } },
          },
        },
      }));
    }

    const doughnutEl = this.doughnutCanvas?.first?.nativeElement;
    if (doughnutEl) {
      this.charts.push(new Chart(doughnutEl, {
        type: 'doughnut',
        data: {
          labels: ['Hombres', 'Mujeres'],
          datasets: [{
            data: [d.hombresCount, d.mujeresCount],
            backgroundColor: ['#3b82f6', '#ec4899'],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { size: 10, weight: 'bold' }, padding: 12 },
            },
          },
        },
      }));
    }
  }
}
