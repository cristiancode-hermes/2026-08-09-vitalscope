import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MeasurementTypesService, ReadingsService } from '../../services/data.services';
import { ReadingTableComponent } from '../../shared/reading-table.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import type { Reading, ReadingStatus } from '../../models/models';

@Component({
  selector: 'app-readings',
  imports: [RouterLink, ReadingTableComponent, EmptyStateComponent, SkeletonComponent],
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-xl font-semibold tracking-tight text-ink">Lecturas</h1>
        <div class="flex items-center gap-2">
          <a routerLink="/readings/export" (click)="exportCsv($event)"
            class="btn-secondary text-sm">Export CSV</a>
          <a routerLink="/readings/new" class="btn-primary text-sm">＋ Nueva</a>
        </div>
      </div>

      <!-- Filtros -->
      <div class="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4">
        <div>
          <label class="label" for="f-type">Tipo</label>
          <select id="f-type" class="input !w-auto" (change)="onTypeFilter($event)">
            <option value="">Todos</option>
            @for (t of types(); track t.id) {
              <option [value]="t.id" [selected]="typeFilter() === t.id">{{ t.label }}</option>
            }
          </select>
        </div>
        <div>
          <label class="label" for="f-from">Desde</label>
          <input id="f-from" type="date" class="input !w-auto" (change)="onFromFilter($event)" />
        </div>
        <div>
          <label class="label" for="f-to">Hasta</label>
          <input id="f-to" type="date" class="input !w-auto" (change)="onToFilter($event)" />
        </div>
        @if (hasFilters()) {
          <button type="button" class="btn-ghost text-sm" (click)="clearFilters()">Limpiar</button>
        }
      </div>

      @if (loading()) {
        <app-skeleton variant="table" [rows]="5" />
      } @else if (error()) {
        <div class="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
          {{ error() }} <button class="ml-2 font-semibold underline" (click)="load()">Reintentar</button>
        </div>
      } @else if (result(); as res) {
        @if (res.items.length === 0) {
          <app-empty-state title="Aún no hay lecturas"
            message="Registra tu primera medición para empezar tu histórico."
            ctaLabel="＋ Nueva lectura" (cta)="router.navigate(['/readings/new'])" />
        } @else {
          <app-reading-table [readings]="res.items" (rowClick)="open($event)" />
          <div class="flex items-center justify-between text-sm text-ink-muted">
            <span>{{ res.total }} lecturas · página {{ res.page }}/{{ totalPages() }}</span>
            <div class="flex gap-2">
              <button class="btn-secondary !px-3 !py-1.5 text-sm" [disabled]="page() <= 1"
                (click)="goPage(page() - 1)">‹ Anterior</button>
              <button class="btn-secondary !px-3 !py-1.5 text-sm" [disabled]="page() >= totalPages()"
                (click)="goPage(page() + 1)">Siguiente ›</button>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class ReadingsPage {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly result = signal<{ items: Reading[]; total: number; page: number; limit: number } | null>(null);
  readonly types = signal<any[]>([]);
  readonly typeFilter = signal('');
  readonly page = signal(1);
  readonly limit = 20;

  private from = '';
  private to = '';

  constructor(
    public router: Router,
    private readings: ReadingsService,
    private typesSvc: MeasurementTypesService,
  ) {
    this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const [res, types] = await Promise.all([
        this.readings.list({
          type: this.typeFilter() || undefined,
          from: this.from || undefined,
          to: this.to || undefined,
          page: this.page(),
          limit: this.limit,
        }),
        this.typesSvc.list(),
      ]);
      this.result.set(res);
      this.types.set(types);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudieron cargar las lecturas');
    } finally {
      this.loading.set(false);
    }
  }

  protected totalPages() {
    const res = this.result();
    return res ? Math.max(1, Math.ceil(res.total / res.limit)) : 1;
  }

  protected hasFilters() {
    return !!this.typeFilter() || !!this.from || !!this.to;
  }

  onTypeFilter(e: Event) {
    this.typeFilter.set((e.target as HTMLSelectElement).value);
    this.page.set(1);
    this.load();
  }

  onFromFilter(e: Event) {
    this.from = (e.target as HTMLInputElement).value;
    this.page.set(1);
    this.load();
  }

  onToFilter(e: Event) {
    this.to = (e.target as HTMLInputElement).value;
    this.page.set(1);
    this.load();
  }

  clearFilters() {
    this.typeFilter.set('');
    this.from = '';
    this.to = '';
    this.page.set(1);
    this.load();
  }

  goPage(p: number) {
    this.page.set(p);
    this.load();
  }

  open(r: Reading) {
    this.router.navigate(['/readings', r.id]);
  }

  exportCsv(e: Event) {
    e.preventDefault();
    const a = document.createElement('a');
    a.href = '/api/readings/export';
    a.download = 'vitalscope-lecturas.csv';
    a.click();
  }
}
