import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-sparkline',
  template: `
    <svg class="block" [attr.width]="width()" [attr.height]="height()" [attr.viewBox]="viewBox()"
      preserveAspectRatio="none" aria-hidden="true">
      @if (points().length > 1) {
        <polyline [attr.points]="pointsStr()" fill="none" [attr.stroke]="stroke()"
          stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
          [style.transition]="'stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)'"
          [attr.stroke-dasharray]="dashArray()" [attr.stroke-dashoffset]="dashOffset()" />
      }
    </svg>
  `,
})
export class SparklineComponent {
  readonly data = input<number[]>([]);
  readonly color = input<string>('var(--color-secondary)');
  readonly width = input(64);
  readonly height = input(20);

  private readonly pad = 2;

  protected readonly viewBox = computed(() => `0 0 ${this.width()} ${this.height()}`);

  protected readonly points = computed(() => {
    const d = this.data();
    if (d.length < 2) return [];
    const min = Math.min(...d);
    const max = Math.max(...d);
    const span = max - min || 1;
    const w = this.width() - this.pad * 2;
    const h = this.height() - this.pad * 2;
    return d.map((v, i) => {
      const x = this.pad + (i / (d.length - 1)) * w;
      const y = this.pad + h - ((v - min) / span) * h;
      return { x, y };
    });
  });

  protected readonly pointsStr = computed(() =>
    this.points().map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
  );

  protected readonly dashArray = computed(() => {
    const pts = this.points();
    if (pts.length < 2) return '0';
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    }
    return String(len);
  });

  protected readonly dashOffset = computed(() => {
    const pts = this.points();
    if (pts.length < 2) return '0';
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    }
    return String(len);
  });

  protected readonly stroke = computed(() => this.color());
}
