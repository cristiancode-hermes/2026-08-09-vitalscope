import { Component, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AppointmentsService, ProvidersService } from '../../services/data.services';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import type { Appointment, Provider } from '../../models/models';

@Component({
  selector: 'app-provider-detail',
  imports: [RouterLink, DatePipe, ConfirmDialogComponent, SkeletonComponent],
  template: `
    <div class="mx-auto max-w-2xl">
      <a routerLink="/providers" class="text-sm text-ink-muted hover:text-ink">← Profesionales</a>

      @if (loading()) {
        <app-skeleton variant="table" [rows]="4" />
      } @else if (error()) {
        <div class="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">{{ error() }}</div>
      } @else if (provider(); as p) {
        <div class="mt-4 rounded-lg border border-border bg-surface p-6">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-4">
              <span class="grid h-14 w-14 place-items-center rounded-full bg-secondary-soft text-lg font-bold text-secondary">
                {{ initials(p.name) }}
              </span>
              <div>
                <h1 class="text-xl font-semibold tracking-tight text-ink">{{ p.name }}</h1>
                <p class="text-sm text-ink-muted">{{ p.specialty || 'Sin especialidad' }}</p>
              </div>
            </div>
            <button type="button" class="btn-danger text-sm" (click)="confirmDelete.set(true)">Borrar</button>
          </div>

          <dl class="mt-5 grid grid-cols-1 gap-3 border-t border-border pt-5 text-sm sm:grid-cols-2">
            @if (p.phone) {
              <div><dt class="text-xs uppercase tracking-wide text-ink-faint">Teléfono</dt><dd class="mt-0.5 text-ink">{{ p.phone }}</dd></div>
            }
            @if (p.email) {
              <div><dt class="text-xs uppercase tracking-wide text-ink-faint">Email</dt><dd class="mt-0.5 text-ink">{{ p.email }}</dd></div>
            }
            @if (p.address) {
              <div class="sm:col-span-2"><dt class="text-xs uppercase tracking-wide text-ink-faint">Dirección</dt><dd class="mt-0.5 text-ink">{{ p.address }}</dd></div>
            }
            @if (p.notes) {
              <div class="sm:col-span-2"><dt class="text-xs uppercase tracking-wide text-ink-faint">Notas</dt><dd class="mt-0.5 text-ink">{{ p.notes }}</dd></div>
            }
          </dl>
        </div>

        <h2 class="mb-3 mt-6 text-base font-semibold text-ink">Citas con este profesional</h2>
        @if (appointments(); as apps) {
          @if (apps.length === 0) {
            <p class="rounded-lg border border-dashed border-border bg-surface/50 px-4 py-8 text-center text-sm text-ink-faint">
              Sin citas registradas
            </p>
          } @else {
            <ul class="space-y-2">
              @for (a of apps; track a.id) {
                <li class="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
                  <div>
                    <p class="text-sm font-medium text-ink">{{ a.scheduledAt | date:'d MMM y, HH:mm' }}</p>
                    <p class="text-xs text-ink-muted">{{ a.reason || 'Sin motivo' }}</p>
                  </div>
                  <a routerLink="/appointments" class="text-sm font-medium text-primary hover:underline">Ver</a>
                </li>
              }
            </ul>
          }
        }
      }

      @if (confirmDelete()) {
        <app-confirm-dialog title="¿Borrar este profesional?"
          message="Se eliminará junto con sus citas asociadas."
          (confirm)="doDelete()" (cancel)="confirmDelete.set(false)" />
      }
    </div>
  `,
})
export class ProviderDetailPage {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly provider = signal<Provider | null>(null);
  readonly appointments = signal<Appointment[] | null>(null);
  readonly confirmDelete = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private providersSvc: ProvidersService,
    private appointmentsSvc: AppointmentsService,
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  async load(id: string) {
    this.loading.set(true);
    this.error.set('');
    try {
      const [p, apps] = await Promise.all([
        this.providersSvc.get(id),
        this.appointmentsSvc.list('all'),
      ]);
      this.provider.set(p);
      this.appointments.set(apps.filter((a) => a.providerId === id));
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudo cargar el profesional');
    } finally {
      this.loading.set(false);
    }
  }

  async doDelete() {
    const p = this.provider();
    if (!p) return;
    await this.providersSvc.remove(p.id);
    this.router.navigate(['/providers']);
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
