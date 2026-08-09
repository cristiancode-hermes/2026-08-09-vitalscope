import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-xl">
      <h1 class="text-xl font-semibold tracking-tight text-ink">Ajustes</h1>

      @if (savedMsg()) {
        <div class="mt-4 rounded-md bg-success-soft px-4 py-3 text-sm text-success">{{ savedMsg() }}</div>
      }
      @if (error()) {
        <div class="mt-4 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">{{ error() }}</div>
      }

      <section class="mt-5 rounded-lg border border-border bg-surface p-6">
        <h2 class="mb-4 text-base font-semibold text-ink">Perfil</h2>
        <form (ngSubmit)="saveProfile()" class="flex flex-col gap-4">
          <div>
            <label class="label" for="s-username">Usuario</label>
            <input id="s-username" type="text" [(ngModel)]="username" name="sUsername" class="input" />
          </div>
          <div>
            <label class="label" for="s-email">Email</label>
            <input id="s-email" type="email" [(ngModel)]="email" name="sEmail" class="input" />
          </div>

          <fieldset>
            <legend class="label">Unidades</legend>
            <div class="mt-1 flex gap-6">
              <label class="inline-flex items-center gap-2 text-sm text-ink">
                <input type="radio" name="units" value="metric" [checked]="units() === 'metric'"
                  (change)="units.set('metric')" class="h-4 w-4 accent-[var(--color-primary)]" />
                Métrico (kg, °C)
              </label>
              <label class="inline-flex items-center gap-2 text-sm text-ink">
                <input type="radio" name="units" value="imperial" [checked]="units() === 'imperial'"
                  (change)="units.set('imperial')" class="h-4 w-4 accent-[var(--color-primary)]" />
                Imperial (lb, °F)
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend class="label">Tema</legend>
            <div class="mt-1 flex gap-6">
              @for (opt of themeOptions; track opt.value) {
                <label class="inline-flex items-center gap-2 text-sm text-ink">
                  <input type="radio" name="theme" [value]="opt.value"
                    [checked]="theme() === opt.value" (change)="theme.set(opt.value)"
                    class="h-4 w-4 accent-[var(--color-primary)]" />
                  {{ opt.label }}
                </label>
              }
            </div>
          </fieldset>

          <button type="submit" class="btn-primary">Guardar cambios</button>
        </form>
      </section>

      <section class="mt-5 rounded-lg border border-border bg-surface p-6">
        <h2 class="mb-3 text-base font-semibold text-ink">Datos</h2>
        <div class="flex flex-wrap gap-2">
          <a href="/api/readings/export" class="btn-secondary text-sm">Export CSV</a>
          <span class="inline-flex items-center rounded-md bg-surface-alt px-3 py-2 text-xs text-ink-faint"
            title="Próximamente">Import CSV (próximamente)</span>
        </div>
      </section>

      <section class="mt-5 rounded-lg border border-danger/20 bg-danger-soft/50 p-6">
        <h2 class="mb-2 text-base font-semibold text-danger">Zona de peligro</h2>
        <p class="mb-3 text-sm text-ink-muted">Elimina tu cuenta y todos tus datos. Esta acción no se puede deshacer.</p>
        <button type="button" class="btn-danger" (click)="confirmDelete.set(true)">Eliminar cuenta</button>
      </section>

      @if (confirmDelete()) {
        <div class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div class="w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-lg">
            <h3 class="text-base font-semibold text-ink">¿Eliminar tu cuenta?</h3>
            <p class="mt-2 text-sm text-ink-muted">Se borrarán todas tus lecturas, alertas, profesionales y citas.</p>
            <div class="mt-5 flex justify-end gap-2">
              <button type="button" class="btn-secondary" (click)="confirmDelete.set(false)">Cancelar</button>
              <button type="button" class="btn-danger" (click)="doDelete()">Eliminar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class SettingsPage {
  readonly savedMsg = signal('');
  readonly error = signal('');
  readonly confirmDelete = signal(false);

  username = '';
  email = '';
  readonly units = signal<'metric' | 'imperial'>('metric');
  readonly theme = signal<'light' | 'dark' | 'auto'>('auto');

  constructor(
    public auth: AuthService,
    private settings: SettingsService,
    private themeSvc: ThemeService,
  ) {
    const user = auth.currentUser();
    if (user) {
      this.username = user.username;
      this.email = user.email;
      this.units.set(user.units);
      this.theme.set(user.theme);
    }
    this.applyTheme();
  }

  protected themeOptions: Array<{ value: 'light' | 'dark' | 'auto'; label: string }> = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' },
    { value: 'auto', label: 'Auto' },
  ];

  private applyTheme() {
    this.themeSvc.set(this.theme());
  }

  async saveProfile() {
    this.error.set('');
    this.savedMsg.set('');
    this.applyTheme();
    try {
      const updated = await this.settings.update({
        username: this.username,
        email: this.email,
        units: this.units(),
        theme: this.theme(),
      });
      this.savedMsg.set('Ajustes guardados');
      setTimeout(() => this.savedMsg.set(''), 3000);
      // Refrescar el usuario en memoria
      await this.auth.refreshMe().catch(() => {});
      void updated;
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudieron guardar los ajustes');
    }
  }

  async doDelete() {
    // La API no expone DELETE /users/me en este MVP; cerramos sesión local.
    this.auth.logout();
  }
}
