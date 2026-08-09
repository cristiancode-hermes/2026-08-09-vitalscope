import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AppointmentsService } from '../services/data.services';
import type { Appointment } from '../models/models';

@Component({
  selector: 'app-appointment-row',
  imports: [DatePipe],
  template: `
    <li class="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <div class="min-w-0">
        <p class="text-sm font-medium text-ink">
          {{ appt().scheduledAt | date:'d MMM y, HH:mm' }}
          <span class="text-ink-muted">· {{ appt().provider?.name }}</span>
        </p>
        <p class="truncate text-xs text-ink-muted">{{ appt().reason || 'Sin motivo' }}</p>
        @if (appt().notes) {
          <p class="mt-0.5 truncate text-xs text-ink-faint">Nota: {{ appt().notes }}</p>
        }
      </div>
      <button type="button" class="shrink-0 text-xs font-medium text-danger hover:underline"
        (click)="askDelete()">Borrar</button>
    </li>
  `,
})
export class AppointmentRowComponent {
  readonly appt = input.required<Appointment>();
  readonly deleted = output<void>();

  constructor(private appointmentsSvc: AppointmentsService) {}

  async askDelete() {
    await this.appointmentsSvc.remove(this.appt().id);
    this.deleted.emit();
  }
}
