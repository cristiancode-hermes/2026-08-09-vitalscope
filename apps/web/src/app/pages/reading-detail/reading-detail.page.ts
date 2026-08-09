import { Component, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReadingsService } from '../../services/data.services';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { RangeEvaluatorClient } from '../../shared/range-evaluator';
import type { Reading } from '../../models/models';

@Component({
  selector: 'app-reading-detail',
  imports: [RouterLink, DatePipe, StatusBadgeComponent, ConfirmDialogComponent, SkeletonComponent, FormsModule],
  template: `
    <div class="mx-auto max-w-2xl">
      <div class="mb-5 flex items-center justify-between">
        <a routerLink="/readings" class="text-sm text-ink-muted hover:text-ink">← Lecturas</a>
        <div class="flex gap-2">
          <button type="button" class="btn-secondary text-sm" (click)="editing.set(true)">Editar</button>
          <button type="button" class="btn-danger text-sm" (click)="confirmDelete.set(true)">Borrar</button>
        </div>
      </div>

      @if (loading()) {
        <app-skeleton variant="table" [rows]="4" />
      } @else if (error()) {
        <div class="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">{{ error() }}</div>
      } @else if (reading(); as r) {
        <div class="rounded-lg border border-border bg-surface p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm text-ink-muted">{{ r.type?.label }} · {{ r.unit }}</p>
              <p class="measurement mt-1 text-4xl font-semibold text-ink">{{ displayValue(r) }}</p>
            </div>
            <app-status-badge [status]="statusFor(r)" />
          </div>

          <dl class="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm">
            <div>
              <dt class="text-xs uppercase tracking-wide text-ink-faint">Fecha</dt>
              <dd class="mt-0.5 text-ink">{{ r.recordedAt | date:'d MMM y, HH:mm' }}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-ink-faint">Notas</dt>
              <dd class="mt-0.5 text-ink">{{ r.notes || '—' }}</dd>
            </div>
            <div class="col-span-2">
              <dt class="text-xs uppercase tracking-wide text-ink-faint">Etiquetas</dt>
              <dd class="mt-1 flex flex-wrap gap-1.5">
                @for (t of r.tags; track t) {
                  <span class="rounded-full bg-secondary-soft px-2 py-0.5 text-xs text-secondary">{{ t }}</span>
                } @empty {
                  <span class="text-ink-faint">Sin etiquetas</span>
                }
              </dd>
            </div>
          </dl>
        </div>

        @if (editing()) {
          <div class="mt-4 rounded-lg border border-border bg-surface p-6">
            <h2 class="mb-4 text-base font-semibold text-ink">Editar lectura</h2>
            <form (ngSubmit)="saveEdit()" class="flex flex-col gap-4">
              @if (r.type?.category === 'blood_pressure') {
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="label" for="e-sys">Sistólica</label>
                    <input id="e-sys" type="number" step="1" [(ngModel)]="editSys" name="editSys"
                      class="input measurement" required />
                  </div>
                  <div>
                    <label class="label" for="e-dia">Diastólica</label>
                    <input id="e-dia" type="number" step="1" [(ngModel)]="editDia" name="editDia"
                      class="input measurement" required />
                  </div>
                </div>
              } @else {
                <div>
                  <label class="label" for="e-value">Valor ({{ r.unit }})</label>
                  <input id="e-value" type="number" step="0.1" [(ngModel)]="editValue" name="editValue"
                    class="input measurement" required />
                </div>
              }
              <div>
                <label class="label" for="e-notes">Nota</label>
                <input id="e-notes" type="text" [(ngModel)]="editNotes" name="editNotes" class="input" />
              </div>
              <div class="flex justify-end gap-2">
                <button type="button" class="btn-secondary" (click)="editing.set(false)">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="saving()">
                  {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
                </button>
              </div>
            </form>
          </div>
        }
      }

      @if (confirmDelete()) {
        <app-confirm-dialog title="¿Borrar esta lectura?"
          message="Se eliminará del histórico y sus alertas asociadas."
          (confirm)="doDelete()" (cancel)="confirmDelete.set(false)" />
      }
    </div>
  `,
})
export class ReadingDetailPage {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly reading = signal<Reading | null>(null);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly confirmDelete = signal(false);

  editValue: number | null = null;
  editSys: number | null = null;
  editDia: number | null = null;
  editNotes = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private readings: ReadingsService,
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  async load(id: string) {
    this.loading.set(true);
    this.error.set('');
    try {
      const r = await this.readings.get(id);
      this.reading.set(r);
      this.editValue = r.value;
      this.editSys = r.systolic;
      this.editDia = r.diastolic;
      this.editNotes = r.notes ?? '';
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudo cargar la lectura');
    } finally {
      this.loading.set(false);
    }
  }

  protected displayValue(r: Reading) {
    if (r.systolic !== null && r.diastolic !== null) return `${r.systolic}/${r.diastolic}`;
    return r.value;
  }

  protected statusFor(r: Reading) {
    return RangeEvaluatorClient.status(r);
  }

  async saveEdit() {
    const r = this.reading();
    if (!r) return;
    this.saving.set(true);
    this.error.set('');
    try {
      await this.readings.update(r.id, {
        value: r.type?.category === 'blood_pressure' ? undefined : (this.editValue ?? undefined),
        systolic: r.type?.category === 'blood_pressure' ? (this.editSys ?? undefined) : undefined,
        diastolic: r.type?.category === 'blood_pressure' ? (this.editDia ?? undefined) : undefined,
        notes: this.editNotes || undefined,
      });
      this.editing.set(false);
      await this.load(r.id);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudo guardar');
    } finally {
      this.saving.set(false);
    }
  }

  async doDelete() {
    const r = this.reading();
    if (!r) return;
    await this.readings.remove(r.id);
    this.router.navigate(['/readings']);
  }
}
