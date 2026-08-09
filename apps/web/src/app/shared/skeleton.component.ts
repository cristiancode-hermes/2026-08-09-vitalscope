import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  template: `
    @switch (variant()) {
      @case ('card') {
        <div class="h-36 animate-pulse rounded-lg border border-border bg-surface-alt"></div>
      }
      @case ('chart') {
        <div class="h-64 animate-pulse rounded-lg border border-border bg-surface-alt"></div>
      }
      @default {
        <div class="space-y-2 animate-pulse">
          @for (row of [].constructor(rows()); track $index) {
            <div class="h-10 rounded bg-surface-alt"></div>
          }
        </div>
      }
    }
  `,
})
export class SkeletonComponent {
  readonly variant = input<'card' | 'table' | 'chart'>('table');
  readonly rows = input(5);
}
