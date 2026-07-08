import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormulariosService } from '../../core/services/formularios.service';
import { FamiliasService } from '../../core/services/familias.service';
import { NotificationService } from '../../core/services/notification.service';
import { Formulario, Familia } from '../../core/models/usuario.model';

@Component({
  selector: 'app-formulario-asignar',
  standalone: true,
  template: `
    <div class="page-form">
      <h2 class="form-title">Asignar: {{ formulario()?.titulo }}</h2>
      @if (error()) { <div class="alert-error">{{ error() }}</div> }
      @if (success()) { <div class="alert-success">{{ success() }}</div> }
      <div class="form-card">
        <p class="hint">Selecciona las familias destino:</p>
        <div class="familia-list">
          @for (f of familias(); track f.id) {
            <label class="familia-item">
              <input type="checkbox" [value]="f.id" (change)="toggle(f.id, $event)" />
              <span class="familia-name">{{ f.nombre }}</span>
              <span class="familia-addr">{{ f.direccion }}</span>
            </label>
          }
        </div>
        <div class="form-actions">
          <button class="btn-secondary" type="button" (click)="cancel()">Cancelar</button>
          <button class="btn-primary" type="button" [disabled]="saving() || selected().size === 0" (click)="assign()">
            {{ saving() ? 'Asignando…' : 'Asignar (' + selected().size + ')' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-form { max-width: 600px; }
    .form-title { font-size: 1.2rem; font-weight: 700; color: #0f172a; margin: 0 0 20px; }
    .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; border-radius: 8px; padding: 10px 14px; font-size: .85rem; margin-bottom: 12px; }
    .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; border-radius: 8px; padding: 10px 14px; font-size: .85rem; margin-bottom: 12px; }
    .form-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
    .hint { font-size: .875rem; color: #64748b; margin: 0 0 16px; }
    .familia-list { display: flex; flex-direction: column; gap: 8px; max-height: 360px; overflow-y: auto; }
    .familia-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; cursor: pointer; }
    .familia-item:hover { background: #f8fafc; border-color: #bfdbfe; }
    .familia-name { font-weight: 600; font-size: .875rem; flex: 1; }
    .familia-addr { font-size: .78rem; color: #94a3b8; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .btn-primary { background: #2563eb; color: #fff; border: none; border-radius: 9px; padding: 10px 24px; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
    .btn-secondary { background: #f1f5f9; color: #374151; border: none; border-radius: 9px; padding: 10px 20px; font-weight: 600; cursor: pointer; }
  `],
})
export class FormularioAsignarComponent implements OnInit {
  private formSvc = inject(FormulariosService);
  private famSvc  = inject(FamiliasService);
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private notify = inject(NotificationService);

  formulario = signal<Formulario | null>(null);
  familias   = signal<Familia[]>([]);
  selected   = signal<Set<number>>(new Set());
  saving     = signal(false);
  error      = signal('');
  success    = signal('');

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.formSvc.getById(id).subscribe((r) => this.formulario.set(r.data));
    this.famSvc.getAll(1, 200).subscribe((r) => this.familias.set(r.data));
  }

  toggle(id: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selected.update((s) => { const n = new Set(s); checked ? n.add(id) : n.delete(id); return n; });
  }

  assign() {
    this.saving.set(true);
    const formularioId = +this.route.snapshot.paramMap.get('id')!;
    const ids = Array.from(this.selected());
    let done = 0;
    ids.forEach((familiaId) => {
      this.formSvc.asignar(formularioId, familiaId).subscribe({
        next: () => { done++; if (done === ids.length) { this.notify.success('Formulario asignado', `Asignado a ${ids.length} familia(s) correctamente.`); this.saving.set(false); this.router.navigate(['/app/formularios']); } },
        error: (e) => { this.error.set(e?.error?.message ?? 'Error.'); this.saving.set(false); this.notify.error('Error', e?.error?.message ?? 'Error al asignar.'); },
      });
    });
  }

  cancel() { this.router.navigate(['/app/formularios']); }
}
