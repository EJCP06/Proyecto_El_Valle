import { Component, Input, ElementRef, HostListener, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { LucideAngularModule, ChevronDown, CheckCircle2 } from 'lucide-angular';

export interface CustomSelectOption {
  value: any;
  label: string;
}

/**
 * Dropdown personalizado con el mismo diseño que los filtros de Auditoría:
 * botón gris con texto en mayúsculas/negrita, flechita Lucide que rota al abrir
 * y panel con palomita en la opción seleccionada.
 *
 * Implementa ControlValueAccessor, así que se usa con [(ngModel)] igual que un <select>.
 */
@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [LucideAngularModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CustomSelectComponent), multi: true },
  ],
  template: `
    <div class="relative custom-select-container">
      <button
        type="button"
        (click)="toggle()"
        [class]="'w-full flex items-center justify-between gap-2 px-4 min-h-[51px] text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer ' + buttonClass"
      >
        <span class="truncate">{{ label }}</span>
        <lucide-icon [name]="ChevronDown" class="w-3.5 h-3.5 shrink-0 transition-transform duration-200" [class.rotate-180]="open"></lucide-icon>
      </button>
      @if (open) {
        <div class="absolute z-[110] w-full top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border-t-4 border-t-blue-600 left-0">
          <div class="p-1.5 max-h-48 overflow-y-auto">
            @for (opt of options; track opt.value) {
              <div
                (click)="select(opt.value)"
                class="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors rounded-xl flex items-center justify-between gap-2"
                [class.bg-blue-50]="isSelected(opt.value)"
                [class.text-blue-600]="isSelected(opt.value)"
              >
                <span class="truncate">{{ opt.label }}</span>
                @if (isSelected(opt.value)) {
                  <lucide-icon [name]="CheckCircle2" class="w-3.5 h-3.5 shrink-0"></lucide-icon>
                }
              </div>
            }
            @if (options.length === 0) {
              <div class="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">SIN OPCIONES</div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class CustomSelectComponent implements ControlValueAccessor {
  readonly ChevronDown = ChevronDown;
  readonly CheckCircle2 = CheckCircle2;

  @Input() options: CustomSelectOption[] = [];
  @Input() placeholder = '— SELECCIONAR —';
  @Input() buttonClass = '';

  value: any = null;
  open = false;

  private el = inject(ElementRef);

  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) this.open = false;
  }

  get label(): string {
    const found = this.options.find((o) => this.equals(o.value, this.value));
    if (found) return found.label;
    if (this.value !== null && this.value !== undefined && this.value !== '') return String(this.value);
    return this.placeholder;
  }

  /** Comparación tolerante: iguala 1 con "1" (IDs numéricos vs strings). */
  private equals(a: any, b: any): boolean {
    if (a === b) return true;
    if (a !== null && a !== '' && b !== null && b !== '' && !isNaN(Number(a)) && !isNaN(Number(b))) {
      return Number(a) === Number(b);
    }
    return false;
  }

  isSelected(v: any): boolean {
    return this.equals(v, this.value);
  }

  writeValue(v: any): void {
    this.value = v;
  }

  registerOnChange(fn: (v: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  toggle(): void {
    this.open = !this.open;
  }

  select(v: any): void {
    this.value = v;
    this.onChange(v);
    this.onTouched();
    this.open = false;
  }
}
