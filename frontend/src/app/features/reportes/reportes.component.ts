import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { ReportesService } from '../../core/services/reportes.service';
import { NotificationService } from '../../core/services/notification.service';
import { ReporteParams } from '../../core/models/usuario.model';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [FormsModule, JsonPipe],
  template: `
    <div class="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <!-- Page Title -->
      <div>
        <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Reportes y Estadísticas</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 font-normal">Extrae datos consolidados del sistema en múltiples formatos.</p>
      </div>

      <!-- Settings Card -->
      <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          <!-- Report Type -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Tipo de reporte <span class="text-red-500">*</span></label>
            <select 
              [(ngModel)]="params.tipo" 
              name="tipo"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"
            >
              <option value="familias">Familias</option>
              <option value="miembros">Miembros</option>
              <option value="formularios">Formularios</option>
              <option value="auditoria">Auditoría</option>
            </select>
          </div>

          <!-- Format -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Formato de salida</label>
            <select 
              [(ngModel)]="params.formato" 
              name="formato"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="pdf">PDF (Descargable)</option>
            </select>
          </div>

          <!-- Since -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Fecha de inicio (Desde)</label>
            <input 
              [(ngModel)]="params.desde" 
              name="desde" 
              type="date"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-sm"
            />
          </div>

          <!-- Until -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Fecha de fin (Hasta)</label>
            <input 
              [(ngModel)]="params.hasta" 
              name="hasta" 
              type="date"
              class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-normal text-sm"
            />
          </div>

        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
          <button 
            (click)="generate()" 
            [disabled]="loading()"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed text-sm"
          >
            {{ loading() ? 'Generando...' : 'Generar Reporte' }}
          </button>
          
          @if (params.formato === 'pdf') {
            <button 
              (click)="download()" 
              [disabled]="loading()"
              class="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-sm cursor-pointer disabled:cursor-not-allowed"
            >
              ⬇ Descargar PDF
            </button>
          }
        </div>
      </div>

      <!-- Result View -->
      @if (result()) {
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-sm space-y-4 animate-in slide-in-from-bottom-3 duration-300">
          <h3 class="text-sm font-black text-slate-800 dark:text-white tracking-tight uppercase">Datos obtenidos</h3>
          <pre class="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl p-5 text-xs font-mono overflow-x-auto max-h-96 select-text">{{ result() | json }}</pre>
        </div>
      }

    </div>
  `,
  styles: []
})
export class ReportesComponent {
  private svc = inject(ReportesService);
  private notify = inject(NotificationService);

  params: ReporteParams = { tipo: 'familias', formato: 'json' };
  result  = signal<unknown>(null);
  loading = signal(false);

  generate() {
    this.loading.set(true);
    this.svc.generate(this.params).subscribe({
      next: (r) => { this.result.set(r.data); this.loading.set(false); },
      error: (e) => { this.result.set(e?.error); this.loading.set(false); this.notify.error('Error', e?.error?.message ?? 'Error al generar el reporte.'); },
    });
  }

  download() {
    this.svc.downloadPdf(this.params).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `reporte-${this.params.tipo}.pdf`;
        a.click(); URL.revokeObjectURL(url);
        this.notify.success('PDF descargado', 'El reporte se ha descargado correctamente.');
      },
      error: (e) => this.notify.error('Error', 'Error al descargar el PDF.'),
    });
  }
}

