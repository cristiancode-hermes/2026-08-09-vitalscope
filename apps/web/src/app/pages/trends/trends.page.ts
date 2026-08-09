import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MeasurementTypesService, ReadingsService } from '../../services/data.services';
import { TrendChartComponent } from '../../shared/trend-chart.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import type { MeasurementType, TrendsResponse } from '../../models/models';

@Component({
  selector: 'app-trends',
  imports: [TrendChartComponent, EmptyStateComponent, SkeletonComponent],
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-xl font-semibold tracking-tight text-ink">Tendencias</h1>
        <div class="flex gap-1 rounded-md bg-surface-alt p-1 text-sm font-medium">
          @for (d of [7, 30, 90]; track d) {
            <button type="button" (click)="days.set(d); load()"
              class="rounded px-3 py-1.5 transition-colors"
              [class.bg-surface]="days() === d" [class.shadow-sm]="days() === d"
              [class.text-ink]="days() === d" [class.text-ink-muted]="days() !== d">
              {{ d }}d
            </button>
          }
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <select class="input !w-auto" (change)="onTypeChange($event)">
          @for (t of types(); track t.id) {
            <option [value]="t.id" [selected]="selectedTypeId() === t.id">{{ t.label }}</option>
          }
        </select>
        @if (data(); as d) {
          <span class="rounded-full bg-secondary-soft px-3 py-1 text-xs font-medium text-secondary">
            Media 7d: {{ avgDisplay(d) }}
          </span>
        }
      </div>

      @if (loading()) {
        <app-skeleton variant="chart" />
      } @else if (error()) {
        <div class="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
          {{ error() }} <button class="ml-2 font-semibold underline" (click)="load()">Reintentar</button>
        </div>
      } @else if (data(); as d) {
        @if (hasPoints(d)) {
          <div class="rounded-lg border border-border bg-surface p-5">
            <app-trend-chart [series]="d.series" [range]="d.range" [label]="d.type.label" />
          </div>
        } @else {
          <app-empty-state title="Sin datos en este rango"
            message="Registra lecturas de esta métrica para ver su evolución."
            ctaLabel="Registrar lectura" (cta)="router.navigate(['/readings/new'])" />
        }
      }
    </div>
  `,
})
export class TrendsPage {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly data = signal<TrendsResponse | null>(null);
  readonly types = signal<MeasurementType[]>([]);
  readonly days = signal(30);
  readonly selectedTypeId = signal('');

  constructor(
    public router: Router,
    private readings: ReadingsService,
    private typesSvc: MeasurementTypesService,
  ) {
    this.init();
  }

  private async init() {
    try {
      const types = await this.typesSvc.list();
      this.types.set(types);
      this.selectedTypeId.set(types[0]?.id ?? '');
      if (types[0]) await this.load();
      else this.loading.set(false);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Error al cargar');
      this.loading.set(false);
    }
  }

  async load() {
    const typeId = this.selectedTypeId();
    if (!typeId) return;
    this.loading.set(true);
    this.error.set('');
    try {
      this.data.set(await this.readings.trends(typeId, this.days()));
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudieron cargar las tendencias');
    } finally {
      this.loading.set(false);
    }
  }

  onTypeChange(e: Event) {
    this.selectedTypeId.set((e.target as HTMLSelectElement).value);
    this.load();
  }

  protected avgDisplay(d: TrendsResponse) {
    if (d.type.category === 'blood_pressure') {
      return `${Math.round(d.avg7d.systolic)}/${Math.round(d.avg7d.diastolic)} ${d.type.unit}`;
    }
    return `${d.avg7d.value.toFixed(1)} ${d.type.unit}`;
  }

  protected hasPoints(d: TrendsResponse) {
    return d.series.some((s) => s.value !== null || s.systolic !== null);
  }
}
