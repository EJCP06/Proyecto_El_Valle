import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-between px-4 md:px-8 py-4 border-t border-slate-100 dark:border-slate-800 gap-2">
      <div class="text-xs text-slate-400 font-bold">
        {{ endItem }} de {{ totalItems }}
      </div>
      <div class="flex items-center gap-2">
        <button
          (click)="goToPage(currentPage - 1, $event)"
          [disabled]="currentPage <= 1"
          class="flex items-center justify-center w-7 h-7 text-xs font-bold rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          [class.hover:bg-slate-100]="currentPage > 1"
          [class.text-slate-500]="currentPage > 1"
          [class.text-slate-300]="currentPage <= 1"
        >
          &lsaquo;
        </button>

        <span class="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
          {{ currentPage }} / {{ totalPages }}
        </span>

        <button
          (click)="goToPage(currentPage + 1, $event)"
          [disabled]="currentPage >= totalPages"
          class="flex items-center justify-center w-7 h-7 text-xs font-bold rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          [class.hover:bg-slate-100]="currentPage < totalPages"
          [class.text-slate-500]="currentPage < totalPages"
          [class.text-slate-300]="currentPage >= totalPages"
        >
          &rsaquo;
        </button>
      </div>
    </div>
  `
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 8;
  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  get startItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  goToPage(page: number, event?: Event): void {
    if (event?.target) {
      (event.target as HTMLElement).blur();
    }
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.pageChange.emit(page);
  }
}
