import { Component, computed, input } from '@angular/core';
import type { LatestReading, ReadingStatus } from '../models/models';
import { StatusBadgeComponent } from './status-badge.component';
import { SparklineComponent } from './sparkline.component';
import { iconSvg } from './icons';

@Component({
  selector: 'app-metric-card',
  imports: [StatusBadgeComponent, SparklineComponent],
  template: `
    <div class="flex h-full flex-col gap-2 rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors duration-200 hover:border-primary/30">
      <div class="flex items-start justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"
            [innerHTML]="iconHtml()"></span>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-ink">{{ card().type.label }}</p>
            <p class="text-xs text-ink-faint">{{ card().type.unit }}</p>
          </div>
        </div>
        @if (card().status) {
          <app-status-badge [status]="card().status!" />
        }
      </div>

      <div class="flex items-end justify-between gap-2">
        <div>
          @if (card().reading) {
            <p class="measurement text-[1.75rem] font-semibold leading-tight text-ink">
              {{ displayValue() }}
            </p>
          } @else {
            <p class="text-sm text-ink-faint">Sin datos</p>
          }
        </div>
        @if (card().sparkline.length > 1) {
          <app-sparkline [data]="card().sparkline" [color]="sparkColor()" />
        }
      </div>
    </div>
  `,
})
export class MetricCardComponent {
  readonly card = input.required<LatestReading>();

  protected readonly iconHtml = computed(() => iconSvg(this.card().type.icon, 'w-4 h-4'));

  protected readonly displayValue = computed(() => {
    const r = this.card().reading;
    if (!r) return '—';
    if (this.card().type.category === 'blood_pressure') {
      return `${r.systolic}/${r.diastolic}`;
    }
    return r.value;
  });

  protected readonly sparkColor = computed(() => {
    switch (this.card().status as ReadingStatus | null) {
      case 'high':
      case 'critical':
        return 'var(--color-warning)';
      case 'low':
        return 'var(--color-secondary)';
      default:
        return 'var(--color-primary)';
    }
  });
}
