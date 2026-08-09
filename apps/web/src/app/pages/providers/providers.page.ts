import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProvidersService } from '../../services/data.services';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import type { Provider } from '../../models/models';

@Component({
  selector: 'app-providers',
  imports: [RouterLink, FormsModule, EmptyStateComponent, SkeletonComponent],
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-xl font-semibold tracking-tight text-ink">Profesionales</h1>
        <button type="button" class="btn-primary text-sm" (click)="showForm.set(true)">＋ Añadir</button>
      </div>

      @if (showForm()) {
        <form (ngSubmit)="create()" class="grid gap-3 rounded-lg border border-border bg-surface p-5 sm:grid-cols-2">
          <div>
            <label class="label" for="p-name">Nombre *</label>
            <input id="p-name" type="text" [(ngModel)]="form.name" name="pName" required class="input" />
          </div>
          <div>
            <label class="label" for="p-spec">Especialidad</label>
            <input id="p-spec" type="text" [(ngModel)]="form.specialty" name="pSpecialty" class="input" />
          </div>
          <div>
            <label class="label" for="p-phone">Teléfono</label>
            <input id="p-phone" type="tel" [(ngModel)]="form.phone" name="pPhone" class="input" />
          </div>
          <div>
            <label class="label" for="p-email">Email</label>
            <input id="p-email" type="email" [(ngModel)]="form.email" name="pEmail" class="input" />
          </div>
          <div class="sm:col-span-2">
            <label class="label" for="p-notes">Notas</label>
            <input id="p-notes" type="text" [(ngModel)]="form.notes" name="pNotes" class="input" />
          </div>
          <div class="flex gap-2 sm:col-span-2">
            <button type="submit" class="btn-primary text-sm">Guardar</button>
            <button type="button" class="btn-ghost text-sm" (click)="showForm.set(false)">Cancelar</button>
          </div>
        </form>
      }

      @if (loading()) {
        <app-skeleton variant="table" [rows]="3" />
      } @else if (error()) {
        <div class="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
          {{ error() }} <button class="ml-2 font-semibold underline" (click)="load()">Reintentar</button>
        </div>
      } @else if (providers(); as list) {
        @if (list.length === 0) {
          <app-empty-state title="Sin profesionales"
            message="Guarda a tus médicos con su especialidad y contacto."
            ctaLabel="＋ Añadir primer profesional" (cta)="showForm.set(true)" />
        } @else {
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            @for (p of list; track p.id) {
              <div class="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/30">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex min-w-0 items-center gap-3">
                    <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary-soft text-sm font-bold text-secondary">
                      {{ initials(p.name) }}
                    </span>
                    <div class="min-w-0">
                      <p class="truncate font-semibold text-ink">{{ p.name }}</p>
                      <p class="text-xs text-ink-muted">{{ p.specialty || 'Sin especialidad' }}</p>
                    </div>
                  </div>
                  <a [routerLink]="['/providers', p.id]" class="shrink-0 text-sm font-medium text-primary hover:underline">Ver</a>
                </div>
                @if (p.phone || p.email) {
                  <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-ink-muted">
                    @if (p.phone) {
                      <span>☎ {{ p.phone }}</span>
                    }
                    @if (p.email) {
                      <span>{{ p.email }}</span>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export class ProvidersPage {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly providers = signal<Provider[] | null>(null);
  readonly showForm = signal(false);
  readonly form: Partial<Provider> = {};

  constructor(
    public router: Router,
    private providersSvc: ProvidersService,
  ) {
    this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      this.providers.set(await this.providersSvc.list());
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudieron cargar los profesionales');
    } finally {
      this.loading.set(false);
    }
  }

  async create() {
    if (!this.form.name) return;
    try {
      await this.providersSvc.create(this.form);
      this.showForm.set(false);
      this.form.name = '';
      this.form.specialty = '';
      this.form.phone = '';
      this.form.email = '';
      this.form.notes = '';
      await this.load();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudo crear el profesional');
    }
  }

  protected initials(name: string) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase();
  }
}
