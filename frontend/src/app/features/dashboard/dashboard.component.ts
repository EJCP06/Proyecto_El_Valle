import { Component, inject, OnInit, OnDestroy, signal, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
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
  Baby
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
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex flex-col h-full">

      <!-- Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 p-6 text-white shadow-lg shrink-0">
        <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 24px 24px;"></div>
        <div class="relative z-10">
          <h2 class="text-2xl font-black tracking-tight">Panel de Control</h2>
          <p class="text-sm text-blue-100/80 font-normal mt-1">Resumen general de la Comuna Venezuela Patria Mía</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0 mt-4">
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

      <!-- Two charts filling remaining space -->
      <div class="charts-container mt-4">
        <div class="chart-card bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col">
          <h3 class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] mb-3 shrink-0">Familias por Consejo Comunal</h3>
          <div class="chart-body">
            <canvas #barCanvas></canvas>
          </div>
        </div>
        <div class="chart-card bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col">
          <h3 class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] mb-4 shrink-0">Distribución por Sexo</h3>
          <div class="chart-body flex items-center justify-center">
            <canvas #doughnutCanvas></canvas>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }
    .charts-container {
      display: flex;
      gap: 16px;
      width: 100%;
      flex: 1;
      min-height: 0;
    }
    .chart-card {
      flex: 1;
      min-width: 0;
      min-height: 0;
    }
    .chart-body {
      position: relative;
      flex: 1;
      min-height: 0;
    }
    @media (max-width: 1023px) {
      .charts-container {
        flex-direction: column;
        flex: none;
        height: auto;
      }
      .chart-card {
        width: 100%;
        height: 350px;
        min-height: 350px;
      }
      .chart-body {
        height: 260px;
        min-height: 260px;
        flex: none;
        width: 100%;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  auth     = inject(AuthService);
  reportes = inject(ReportesService);

  @ViewChildren('barCanvas') barCanvas!: QueryList<ElementRef<HTMLCanvasElement>>;
  @ViewChildren('doughnutCanvas') doughnutCanvas!: QueryList<ElementRef<HTMLCanvasElement>>;

  data = signal<StatsData | null>(null);

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

