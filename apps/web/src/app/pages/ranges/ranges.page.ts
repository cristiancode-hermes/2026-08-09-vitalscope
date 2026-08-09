import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RangesService } from '../../services/data.services';
import { SkeletonComponent } from '../../shared/skeleton.component';
import type { RangeWithDefaults } from '../../models/models';

@Component({
  selector: 'app-ranges',
  imports: [SkeletonComponent, FormsModule],
  template: `
    <div class="flex flex-col gap-5">
      <div>
        <h1 class="text-xl font-semibold tracking-tight text-ink">Rangos objetivo</h1>
        <p class="mt-1 text-sm text-ink-muted">
          Vitalscope alerta cuando una lectura cae fuera de tu rango personal.
        </p>
      </div>

      @if (loading()) {
        <app-skeleton variant="table" [rows]="6" />
      } @else if (error()) {
        <div class="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
          {{ error() }} <button class="ml-2 font-semibold underline" (click)="load()">Reintentar</button>
        </div>
      } @else if (savedMsg()) {
        <div class="rounded-md bg-success-soft px-4 py-3 text-sm text-success">{{ savedMsg() }}</div>
      } @else {
        <div class="space-y-3">
          @for (r of ranges(); track r.typeId) {
            <div class="rounded-lg border border-border bg-surface p-5">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-ink">{{ r.type.label }}</p>
                  <p class="text-xs text-ink-faint">
                    Rango actual: {{ r.min }} – {{ r.max }} {{ r.type.unit }}
                    @if (r.isCustom) {
                      <span class="ml-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary">personalizado</span>
                    }
                  </p>
                </div>
                <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
                  <input type="checkbox" class="h-4 w-4 accent-[var(--color-primary)]"
                    [checked]="r.isCustom" (change)="toggleCustom(r, $event)" />
                  Usar rango personalizado
                </label>
              </div>

              @if (editTypeId() === r.typeId) {
                <div class="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:max-w-sm">
                  <div>
                    <label class="label" [for]="'min-' + r.typeId">Mínimo</label>
                    <input [id]="'min-' + r.typeId" type="number" step="0.1"
                      [ngModel]="editMin()" (ngModelChange)="editMin.set($event)"
                      class="input measurement" />
                  </div>
                  <div>
                    <label class="label" [for]="'max-' + r.typeId">Máximo</label>
                    <input [id]="'max-' + r.typeId" type="number" step="0.1"
                      [ngModel]="editMax()" (ngModelChange)="editMax.set($event)"
                      class="input measurement" />
                  </div>
                  <div class="col-span-2 flex gap-2">
                    <button type="button" class="btn-primary text-sm" (click)="saveRange(r)">Guardar</button>
                    <button type="button" class="btn-ghost text-sm" (click)="editTypeId.set(null)">Cancelar</button>
                  </div>
                </div>
              } @else if (r.isCustom) {
                <div class="mt-3 flex gap-2">
                  <button type="button" class="btn-secondary text-sm" (click)="startEdit(r)">Editar</button>
                  <button type="button" class="btn-ghost text-sm text-danger" (click)="resetRange(r)">Volver al rango por defecto</button>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class RangesPage {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly savedMsg = signal('');
  readonly ranges = signal<RangeWithDefaults[]>([]);
  readonly editTypeId = signal<string | null>(null);
  readonly editMin = signal(0);
  readonly editMax = signal(0);

  constructor(private rangesSvc: RangesService) {
    this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    this.savedMsg.set('');
    try {
      this.ranges.set(await this.rangesSvc.list());
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudieron cargar los rangos');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleCustom(r: RangeWithDefaults, e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    if (checked) {
      this.editMin.set(r.type.defaultMin);
      this.editMax.set(r.type.defaultMax);
      this.editTypeId.set(r.typeId);
    } else {
      await this.resetRange(r);
    }
  }

  startEdit(r: RangeWithDefaults) {
    this.editMin.set(r.min);
    this.editMax.set(r.max);
    this.editTypeId.set(r.typeId);
  }

  async saveRange(r: RangeWithDefaults) {
    this.error.set('');
    if (this.editMin() >= this.editMax()) {
      this.error.set('El mínimo debe ser menor que el máximo');
      return;
    }
    try {
      await this.rangesSvc.upsert(r.typeId, this.editMin(), this.editMax());
      this.editTypeId.set(null);
      this.savedMsg.set(`Rango de ${r.type.label} actualizado`);
      await this.load();
      setTimeout(() => this.savedMsg.set(''), 3000);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudo guardar el rango');
    }
  }

  async resetRange(r: RangeWithDefaults) {
    try {
      await this.rangesSvc.remove(r.typeId);
      await this.load();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudo restablecer el rango');
    }
  }
}
