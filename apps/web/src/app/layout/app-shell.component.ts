import { Component, computed, effect, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AlertsService } from '../services/data.services';
import { iconSvg } from '../shared/icons';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Inicio', icon: 'heart-pulse' },
  { path: '/readings', label: 'Lecturas', icon: 'heart' },
  { path: '/trends', label: 'Tendencias', icon: 'lungs' },
  { path: '/ranges', label: 'Rangos', icon: 'scale' },
  { path: '/alerts', label: 'Alertas', icon: 'alert' },
  { path: '/providers', label: 'Doctores', icon: 'droplet' },
  { path: '/appointments', label: 'Citas', icon: 'thermometer' },
  { path: '/settings', label: 'Ajustes', icon: 'plus' },
];

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <a routerLink="/dashboard" class="flex items-center gap-2 px-5 py-5">
        <span class="grid h-8 w-8 place-items-center rounded-md bg-primary text-white"
          [innerHTML]="logoHtml()"></span>
        <span class="text-base font-bold tracking-tight text-ink">Vitalscope</span>
      </a>
      <nav class="flex-1 space-y-1 px-3">
        @for (item of NAV_ITEMS; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="bg-primary-soft text-primary"
            class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink">
            <span class="grid h-7 w-7 place-items-center" [innerHTML]="iconFor(item.icon)"></span>
            {{ item.label }}
            @if (item.path === '/alerts' && pendingCount() > 0) {
              <span class="ml-auto rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                {{ pendingCount() }}
              </span>
            }
          </a>
        }
      </nav>
      <div class="border-t border-border p-4">
        <p class="text-sm font-semibold text-ink">{{ auth.currentUser()?.username }}</p>
        <p class="truncate text-xs text-ink-faint">{{ auth.currentUser()?.email }}</p>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  readonly NAV_ITEMS = NAV_ITEMS;
  readonly pendingCount = signal(0);

  constructor(
    public auth: AuthService,
    private alerts: AlertsService,
    private router: Router,
  ) {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.refreshPending();
      }
    });
  }

  refreshPending() {
    this.alerts.pendingCount().then((r) => this.pendingCount.set(r.pending)).catch(() => {});
  }

  protected logoHtml = () => iconSvg('heart-pulse', 'h-4 w-4');
  protected iconFor = (name: string) => iconSvg(name, 'h-4 w-4');
}

@Component({
  selector: 'app-topbar',
  imports: [RouterLink],
  template: `
    <header class="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur-sm lg:px-6">
      <div class="flex items-center gap-3">
        <a routerLink="/dashboard" class="flex items-center gap-2 lg:hidden">
          <span class="grid h-7 w-7 place-items-center rounded-md bg-primary text-white"
            [innerHTML]="logoHtml()"></span>
          <span class="text-sm font-bold tracking-tight text-ink">Vitalscope</span>
        </a>
        <p class="hidden text-sm text-ink-muted lg:block">
          {{ greeting() }} {{ auth.currentUser()?.username }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <a routerLink="/readings/new" class="btn-primary !px-3 !py-1.5 text-sm">
          <span [innerHTML]="plusHtml()"></span>
          <span class="hidden sm:inline">Registrar</span>
        </a>
        <button type="button" (click)="auth.logout()" title="Cerrar sesión"
          class="grid h-9 w-9 place-items-center rounded-md text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink">
          <span [innerHTML]="logoutHtml()"></span>
        </button>
      </div>
    </header>
  `,
})
export class TopbarComponent {
  constructor(public auth: AuthService) {}

  protected greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días,';
    if (h < 20) return 'Buenas tardes,';
    return 'Buenas noches,';
  }

  protected logoHtml = () => iconSvg('heart-pulse', 'h-4 w-4');
  protected plusHtml = () => iconSvg('plus', 'h-4 w-4');
  protected logoutHtml = () => iconSvg('logout', 'h-4 w-4');
}

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface lg:hidden"
      aria-label="Navegación principal">
      @for (item of mobileItems(); track item.path) {
        <a [routerLink]="item.path" routerLinkActive="text-primary"
          class="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-ink-muted">
          <span class="grid h-6 w-6 place-items-center" [innerHTML]="iconFor(item.icon)"></span>
          {{ item.label }}
          @if (item.path === '/alerts' && pendingCount() > 0) {
            <span class="absolute mt-7 ml-6 h-1.5 w-1.5 rounded-full bg-danger"></span>
          }
        </a>
      }
    </nav>
  `,
})
export class BottomNavComponent {
  readonly pendingCount = signal(0);

  protected mobileItems() {
    return NAV_ITEMS.filter((i) =>
      ['/dashboard', '/readings', '/trends', '/alerts', '/settings'].includes(i.path),
    );
  }

  protected iconFor = (name: string) => iconSvg(name, 'h-4 w-4');
}

@Component({
  selector: 'app-shell',
  imports: [SidebarComponent, TopbarComponent, BottomNavComponent, RouterOutlet],
  template: `
    <div class="flex min-h-screen bg-bg text-ink">
      <app-sidebar #sidebar />
      <div class="flex min-w-0 flex-1 flex-col">
        <app-topbar />
        <main class="flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-8">
          <div class="mx-auto w-full max-w-6xl">
            <router-outlet />
          </div>
        </main>
      </div>
      <app-bottom-nav />
    </div>
  `,
})
export class AppShellComponent {}
