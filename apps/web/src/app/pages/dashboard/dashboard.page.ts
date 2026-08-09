import { Component, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AlertsService, MeasurementTypesService, ReadingsService, RangesService } from '../../services/data.services';
import { AuthService } from '../../services/auth.service';
import { MetricCardComponent } from '../../shared/metric-card.component';
import { ReadingFormComponent, type ReadingFormPayload } from '../../shared/reading-form.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import type { DashboardData, MeasurementType } from '../../models/models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [
    MetricCardComponent, ReadingFormComponent, EmptyStateComponent, SkeletonComponent,
    StatusBadgeComponent, RouterLink, DatePipe,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <div>
        <h1 class="text-xl font-semibold tracking-tight text-ink">Tu resumen de salud</h1>
        <p class="mt-1 text-sm text-ink-muted">
          @if (dashboard(); as d) {
            {{ totalReadings() }} lecturas registradas
            @if (d.pendingAlerts > 0) {
              <span class="font-medium text-danger">· {{ d.pendingAlerts }} alerta{{ d.pendingAlerts > 1 ? 's' : '' }} pendiente{{ d.pendingAlerts > 1 ? 's' : '' }}</span>
            }
          }
        </p>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          @for (s of [].constructor(6); track $index) {
            <app-skeleton variant="card" />
          }
        </div>
      } @else if (error()) {
        <div class="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
          {{ error() }}
          <button type="button" class="ml-2 font-semibold underline" (click)="load()">Reintentar</button>
        </div>
      } @else if (dashboard(); as d) {
        @if (d.latest.every((l) => !l.reading)) {
          <app-empty-state title="Tu primer registro"
            message="Registra tu primera medición para ver tendencias y alertas personalizadas."
            ctaLabel="Registrar lectura" (cta)="router.navigate(['/readings/new'])" />
        } @else {
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            @for (card of d.latest; track card.type.id) {
              <app-metric-card [card]="card" />
            }
          </div>
        }

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <section class="rounded-lg border border-border bg-surface p-5 lg:col-span-3">
            <h2 class="mb-4 text-base font-semibold text-ink">Registro rápido</h2>
            @if (types(); as types) {
              <app-reading-form [types]="types" [ranges]="rangesMap()" (saved)="onQuickSave($event)" />
            }
          </section>

          <section class="rounded-lg border border-border bg-surface p-5 lg:col-span-2">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-base font-semibold text-ink">Últimas lecturas</h2>
              <a routerLink="/readings" class="text-sm font-medium text-primary hover:underline">Ver todas</a>
            </div>
            <ul class="space-y-2">
              @for (r of d.recent; track r.id) {
                <li class="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-surface-alt">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-ink">{{ r.type?.label }}</p>
                    <p class="text-xs text-ink-faint">{{ r.recordedAt | date:'d MMM, HH:mm' }}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="measurement text-sm text-ink">{{ valueOf(r) }}</span>
                    <app-status-badge [status]="statusOf(r)" />
                  </div>
                </li>
              } @empty {
                <li class="py-6 text-center text-sm text-ink-faint">Aún no hay lecturas</li>
              }
            </ul>
          </section>
        </div>
      }
    </div>
  `,
})
export class DashboardPage {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly dashboard = signal<DashboardData | null>(null);
  readonly types = signal<MeasurementType[] | null>(null);
  readonly ranges = signal<Record<string, { min: number; max: number }>>({});

  constructor(
    public router: Router,
    private readings: ReadingsService,
    private typesSvc: MeasurementTypesService,
    private rangesSvc: RangesService,
    private alerts: AlertsService,
    public auth: AuthService,
  ) {
    this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const [dash, types, ranges] = await Promise.all([
        this.readings.dashboard(),
        this.typesSvc.list(),
        this.rangesSvc.list(),
      ]);
      this.dashboard.set(dash);
      this.types.set(types);
      const map: Record<string, { min: number; max: number }> = {};
      for (const r of ranges) map[r.typeId] = { min: r.min, max: r.max };
      this.ranges.set(map);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudieron cargar los datos');
    } finally {
      this.loading.set(false);
    }
  }

  protected totalReadings = computed(() => {
    const d = this.dashboard();
    if (!d) return 0;
    return d.latest.filter((l) => l.reading).length;
  });

  protected rangesMap = computed(() => this.ranges());

  async onQuickSave(payload: ReadingFormPayload) {
    try {
      await this.readings.create({
        typeId: payload.typeId,
        value: payload.value,
        systolic: payload.systolic,
        diastolic: payload.diastolic,
        recordedAt: payload.recordedAt,
        notes: payload.notes,
        tags: payload.tags,
      });
      await this.load();
      this.alerts.pendingCount().then((r) => r).catch(() => {});
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudo guardar la lectura');
    }
  }

  protected valueOf(r: any): string {
    if (r.systolic !== null && r.diastolic !== null) return `${r.systolic}/${r.diastolic}`;
    return r.value !== null ? String(r.value) : '—';
  }

  protected statusOf(r: any): 'ok' | 'high' | 'low' | 'critical' {
    const card = this.dashboard()?.latest.find((l) => l.type.id === r.typeId);
    return card?.status ?? 'ok';
  }
}
