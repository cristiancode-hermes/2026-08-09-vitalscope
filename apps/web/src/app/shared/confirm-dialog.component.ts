import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" (click)="cancel.emit()">
      <div class="w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-lg"
        (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <h3 class="text-base font-semibold text-ink">{{ title() }}</h3>
        <p class="mt-2 text-sm text-ink-muted">{{ message() }}</p>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" class="btn-secondary" (click)="cancel.emit()">Cancelar</button>
          <button type="button" class="btn-danger" (click)="confirm.emit()">Eliminar</button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  readonly title = input('¿Confirmar eliminación?');
  readonly message = input('Esta acción no se puede deshacer.');
  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
