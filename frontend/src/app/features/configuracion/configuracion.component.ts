import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfiguracionService } from '../../core/services/configuracion.service';
import { CatalogoService, CatalogoItem, CatalogoNombre } from '../../core/services/catalogo.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfiguracionSistema } from '../../core/models/usuario.model';

interface Tab {
  id: string;
  label: string;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">

      <div>
        <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Configuración del Sistema</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">Ajusta parámetros del sistema y administra los catálogos.</p>
      </div>

      <!-- Tabs -->
      <div class="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        @for (t of tabs; track t.id) {
          <button
            (click)="activeTab.set(t.id)"
            class="px-5 py-3 rounded-t-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            [class]="activeTab() === t.id ? 'bg-white dark:bg-slate-900/60 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 border-b-white dark:border-b-slate-900 -mb-px shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
          >
            {{ t.label }}
          </button>
        }
      </div>

      <!-- Panel: Configuración General -->
      @if (activeTab() === 'general') {
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm">
          @if (loadingConfigs()) {
            <div class="flex flex-col items-center justify-center py-12">
              <div class="w-8 h-8 border-[3px] border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
              <span class="text-sm text-slate-500 dark:text-slate-400 mt-4 font-semibold animate-pulse">Cargando configuraciones...</span>
            </div>
          } @else {
            <div class="divide-y divide-slate-100 dark:divide-slate-800/60">
              @for (cfg of configs(); track cfg.clave) {
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 first:pt-0 last:pb-0">
                  <div class="flex-1 space-y-1">
                    <div class="font-mono text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">{{ cfg.clave }}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 font-medium">{{ cfg.descripcion }}</div>
                  </div>
                  <div class="flex items-center gap-3">
                    <input
                      [(ngModel)]="cfg.valor"
                      [name]="cfg.clave"
                      class="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium w-full sm:w-64"
                    />
                    <button
                      (click)="saveConfig(cfg)"
                      class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 transition-all text-xs cursor-pointer"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="text-center py-8 text-sm text-slate-400 dark:text-slate-500 font-medium">
                  No hay configuraciones disponibles.
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Panel: Catálogos -->
      @if (activeTab() !== 'general') {
        <div class="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">{{ activeLabel() }}</h3>
            <button
              (click)="addItem()"
              class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition-all text-xs cursor-pointer"
            >
              <span>+</span> Agregar
            </button>
          </div>

          @if (loadingCatalogo()) {
            <div class="flex flex-col items-center justify-center py-12">
              <div class="w-8 h-8 border-[3px] border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          } @else {
            <!-- Add Form -->
            @if (showForm()) {
              <div class="flex items-center gap-3 mb-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                <input
                  #newInput
                  [(ngModel)]="newNombre"
                  name="newNombre"
                  placeholder="Nombre del nuevo elemento"
                  class="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-medium text-sm"
                  (keyup.enter)="saveNew()"
                />
                <button (click)="saveNew()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all text-xs cursor-pointer">Guardar</button>
                <button (click)="cancelNew()" class="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all text-xs cursor-pointer">Cancelar</button>
              </div>
            }

            <!-- Items -->
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-50/75 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th class="px-4 py-3">#</th>
                    <th class="px-4 py-3">Nombre</th>
                    <th class="px-4 py-3">Estado</th>
                    <th class="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                  @for (item of catalogoItems(); track item.id) {
                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td class="px-4 py-3 text-xs text-slate-400 font-mono">{{ item.id }}</td>
                      <td class="px-4 py-3 text-sm font-bold text-slate-800 dark:text-white">{{ item.nombre }}</td>
                      <td class="px-4 py-3">
                        <span
                          class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold"
                          [class]="item.activo ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'"
                        >
                          {{ item.activo ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-right">
                        <div class="inline-flex items-center gap-2">
                          <button
                            (click)="toggleActivo(item)"
                            class="text-xs font-bold text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
                          >
                            {{ item.activo ? 'Desactivar' : 'Activar' }}
                          </button>
                          <button
                            (click)="deleteItem(item)"
                            class="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4" class="px-4 py-10 text-center text-sm text-slate-400 dark:text-slate-500 font-medium">
                        No hay elementos en este catálogo.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

    </div>
  `,
  styles: []
})
export class ConfiguracionComponent implements OnInit {
  private cfgSvc = inject(ConfiguracionService);
  private catSvc = inject(CatalogoService);
  private notify = inject(NotificationService);

  tabs: Tab[] = [
    { id: 'general', label: 'General' },
    { id: 'parentescos', label: 'Parentescos' },
    { id: 'estados-civiles', label: 'Estados Civiles' },
    { id: 'niveles-educativos', label: 'Niveles Educativos' },
    { id: 'ocupaciones', label: 'Ocupaciones' },
    { id: 'tipos-vivienda', label: 'Tipos de Vivienda' },
    { id: 'tipos-discapacidad', label: 'Tipos de Discapacidad' },
  ];

  activeTab = signal('general');
  activeLabel() {
    return this.tabs.find((t) => t.id === this.activeTab())?.label ?? '';
  }

  configs = signal<ConfiguracionSistema[]>([]);
  loadingConfigs = signal(true);

  catalogoItems = signal<CatalogoItem[]>([]);
  loadingCatalogo = signal(false);
  showForm = signal(false);
  newNombre = '';

  ngOnInit() {
    this.loadConfigs();
  }

  loadConfigs() {
    this.cfgSvc.getAll().subscribe({
      next: (r) => { this.configs.set(r.data); this.loadingConfigs.set(false); },
      error: () => this.loadingConfigs.set(false),
    });
  }

  loadCatalogo() {
    const tab = this.activeTab();
    if (tab === 'general') return;
    const catalogo = tab as CatalogoNombre;
    this.loadingCatalogo.set(true);
    this.catSvc.getAll(catalogo).subscribe({
      next: (r) => { this.catalogoItems.set(r.data); this.loadingCatalogo.set(false); },
      error: () => this.loadingCatalogo.set(false),
    });
  }

  saveConfig(cfg: ConfiguracionSistema) {
    this.cfgSvc.update(cfg.clave, cfg.valor).subscribe({
      next: () => this.notify.success('Configuración actualizada', `"${cfg.clave}" se ha actualizado correctamente.`),
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al guardar.'),
    });
  }

  addItem() {
    this.showForm.set(true);
    this.newNombre = '';
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>('[name="newNombre"]');
      el?.focus();
    }, 50);
  }

  cancelNew() {
    this.showForm.set(false);
    this.newNombre = '';
  }

  saveNew() {
    if (!this.newNombre.trim()) return;
    this.catSvc.create(this.activeTab() as CatalogoNombre, this.newNombre.trim()).subscribe({
      next: () => {
        this.notify.success('Elemento agregado');
        this.showForm.set(false);
        this.newNombre = '';
        this.loadCatalogo();
      },
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al guardar.'),
    });
  }

  async toggleActivo(item: CatalogoItem) {
    const confirmed = await this.notify.confirm(
      item.activo ? '¿Desactivar elemento?' : '¿Activar elemento?',
      `Se cambiará el estado de "${item.nombre}".`
    );
    if (!confirmed) return;
    this.catSvc.update(this.activeTab() as CatalogoNombre, item.id, { activo: !item.activo }).subscribe({
      next: () => { this.notify.success('Estado actualizado'); this.loadCatalogo(); },
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al actualizar.'),
    });
  }

  async deleteItem(item: CatalogoItem) {
    const confirmed = await this.notify.confirm('¿Eliminar elemento?', `Se eliminará "${item.nombre}" de forma permanente.`);
    if (!confirmed) return;
    this.catSvc.delete(this.activeTab() as CatalogoNombre, item.id).subscribe({
      next: () => { this.notify.success('Elemento eliminado'); this.loadCatalogo(); },
      error: (e) => this.notify.error('Error', e?.error?.message ?? 'Error al eliminar.'),
    });
  }
}
