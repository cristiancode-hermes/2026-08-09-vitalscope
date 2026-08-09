import { Component, computed, input } from '@angular/core';
import type { ReadingStatus } from '../models/models';

const LABELS: Record<ReadingStatus, string> = {
  ok: 'En rango',
  high: 'Alta',
  low: 'Baja',
  critical: 'Crítica',
};

@Component({
  selector: 'app-status-badge',
  template: `
    <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
      [class]="classes()">
      <span class="inline-block h-1.5 w-1.5 rounded-full" [class]="dotClasses()"></span>
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<ReadingStatus>();

  readonly label = computed(() => LABELS[this.status()] ?? 'En rango');

  readonly classes = computed(() => {
    switch (this.status()) {
      case 'ok':
        return 'bg-success-soft text-success';
      case 'high':
        return 'bg-warning-soft text-warning';
      case 'low':
        return 'bg-secondary-soft text-secondary';
      case 'critical':
        return 'bg-danger-soft text-danger';
      default:
        return 'bg-surface-alt text-ink-muted';
    }
  });

  readonly dotClasses = computed(() => {
    switch (this.status()) {
      case 'ok':
        return 'bg-success';
      case 'high':
        return 'bg-warning';
      case 'low':
        return 'bg-secondary';
      case 'critical':
        return 'bg-danger';
      default:
        return 'bg-ink-faint';
    }
  });
}
