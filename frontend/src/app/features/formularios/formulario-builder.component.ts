import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FormulariosService } from '../../core/services/formularios.service';
import { NotificationService } from '../../core/services/notification.service';
import { Formulario, CampoFormulario, TipoCampo } from '../../core/models/usuario.model';

@Component({
  selector: 'app-formulario-builder',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="builder-page">
      <div class="builder-header">
        <h2 class="form-title">{{ isEdit() ? 'Editar formulario' : 'Nuevo formulario' }}</h2>
      </div>

      @if (error()) { <div class="alert-error">{{ error() }}</div> }

      <div class="builder-layout">
        <!-- Meta -->
        <div class="builder-meta form-card">
          <h3 class="section-label">Información general</h3>
          <div class="field">
            <label>Título *</label>
            <input [(ngModel)]="titulo" name="titulo" required />
          </div>
          <div class="field" style="margin-top:12px">
            <label>Descripción</label>
            <textarea [(ngModel)]="descripcion" name="descripcion" rows="3"></textarea>
          </div>
        </div>

        <!-- Fields -->
        <div class="builder-fields form-card">
          <div class="fields-header">
            <h3 class="section-label">Campos ({{ campos().length }})</h3>
            <button type="button" class="btn-add" (click)="addCampo()">+ Agregar campo</button>
          </div>

          @for (campo of campos(); track campo.id; let i = $index) {
            <div class="campo-row">
              <div class="campo-num">{{ i + 1 }}</div>
              <div class="campo-fields">
                <input [(ngModel)]="campo.label" [name]="'label'+i" placeholder="Etiqueta *" />
                <select [(ngModel)]="campo.tipo" [name]="'tipo'+i">
                  @for (t of tipos; track t) {
                    <option [value]="t">{{ t }}</option>
                  }
                </select>
                <label class="checkbox-label">
                  <input [(ngModel)]="campo.requerido" [name]="'req'+i" type="checkbox" />
                  Requerido
                </label>
              </div>
              <button type="button" class="btn-remove" (click)="removeCampo(i)">✕</button>
            </div>
          }

          @if (campos().length === 0) {
            <p class="empty-hint">Agrega al menos un campo al formulario.</p>
          }
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-secondary" (click)="cancel()">Cancelar</button>
        <button type="button" class="btn-primary" [disabled]="saving()" (click)="save()">
          {{ saving() ? 'Guardando…' : 'Guardar formulario' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .builder-page { display: flex; flex-direction: column; gap: 20px; max-width: 860px; }
    .form-title { font-size: 1.2rem; font-weight: 700; color: #0f172a; margin: 0; }
    .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; border-radius: 8px; padding: 10px 14px; font-size: .85rem; }
    .builder-layout { display: flex; flex-direction: column; gap: 16px; }
    .form-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
    .section-label { font-size: .9rem; font-weight: 700; color: #0f172a; margin: 0 0 14px; }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field label { font-size: .8rem; font-weight: 600; color: #374151; }
    .field input, .field textarea { border: 1.5px solid #e2e8f0; border-radius: 9px; padding: 9px 13px; font-size: .875rem; outline: none; }
    .field input:focus, .field textarea:focus { border-color: #2563eb; }

    .fields-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .btn-add { background: #dbeafe; color: #1d4ed8; border: none; border-radius: 8px; padding: 7px 16px; font-size: .82rem; font-weight: 600; cursor: pointer; }
    .btn-add:hover { background: #bfdbfe; }

    .campo-row { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 10px; margin-bottom: 8px; }
    .campo-num { width: 24px; height: 24px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .75rem; font-weight: 700; color: #64748b; flex-shrink: 0; }
    .campo-fields { flex: 1; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .campo-fields input, .campo-fields select { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 7px 11px; font-size: .82rem; outline: none; }
    .campo-fields input { flex: 1; min-width: 140px; }
    .checkbox-label { display: flex; align-items: center; gap: 5px; font-size: .8rem; color: #374151; cursor: pointer; }
    .btn-remove { background: none; border: none; color: #dc2626; cursor: pointer; font-size: 1rem; padding: 4px; }
    .btn-remove:hover { background: #fef2f2; border-radius: 6px; }
    .empty-hint { color: #94a3b8; font-size: .85rem; text-align: center; padding: 20px; }

    .form-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .btn-primary { background: #2563eb; color: #fff; border: none; border-radius: 9px; padding: 10px 24px; font-weight: 600; cursor: pointer; font-size: .875rem; }
    .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
    .btn-secondary { background: #f1f5f9; color: #374151; border: none; border-radius: 9px; padding: 10px 20px; font-weight: 600; cursor: pointer; font-size: .875rem; }
  `],
})
export class FormularioBuilderComponent implements OnInit {
  private svc    = inject(FormulariosService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private notify = inject(NotificationService);

  isEdit = signal(false);
  saving = signal(false);
  error  = signal('');

  titulo      = '';
  descripcion = '';
  campos      = signal<CampoFormulario[]>([]);

  tipos: TipoCampo[] = ['text', 'textarea', 'number', 'date', 'select', 'radio', 'checkbox', 'file'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.svc.getById(+id).subscribe((r) => {
        if (r.success) {
          this.titulo      = r.data.titulo;
          this.descripcion = r.data.descripcion ?? '';
          this.campos.set(r.data.campos);
        }
      });
    }
  }

  addCampo() {
    this.campos.update((c) => [
      ...c,
      { id: crypto.randomUUID(), label: '', tipo: 'text', requerido: false, orden: c.length },
    ]);
  }

  removeCampo(index: number) {
    this.campos.update((c) => c.filter((_, i) => i !== index));
  }

  save() {
    if (!this.titulo.trim()) { this.error.set('El título es requerido.'); return; }
    this.saving.set(true);
    this.error.set('');

    const payload: Partial<Formulario> = {
      titulo: this.titulo,
      descripcion: this.descripcion,
      campos: this.campos().map((c, i) => ({ ...c, orden: i })),
      activo: true,
    };

    const id  = this.route.snapshot.paramMap.get('id');
    const obs = id ? this.svc.update(+id, payload) : this.svc.create(payload);

    obs.subscribe({
      next: () => { this.saving.set(false); this.notify.success(id ? 'Formulario actualizado' : 'Formulario creado', 'El formulario se ha guardado correctamente.'); this.router.navigate(['/app/formularios']); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Error al guardar.'); this.saving.set(false); this.notify.error('Error', e?.error?.message ?? 'Error al guardar el formulario.'); },
    });
  }

  cancel() { this.router.navigate(['/app/formularios']); }
}
