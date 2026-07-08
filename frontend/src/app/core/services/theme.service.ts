import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'ev_theme';

  private themeSignal = signal<Theme>(
    (localStorage.getItem(this.STORAGE_KEY) as Theme) ?? 'light'
  );

  theme = this.themeSignal.asReadonly();

  constructor() {
    this.applyTheme(this.themeSignal());
  }

  toggle(): void {
    const nextTheme = this.themeSignal() === 'light' ? 'dark' : 'light';
    this.themeSignal.set(nextTheme);
    this.applyTheme(nextTheme);
  }

  private applyTheme(t: Theme): void {
    document.documentElement.classList.toggle('dark', t === 'dark');
    localStorage.setItem(this.STORAGE_KEY, t);
  }
}
