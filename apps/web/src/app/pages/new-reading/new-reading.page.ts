import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MeasurementTypesService, RangesService, ReadingsService } from '../../services/data.services';
import { ReadingFormComponent, type ReadingFormPayload } from '../../shared/reading-form.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import type { MeasurementType } from '../../models/models';

@Component({
  selector: 'app-new-reading',
  imports: [ReadingFormComponent, SkeletonComponent, RouterLink],
  template: `
    <div class="mx-auto max-w-xl">
      <div class="mb-5">
        <a routerLink="/readings" class="text-sm text-ink-muted hover:text-ink">← Lecturas</a>
        <h1 class="mt-1 text-xl font-semibold tracking-tight text-ink">Nueva lectura</h1>
      </div>

      @if (loading()) {
        <app-skeleton variant="table" [rows]="4" />
      } @else if (error()) {
        <div class="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
          {{ error() }} <button class="ml-2 font-semibold underline" (click)="load()">Reintentar</button>
        </div>
      } @else {
        <div class="rounded-lg border border-border bg-surface p-6">
          <app-reading-form [types]="types()" [ranges]="rangesMap()"
            (saved)="onSave($event)" />
        </div>
      }
    </div>
  `,
})
export class NewReadingPage {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly types = signal<MeasurementType[]>([]);
  readonly ranges = signal<Record<string, { min: number; max: number }>>({});

  constructor(
    private router: Router,
    private readings: ReadingsService,
    private typesSvc: MeasurementTypesService,
    private rangesSvc: RangesService,
  ) {
    this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const [types, ranges] = await Promise.all([this.typesSvc.list(), this.rangesSvc.list()]);
      this.types.set(types);
      const map: Record<string, { min: number; max: number }> = {};
      for (const r of ranges) map[r.typeId] = { min: r.min, max: r.max };
      this.ranges.set(map);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudieron cargar los tipos');
    } finally {
      this.loading.set(false);
    }
  }

  protected rangesMap = () => this.ranges();

  async onSave(payload: ReadingFormPayload) {
    this.error.set('');
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
      this.router.navigate(['/readings']);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudo guardar la lectura');
    }
  }
}
