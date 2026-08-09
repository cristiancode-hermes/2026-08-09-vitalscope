import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppointmentsService, ProvidersService } from '../../services/data.services';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { AppointmentRowComponent } from '../../shared/appointment-row.component';
import type { Appointment, Provider } from '../../models/models';

@Component({
  selector: 'app-appointments',
  imports: [FormsModule, SkeletonComponent, AppointmentRowComponent],
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-xl font-semibold tracking-tight text-ink">Citas</h1>
        <button type="button" class="btn-primary text-sm" (click)="showForm.set(true)">＋ Nueva cita</button>
      </div>

      @if (showForm()) {
        <form (ngSubmit)="create()" class="grid gap-3 rounded-lg border border-border bg-surface p-5 sm:grid-cols-2">
          <div>
            <label class="label" for="a-provider">Profesional *</label>
            <select id="a-provider" [(ngModel)]="form.providerId" name="aProvider" required class="input">
              <option value="" disabled>Selecciona…</option>
              @for (p of providers(); track p.id) {
                <option [value]="p.id">{{ p.name }} ({{ p.specialty || 'sin especialidad' }})</option>
              }
            </select>
          </div>
          <div>
            <label class="label" for="a-date">Fecha y hora *</label>
            <input id="a-date" type="datetime-local" [(ngModel)]="form.scheduledAt" name="aScheduledAt" required class="input" />
          </div>
          <div>
            <label class="label" for="a-reason">Motivo</label>
            <input id="a-reason" type="text" [(ngModel)]="form.reason" name="aReason" class="input" maxlength="160" />
          </div>
          <div>
            <label class="label" for="a-follow">Seguimiento</label>
            <input id="a-follow" type="text" [(ngModel)]="form.followUp" name="aFollowUp" class="input" maxlength="160" />
          </div>
          <div class="sm:col-span-2">
            <label class="label" for="a-notes">Notas</label>
            <input id="a-notes" type="text" [(ngModel)]="form.notes" name="aNotes" class="input" />
          </div>
          <div class="flex gap-2 sm:col-span-2">
            <button type="submit" class="btn-primary text-sm">Guardar</button>
            <button type="button" class="btn-ghost text-sm" (click)="showForm.set(false)">Cancelar</button>
          </div>
        </form>
      }

      @if (loading()) {
        <app-skeleton variant="table" [rows]="3" />
      } @else if (error()) {
        <div class="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
          {{ error() }} <button class="ml-2 font-semibold underline" (click)="load()">Reintentar</button>
        </div>
      } @else {
        <section>
          <h2 class="mb-3 text-base font-semibold text-ink">Próximas</h2>
          @if (upcoming().length === 0) {
            <p class="rounded-lg border border-dashed border-border bg-surface/50 px-4 py-8 text-center text-sm text-ink-faint">
              Sin citas programadas
            </p>
          } @else {
            <ul class="space-y-2">
              @for (a of upcoming(); track a.id) {
                <app-appointment-row [appt]="a" (deleted)="load()" />
              }
            </ul>
          }
        </section>

        <section class="mt-6">
          <h2 class="mb-3 text-base font-semibold text-ink">Pasadas</h2>
          @if (past().length === 0) {
            <p class="rounded-lg border border-dashed border-border bg-surface/50 px-4 py-8 text-center text-sm text-ink-faint">
              Sin citas pasadas
            </p>
          } @else {
            <ul class="space-y-2">
              @for (a of past(); track a.id) {
                <app-appointment-row [appt]="a" (deleted)="load()" />
              }
            </ul>
          }
        </section>
      }
    </div>
  `,
})
export class AppointmentsPage {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly appointments = signal<Appointment[]>([]);
  readonly providers = signal<Provider[]>([]);
  readonly showForm = signal(false);
  readonly form: Partial<Appointment> = {};

  constructor(
    private appointmentsSvc: AppointmentsService,
    private providersSvc: ProvidersService,
  ) {
    this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const [apps, providers] = await Promise.all([
        this.appointmentsSvc.list('all'),
        this.providersSvc.list(),
      ]);
      this.appointments.set(apps);
      this.providers.set(providers);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudieron cargar las citas');
    } finally {
      this.loading.set(false);
    }
  }

  protected upcoming() {
    const now = new Date().getTime();
    return this.appointments()
      .filter((a) => new Date(a.scheduledAt).getTime() >= now)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }

  protected past() {
    const now = new Date().getTime();
    return this.appointments()
      .filter((a) => new Date(a.scheduledAt).getTime() < now)
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  }

  async create() {
    if (!this.form.providerId || !this.form.scheduledAt) return;
    try {
      await this.appointmentsSvc.create({
        providerId: this.form.providerId,
        scheduledAt: new Date(this.form.scheduledAt).toISOString(),
        reason: this.form.reason || undefined,
        notes: this.form.notes || undefined,
        followUp: this.form.followUp || undefined,
      });
      this.showForm.set(false);
      this.form.providerId = '';
      this.form.scheduledAt = '';
      this.form.reason = '';
      this.form.notes = '';
      this.form.followUp = '';
      await this.load();
    } catch (e: any) {
    }
  }
}
