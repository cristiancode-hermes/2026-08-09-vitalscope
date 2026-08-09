import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import type { Reading } from '../models/models';
import { StatusBadgeComponent } from './status-badge.component';
import { RangeEvaluatorClient } from './range-evaluator';
import { iconSvg } from './icons';

@Component({
  selector: 'app-reading-table',
  imports: [DatePipe, StatusBadgeComponent],
  template: `
    <div class="overflow-x-auto rounded-lg border border-border bg-surface">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
            <th class="px-4 py-3 font-semibold">Tipo</th>
            <th class="px-4 py-3 font-semibold">Valor</th>
            <th class="px-4 py-3 font-semibold">Fecha</th>
            <th class="hidden px-4 py-3 font-semibold sm:table-cell">Tags</th>
            <th class="px-4 py-3 text-right font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody>
          @for (r of readings(); track r.id) {
            <tr class="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-surface-alt"
              (click)="rowClick.emit(r)">
              <td class="px-4 py-3 font-medium text-ink">{{ r.type?.label ?? r.typeId }}</td>
              <td class="px-4 py-3">
                <span class="measurement text-ink">{{ displayValue(r) }}</span>
                <span class="ml-1 text-xs text-ink-faint">{{ r.unit }}</span>
              </td>
              <td class="px-4 py-3 text-ink-muted">{{ r.recordedAt | date:'d MMM HH:mm' }}</td>
              <td class="hidden px-4 py-3 sm:table-cell">
                <div class="flex flex-wrap gap-1">
                  @for (t of r.tags; track t) {
                    <span class="rounded-full bg-secondary-soft px-2 py-0.5 text-xs text-secondary">{{ t }}</span>
                  }
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <app-status-badge [status]="RangeEvaluatorClient.status(r)" />
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="5" class="px-4 py-10 text-center text-sm text-ink-faint">
                <span class="mb-2 block text-2xl" [innerHTML]="iconEmpty()"></span>
                Sin lecturas que mostrar
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class ReadingTableComponent {
  readonly readings = input.required<Reading[]>();

  readonly rowClick = output<Reading>();

  protected readonly RangeEvaluatorClient = RangeEvaluatorClient;

  protected displayValue(r: Reading): string {
    if (r.systolic !== null && r.diastolic !== null) return `${r.systolic}/${r.diastolic}`;
    if (r.value !== null) return String(r.value);
    return '—';
  }

  protected iconEmpty = () => iconSvg('heart', 'w-6 h-6 mx-auto text-ink-faint');
}
