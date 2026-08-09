import { Injectable, effect, signal } from '@angular/core';

export type ThemePref = 'light' | 'dark' | 'auto';
const THEME_KEY = 'vs_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private pref = signal<ThemePref>(this.readPref());
  readonly preference = this.pref.asReadonly();

  constructor() {
    effect(() => this.apply(this.pref()));
    // Escucha cambios del sistema cuando está en auto.
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.pref() === 'auto') this.apply('auto');
    });
  }

  set(pref: ThemePref) {
    this.pref.set(pref);
    localStorage.setItem(THEME_KEY, pref);
  }

  private apply(pref: ThemePref) {
    const dark =
      pref === 'dark' ||
      (pref === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  }

  private readPref(): ThemePref {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored;
    return 'auto';
  }
}
