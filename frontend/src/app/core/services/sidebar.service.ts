import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private isOpenSignal = signal(false);

  isOpen = this.isOpenSignal.asReadonly();

  constructor() {
    effect(() => {
      if (typeof document !== 'undefined') {
        if (this.isOpenSignal()) {
          document.body.classList.add('overflow-hidden');
        } else {
          document.body.classList.remove('overflow-hidden');
        }
      }
    });
  }

  open(): void {
    this.isOpenSignal.set(true);
  }

  close(): void {
    this.isOpenSignal.set(false);
  }

  toggle(): void {
    this.isOpenSignal.set(!this.isOpenSignal());
  }
}
