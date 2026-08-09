import { Component, computed, input } from '@angular/core';
import type { SeriesPoint } from '../models/models';

interface Pt {
  day: string;
  value: number | null;
  out: boolean;
}

@Component({
  selector: 'app-trend-chart',
  template: `
    <div>
      <svg class="block w-full" [attr.viewBox]="viewBox()" role="img"
        [attr.aria-label]="'Tendencia de ' + label()">
        <!-- Grid horizontal -->
        @for (g of gridLines(); track g.y) {
          <line [attr.x1]="pad" [attr.x2]="width - pad" [attr.y1]="g.y" [attr.y2]="g.y"
            stroke="var(--color-border)" stroke-width="1" />
          <text [attr.x]="3" [attr.y]="g.y + 3" class="fill-ink-faint" font-size="9">{{ g.label }}</text>
        }

        <!-- Zona de rango objetivo -->
        <rect [attr.x]="pad" [attr.y]="yFor(rangeMax())" [attr.width]="width - pad * 2"
          [attr.height]="Math.max(yFor(rangeMin()) - yFor(rangeMax()), 0)"
          fill="var(--color-success)" opacity="0.07" rx="2" />

        <!-- Líneas -->
        @if (line('systolic').length > 1) {
          <polyline [attr.points]="line('systolic')" fill="none" stroke="var(--color-primary)"
            stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        }
        @if (line('value').length > 1) {
          <polyline [attr.points]="line('value')" fill="none" stroke="var(--color-secondary)"
            stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        }
        @if (line('diastolic').length > 1) {
          <polyline [attr.points]="line('diastolic')" fill="none" stroke="var(--color-ink-muted)"
            stroke-width="1.4" stroke-dasharray="4 3" stroke-linecap="round" stroke-linejoin="round" />
        }

        <!-- Puntos fuera de rango -->
        @for (p of outPoints(); track p.day) {
          <circle [attr.cx]="xFor(p.day)" [attr.cy]="yFor(p.value!)" r="3.5"
            [attr.fill]="p.out ? 'var(--color-warning)' : 'var(--color-primary)'"
            stroke="var(--color-surface)" stroke-width="1" />
        }
      </svg>
      <div class="mt-2 flex flex-wrap gap-4 text-xs text-ink-muted">
        @if (hasSystolic()) {
          <span class="inline-flex items-center gap-1.5">
            <span class="inline-block h-0.5 w-4 rounded bg-primary"></span> Sistólica
          </span>
        }
        @if (hasValue()) {
          <span class="inline-flex items-center gap-1.5">
            <span class="inline-block h-0.5 w-4 rounded bg-secondary"></span> Valor
          </span>
        }
        @if (hasDiastolic()) {
          <span class="inline-flex items-center gap-1.5">
            <span class="inline-block h-0.5 w-4 rounded bg-ink-muted"></span> Diastólica
          </span>
        }
        <span class="inline-flex items-center gap-1.5">
          <span class="inline-block h-2 w-2 rounded-full bg-warning"></span> Fuera de rango
        </span>
      </div>
    </div>
  `,
})
export class TrendChartComponent {
  readonly series = input.required<SeriesPoint[]>();
  readonly range = input.required<{ min: number; max: number; diastolicMax: number }>();
  readonly label = input('');

  readonly width = 640;
  readonly height = 240;
  protected readonly pad = 34;

  protected readonly Math = Math;

  protected readonly viewBox = computed(() => `0 0 ${this.width} ${this.height}`);

  private values(): number[] {
    const out: number[] = [];
    for (const s of this.series()) {
      if (s.value !== null) out.push(s.value);
      if (s.systolic !== null) out.push(s.systolic);
      if (s.diastolic !== null) out.push(s.diastolic);
    }
    return out;
  }

  protected readonly yMin = computed(() => {
    const vals = this.values();
    const floor = vals.length ? Math.min(...vals) : 0;
    return Math.max(0, Math.floor(floor - 5));
  });

  protected readonly yMax = computed(() => {
    const vals = this.values();
    return Math.ceil((vals.length ? Math.max(...vals) : 100) + 5);
  });

  protected readonly rangeMin = computed(() => this.range().min);
  protected readonly rangeMax = computed(() => this.range().max);

  protected readonly gridLines = computed(() => {
    const lines: Array<{ y: number; label: string }> = [];
    const step = Math.max(1, Math.round((this.yMax() - this.yMin()) / 4));
    for (let v = this.yMin(); v <= this.yMax(); v += step) {
      lines.push({ y: this.yFor(v), label: String(v) });
    }
    return lines;
  });

  protected xFor(day: string): number {
    const n = this.series().length;
    if (n < 2) return this.pad;
    const idx = this.series().findIndex((s) => s.day === day);
    if (idx < 0) return this.pad;
    return this.pad + (idx / (n - 1)) * (this.width - this.pad * 2);
  }

  protected yFor(v: number): number {
    const span = this.yMax() - this.yMin() || 1;
    return this.height - 20 - ((v - this.yMin()) / span) * (this.height - 40);
  }

  protected line(field: 'value' | 'systolic' | 'diastolic'): string {
    return this.series()
      .map((s) => {
        const v = s[field];
        if (v === null || v === undefined) return null;
        return `${this.xFor(s.day).toFixed(1)},${this.yFor(v).toFixed(1)}`;
      })
      .filter((p): p is string => p !== null)
      .join(' ');
  }

  protected hasValue = computed(() => this.series().some((s) => s.value !== null));
  protected hasSystolic = computed(() => this.series().some((s) => s.systolic !== null));
  protected hasDiastolic = computed(() => this.series().some((s) => s.diastolic !== null));

  protected outPoints = computed<Pt[]>(() => {
    const pts: Pt[] = [];
    for (const s of this.series()) {
      if (s.systolic !== null) {
        const out = s.systolic < this.range().min || s.systolic > this.range().max;
        pts.push({ day: s.day, value: s.systolic, out });
      } else if (s.value !== null) {
        const out = s.value < this.range().min || s.value > this.range().max;
        pts.push({ day: s.day, value: s.value, out });
      }
    }
    return pts;
  });
}
