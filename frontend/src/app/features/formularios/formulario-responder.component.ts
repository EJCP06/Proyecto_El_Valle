import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FormulariosService } from '../../core/services/formularios.service';
import { MiembrosService } from '../../core/services/miembros.service';
import { NotificationService } from '../../core/services/notification.service';
import { Formulario, Miembro } from '../../core/models/usuario.model';

@Component({
  selector: 'app-formulario-responder',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-form">
      <h2 class="form-title">{{ formulario()?.titulo }}</h2>
      <p class="form-desc">{{ formulario()?.descripcion }}</p>
      @if (error()) { <div class="alert-error">{{ error() }}</div> }
      @if (submitted()) {
        <div class="alert-success">
          Respuestas enviadas correctamente.
          <button type="button" class="link-btn" (click)="goBack()">Volver a la familia</button>
        </div>
      } @else {
        @if (formulario()?.alcance === 'individual' && !selectedMiembroId()) {
          <div class="form-card">
            <p class="form-desc">Este formulario es individual. Selecciona el miembro al que corresponde:</p>
            @if (loadingMiembros()) {
              <p class="form-desc">Cargando miembros...</p>
            } @else {
              <div class="miembros-list">
                @for (m of miembros(); track m.id) {
                  <button type="button" class="miembro-btn" (click)="selectMiembro(m)">
                    <span class="miembro-name">{{ m.nombre }} {{ m.apellido }}</span>
                    <span class="miembro-cedula">{{ m.cedula }}</span>
                  </button>
                } @empty {
                  <p class="form-desc">No hay miembros registrados en esta familia.</p>
                }
              </div>
            }
          </div>
        } @else {
          <form (ngSubmit)="submit()" class="form-card">
            @for (campo of formulario()?.campos ?? []; track campo.id) {
              <div class="field">
                <label>{{ campo.label }}@if(campo.requerido) { <span class="text-red-500">*</span> }</label>
                @if (campo.tipo === 'textarea') {
                  <textarea [name]="campo.label" [(ngModel)]="respuestas[campo.label]" [required]="campo.requerido" rows="3"></textarea>
                } @else if (campo.tipo === 'select') {
                  <select [name]="campo.label" [(ngModel)]="respuestas[campo.label]" [required]="campo.requerido">
                    <option value="">Seleccionar...</option>
                    @for (op of campo.opciones ?? []; track op) {
                      <option [value]="op">{{ op }}</option>
                    }
                  </select>
                } @else if (campo.tipo === 'yes_no') {
                  <div class="yesno-group">
                    <label class="yesno-option">
                      <input type="radio" [name]="campo.label" value="Si" [(ngModel)]="respuestas[campo.label]" [required]="campo.requerido"/>
                      <span>Sí</span>
                    </label>
                    <label class="yesno-option">
                      <input type="radio" [name]="campo.label" value="No" [(ngModel)]="respuestas[campo.label]" [required]="campo.requerido"/>
                      <span>No</span>
                    </label>
                  </div>
                } @else if (campo.tipo === 'time') {
                  <input type="time" [name]="campo.label" [(ngModel)]="respuestas[campo.label]" [required]="campo.requerido" />
                } @else {
                  <input [type]="campo.tipo" [name]="campo.label" [(ngModel)]="respuestas[campo.label]" [required]="campo.requerido" />
                }
              </div>
            }
            <div class="form-actions">
              <button type="button" class="btn-secondary" (click)="goBack()">Volver</button>
              <button type="submit" class="btn-primary" [disabled]="saving()">
                {{ saving() ? 'Enviando...' : 'Enviar respuestas' }}
              </button>
            </div>
          </form>
        }
      }
    </div>
  `,
  styles: [`
    .page-form { max-width: 640px; }
    .form-title { font-size: 1.2rem; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
    .form-desc { color: #64748b; font-size: .875rem; margin: 0 0 20px; }
    .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; border-radius: 8px; padding: 10px 14px; font-size: .85rem; margin-bottom: 12px; }
    .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; border-radius: 8px; padding: 16px; font-size: .9rem; display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
    .link-btn { background: none; border: none; color: #166534; font-weight: 600; text-decoration: underline; cursor: pointer; padding: 0; font-size: .9rem; }
    .form-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,.06); display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field label { font-size: .8rem; font-weight: 600; color: #374151; }
    .field input, .field textarea, .field select { border: 1.5px solid #e2e8f0; border-radius: 9px; padding: 9px 13px; font-size: .875rem; outline: none; }
    .field input:focus, .field textarea:focus, .field select:focus { border-color: #2563eb; }
    .yesno-group { display: flex; gap: 12px; }
    .yesno-option { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: .875rem; font-weight: 500; color: #374151; }
    .yesno-option input[type="radio"] { width: 18px; height: 18px; accent-color: #2563eb; cursor: pointer; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 8px; }
    .btn-primary { background: #2563eb; color: #fff; border: none; border-radius: 9px; padding: 10px 24px; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
    .btn-secondary { background: #f1f5f9; color: #374151; border: none; border-radius: 9px; padding: 10px 20px; font-weight: 600; cursor: pointer; }
    .miembros-list { display: flex; flex-direction: column; gap: 8px; }
    .miembro-btn { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.15s; }
    .miembro-btn:hover { border-color: #2563eb; background: #eff6ff; }
    .miembro-name { font-weight: 600; font-size: .875rem; color: #0f172a; }
    .miembro-cedula { font-size: .75rem; color: #94a3b8; }
  `],
})
export class FormularioResponderComponent implements OnInit {
  private svc    = inject(FormulariosService);
  private miembSvc = inject(MiembrosService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private notify = inject(NotificationService);

  formulario = signal<Formulario | null>(null);
  respuestas: Record<string, unknown> = {};
  saving    = signal(false);
  submitted = signal(false);
  error     = signal('');
  familiaId = 0;

  miembros = signal<Miembro[]>([]);
  loadingMiembros = signal(false);
  selectedMiembroId = signal<number | null>(null);

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe((r) => {
      this.formulario.set(r.data);
      const qMiembro = this.route.snapshot.queryParamMap.get('miembro');
      if (qMiembro) {
        this.selectedMiembroId.set(+qMiembro);
      }
    });
    const qFamilia = this.route.snapshot.queryParamMap.get('familia');
    if (qFamilia) {
      this.familiaId = +qFamilia;
    }
  }

  selectMiembro(m: Miembro) {
    this.selectedMiembroId.set(m.id!);
  }

  submit() {
    this.saving.set(true);
    const asignacionId = +this.route.snapshot.paramMap.get('id')!;
    this.svc.responder(asignacionId, this.respuestas, this.selectedMiembroId() ?? undefined).subscribe({
      next: () => { this.submitted.set(true); this.saving.set(false); this.notify.success('Respuestas enviadas', 'Las respuestas se han registrado correctamente.'); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Error.'); this.saving.set(false); this.notify.error('Error', e?.error?.message ?? 'Error al enviar respuestas.'); },
    });
  }

  goBack() {
    if (this.familiaId) {
      this.router.navigate(['/app/familias', this.familiaId]);
    } else {
      this.router.navigate(['/app/formularios']);
    }
  }
}

