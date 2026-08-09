import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
      <span class="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
        <span [innerHTML]="iconHtml()"></span>
      </span>
      <div>
        <p class="text-base font-semibold text-ink">{{ title() }}</p>
        @if (message(); as msg) {
          <p class="mt-1 max-w-sm text-sm text-ink-muted">{{ msg }}</p>
        }
      </div>
      @if (ctaLabel(); as label) {
        <button type="button" class="btn-primary" (click)="cta.emit()">{{ label }}</button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input('heart');
  readonly title = input.required<string>();
  readonly message = input('');
  readonly ctaLabel = input('');
  readonly cta = output<void>();

  protected iconHtml = () =>
    `<svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.7-10-9.3C.4 8.6 2.3 5 5.8 5c2 0 3.4 1.1 4.2 2.3h4C14.8 6.1 16.2 5 18.2 5c3.5 0 5.4 3.6 3.8 6.7C19.5 16.3 12 21 12 21z"/></svg>`;
}
