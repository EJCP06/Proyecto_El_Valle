import { Injectable, computed, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'ev_theme';

  private themeSignal = signal<Theme>(this.readStoredTheme());

  theme = this.themeSignal.asReadonly();
  isDark = computed(() => this.themeSignal() === 'dark');

  constructor() {
    this.applyTheme(this.themeSignal());
    window.addEventListener('storage', this.handleStorageChange);
  }

  toggle(): void {
    const nextTheme: Theme = this.themeSignal() === 'light' ? 'dark' : 'light';
    this.setTheme(nextTheme);
  }

  setTheme(theme: Theme): void {
    if (this.themeSignal() === theme) {
      return;
    }

    this.themeSignal.set(theme);
    this.applyTheme(theme);
  }

  private applyTheme(t: Theme): void {
    document.documentElement.classList.toggle('dark', t === 'dark');
    localStorage.setItem(this.STORAGE_KEY, t);
  }

  private readStoredTheme(): Theme {
    return (localStorage.getItem(this.STORAGE_KEY) as Theme) ?? 'light';
  }

  private handleStorageChange = (event: StorageEvent) => {
    if (event.key !== this.STORAGE_KEY || (event.newValue !== 'light' && event.newValue !== 'dark')) {
      return;
    }

    const nextTheme = event.newValue as Theme;
    if (this.themeSignal() !== nextTheme) {
      this.themeSignal.set(nextTheme);
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    }
  };
}
