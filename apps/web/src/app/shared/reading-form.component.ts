import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TAG_OPTIONS, type MeasurementType } from '../models/models';
import { StatusBadgeComponent } from './status-badge.component';
import type { ReadingStatus } from '../models/models';

export interface ReadingFormPayload {
  typeId: string;
  value?: number;
  systolic?: number;
  diastolic?: number;
  recordedAt?: string;
  notes?: string;
  tags: string[];
}

@Component({
  selector: 'app-reading-form',
  imports: [FormsModule, StatusBadgeComponent],
  template: `
    <form (ngSubmit)="submit()" class="flex flex-col gap-3" #form="ngForm">
      <div>
        <label class="label" for="rf-type">Tipo de medición</label>
        <select id="rf-type" name="typeId" [ngModel]="typeId()" (ngModelChange)="onTypeChange($event)"
          class="input" [disabled]="lockedType()">
          @for (t of types(); track t.id) {
            <option [value]="t.id">{{ t.label }} ({{ t.unit }})</option>
          }
        </select>
      </div>

      @if (selectedType(); as type) {
        @if (type.category === 'blood_pressure') {
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label" for="rf-sys">Sistólica (mmHg)</label>
              <input id="rf-sys" name="systolic" type="number" inputmode="decimal" step="1"
                [(ngModel)]="systolic" required min="40" max="300" placeholder="128"
                class="input measurement" />
            </div>
            <div>
              <label class="label" for="rf-dia">Diastólica (mmHg)</label>
              <input id="rf-dia" name="diastolic" type="number" inputmode="decimal" step="1"
                [(ngModel)]="diastolic" required min="20" max="200" placeholder="84"
                class="input measurement" />
            </div>
          </div>
        } @else {
          <div>
            <label class="label" for="rf-value">Valor ({{ type.unit }})</label>
            <input id="rf-value" name="value" type="number" inputmode="decimal" step="0.1"
              [(ngModel)]="value" required min="0" placeholder="72" class="input measurement" />
          </div>
        }

        <div>
          <label class="label" for="rf-recorded">Fecha y hora</label>
          <input id="rf-recorded" name="recordedAt" type="datetime-local"
            [(ngModel)]="recordedAtStr" class="input" />
        </div>

        <div>
          <label class="label" for="rf-notes">Nota (opcional)</label>
          <input id="rf-notes" name="notes" type="text" [(ngModel)]="notes"
            placeholder="p.ej. antes de cenar" class="input" maxlength="500" />
        </div>

        <div>
          <span class="label">Etiquetas</span>
          <div class="flex flex-wrap gap-2">
            @for (tag of TAG_OPTIONS; track tag) {
              <label class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                [class.border-primary]="selectedTags().includes(tag)"
                [class.bg-primary-soft]="selectedTags().includes(tag)"
                [class.text-primary]="selectedTags().includes(tag)"
                [class.border-border]="!selectedTags().includes(tag)"
                [class.text-ink-muted]="!selectedTags().includes(tag)">
                <input type="checkbox" class="hidden" [checked]="selectedTags().includes(tag)"
                  (change)="toggleTag(tag)" />
                {{ tag }}
              </label>
            }
          </div>
        </div>

        <div class="flex items-center justify-between rounded-md bg-surface-alt px-3 py-2">
          <span class="text-xs text-ink-muted">Estado previsto</span>
          @if (previewStatus(); as st) {
            <app-status-badge [status]="st" />
          } @else {
            <span class="text-xs text-ink-faint">Introduce un valor</span>
          }
        </div>

        <button type="submit" class="btn-primary" [disabled]="form.invalid || saving()">
          @if (saving()) {
            <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
          } @else {
            Guardar
          }
        </button>
      }
    </form>
  `,
})
export class ReadingFormComponent {
  readonly types = input.required<MeasurementType[]>();
  readonly ranges = input.required<Record<string, { min: number; max: number }>>();
  readonly lockedType = input(false);
  readonly saving = input(false);

  readonly saved = output<ReadingFormPayload>();
  readonly cancelled = output<void>();

  readonly TAG_OPTIONS = TAG_OPTIONS;

  protected readonly typeId = signal<string | null>(null);
  protected value: number | null = null;
  protected systolic: number | null = null;
  protected diastolic: number | null = null;
  protected recordedAtStr = '';
  protected notes = '';
  protected tags: string[] = [];

  protected selectedType = computed(() => {
    const id = this.typeId();
    if (!id) return null;
    return this.types().find((t) => t.id === id) ?? null;
  });

  protected selectedTags = computed(() => this.tags);

  protected previewStatus = computed<ReadingStatus | null>(() => {
    const type = this.selectedType();
    if (!type) return null;
    const range = this.ranges()[type.id];
    if (!range) return null;

    const v = type.category === 'blood_pressure' ? this.systolic : this.value;
    if (v === null || v === undefined || Number.isNaN(v)) return null;

    if (v < range.min) return 'low';
    if (v > range.max) {
      const deviation = (v - range.max) / range.max;
      return deviation > 0.2 ? 'critical' : 'high';
    }
    return 'ok';
  });

  onTypeChange(id: string) {
    this.typeId.set(id);
    this.value = null;
    this.systolic = null;
    this.diastolic = null;
  }

  toggleTag(tag: string) {
    if (this.tags.includes(tag)) {
      this.tags = this.tags.filter((t) => t !== tag);
    } else {
      this.tags = [...this.tags, tag];
    }
  }

  submit() {
    const type = this.selectedType();
    if (!type) return;
    const recordedAt = this.recordedAtStr ? new Date(this.recordedAtStr).toISOString() : new Date().toISOString();
    this.saved.emit({
      typeId: type.id,
      value: type.category === 'blood_pressure' ? undefined : (this.value ?? undefined),
      systolic: type.category === 'blood_pressure' ? (this.systolic ?? undefined) : undefined,
      diastolic: type.category === 'blood_pressure' ? (this.diastolic ?? undefined) : undefined,
      recordedAt,
      notes: this.notes || undefined,
      tags: this.tags,
    });
    this.reset();
  }

  private reset() {
    this.value = null;
    this.systolic = null;
    this.diastolic = null;
    this.notes = '';
    this.tags = [];
  }
}
