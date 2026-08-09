import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AlertsService } from '../../services/data.services';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import type { Alert } from '../../models/models';
import { iconSvg } from '../../shared/icons';

@Component({
  selector: 'app-alerts',
  imports: [DatePipe, EmptyStateComponent, SkeletonComponent],
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-xl font-semibold tracking-tight text-ink">Alertas</h1>
        <div class="flex gap-1 rounded-md bg-surface-alt p-1 text-sm font-medium">
          <button type="button" (click)="showAcked.set(false); load()"
            class="rounded px-3 py-1.5 transition-colors"
            [class.bg-surface]="!showAcked()" [class.shadow-sm]="!showAcked()"
            [class.text-ink]="!showAcked()" [class.text-ink-muted]="showAcked()">
            Pendientes ({{ pending() }})
          </button>
          <button type="button" (click)="showAcked.set(true); load()"
            class="rounded px-3 py-1.5 transition-colors"
            [class.bg-surface]="showAcked()" [class.shadow-sm]="showAcked()"
            [class.text-ink]="showAcked()" [class.text-ink-muted]="!showAcked()">
            Revisadas
          </button>
        </div>
      </div>

      @if (loading()) {
        <app-skeleton variant="table" [rows]="3" />
      } @else if (error()) {
        <div class="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
          {{ error() }} <button class="ml-2 font-semibold underline" (click)="load()">Reintentar</button>
        </div>
      } @else if (alerts(); as items) {
        @if (items.length === 0) {
          <app-empty-state title="Todo en orden"
            message="No hay alertas de lecturas fuera de rango." />
        } @else {
          <ul class="space-y-3">
            @for (a of items; track a.id) {
              <li class="rounded-lg border border-border bg-surface p-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                        [class.bg-warning-soft]="a.severity === 'high'"
                        [class.text-warning]="a.severity === 'high'"
                        [class.bg-secondary-soft]="a.severity === 'low'"
                        [class.text-secondary]="a.severity === 'low'"
                        [class.bg-danger-soft]="a.severity === 'critical'"
                        [class.text-danger]="a.severity === 'critical'">
                        <span [innerHTML]="alertIcon(a.severity)"></span>
                        {{ severityLabel(a.severity) }}
                      </span>
                      <span class="text-xs text-ink-faint">{{ a.createdAt | date:'d MMM y, HH:mm' }}</span>
                    </div>
                    <p class="mt-2 text-sm text-ink">{{ a.message }}</p>
                    <button type="button" class="mt-1 text-xs font-medium text-primary hover:underline"
                      (click)="openReading(a)">
                      Ver lectura →
                    </button>
                  </div>
                  @if (!a.acknowledgedAt) {
                    <button type="button" class="btn-secondary shrink-0 !px-3 !py-1.5 text-xs"
                      (click)="ack(a)">Marcar revisada</button>
                  }
                </div>
              </li>
            }
          </ul>
        }
      }
    </div>
  `,
})
export class AlertsPage {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly alerts = signal<Alert[] | null>(null);
  readonly pending = signal(0);
  readonly showAcked = signal(false);

  constructor(
    private router: Router,
    private alertsSvc: AlertsService,
  ) {
    this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const res = await this.alertsSvc.list(this.showAcked(), 1, 50);
      this.alerts.set(res.items);
      const count = await this.alertsSvc.pendingCount();
      this.pending.set(count.pending);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudieron cargar las alertas');
    } finally {
      this.loading.set(false);
    }
  }

  async ack(a: Alert) {
    await this.alertsSvc.acknowledge(a.id);
    await this.load();
  }

  openReading(a: Alert) {
    this.router.navigate(['/readings', a.readingId]);
  }

  protected severityLabel(s: string) {
    return s === 'high' ? 'Alta' : s === 'low' ? 'Baja' : 'Crítica';
  }

  protected alertIcon = (s: string) => iconSvg('alert', 'h-3 w-3');
}
