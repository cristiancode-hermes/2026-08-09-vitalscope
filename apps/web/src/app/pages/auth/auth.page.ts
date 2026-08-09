import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  imports: [FormsModule],
  template: `
    <div class="grid min-h-screen place-items-center bg-bg px-4">
      <div class="w-full max-w-sm">
        <div class="mb-8 text-center">
          <span class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary text-white">
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 21s-7.5-4.7-10-9.3C.4 8.6 2.3 5 5.8 5c2 0 3.4 1.1 4.2 2.3h4C14.8 6.1 16.2 5 18.2 5c3.5 0 5.4 3.6 3.8 6.7C19.5 16.3 12 21 12 21z"/>
            </svg>
          </span>
          <h1 class="text-2xl font-bold tracking-tight text-ink">Vitalscope</h1>
          <p class="mt-1 text-sm text-ink-muted">Tu cuaderno de signos vitales</p>
        </div>

        <div class="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <!-- Tabs -->
          <div class="mb-5 grid grid-cols-2 rounded-md bg-surface-alt p-1 text-sm font-medium">
            <button type="button" (click)="mode.set('login')"
              class="rounded px-3 py-1.5 transition-colors"
              [class.bg-surface]="mode() === 'login'" [class.shadow-sm]="mode() === 'login'"
              [class.text-ink]="mode() === 'login'" [class.text-ink-muted]="mode() !== 'login'">
              Iniciar sesión
            </button>
            <button type="button" (click)="mode.set('register')"
              class="rounded px-3 py-1.5 transition-colors"
              [class.bg-surface]="mode() === 'register'" [class.shadow-sm]="mode() === 'register'"
              [class.text-ink]="mode() === 'register'" [class.text-ink-muted]="mode() !== 'register'">
              Registrarse
            </button>
          </div>

          @if (error(); as err) {
            <div class="mb-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
              {{ err }}
            </div>
          }

          <form (ngSubmit)="submit()" class="flex flex-col gap-4" #form="ngForm">
            @if (mode() === 'register') {
              <div>
                <label class="label" for="username">Usuario</label>
                <input id="username" name="username" type="text" [(ngModel)]="username" required
                  minlength="3" maxlength="40" placeholder="ana" class="input" />
              </div>
              <div>
                <label class="label" for="email">Email</label>
                <input id="email" name="email" type="email" [(ngModel)]="email" required
                  email placeholder="ana@correo.es" class="input" />
              </div>
            }
            <div>
              <label class="label" for="identifier">Usuario o email</label>
              <input id="identifier" name="identifier" type="text" [(ngModel)]="identifier"
                required placeholder="ana o ana@correo.es" class="input" />
            </div>
            <div>
              <label class="label" for="password">Contraseña</label>
              <input id="password" name="password" type="password" [(ngModel)]="password"
                required minlength="8" placeholder="••••••••" class="input" />
            </div>

            @if (mode() === 'login') {
              <label class="inline-flex items-center gap-2 text-sm text-ink-muted">
                <input type="checkbox" [(ngModel)]="remember" name="remember"
                  class="h-4 w-4 accent-[var(--color-primary)]" />
                Recordarme
              </label>
            }

            <button type="submit" class="btn-primary" [disabled]="form.invalid || loading()">
              @if (loading()) {
                <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
              } @else {
                {{ mode() === 'login' ? 'Entrar' : 'Crear cuenta' }}
              }
            </button>
          </form>

          <p class="mt-4 text-center text-xs text-ink-faint">
            Demo: usuario <span class="font-medium text-ink-muted">ana</span> · contraseña
            <span class="font-medium text-ink-muted">vitalscope123</span>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class AuthPage {
  readonly mode = signal<'login' | 'register'>('login');
  readonly loading = signal(false);
  readonly error = signal('');

  username = '';
  email = '';
  identifier = '';
  password = '';
  remember = true;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  async submit() {
    this.error.set('');
    this.loading.set(true);
    try {
      if (this.mode() === 'register') {
        await this.auth.register(this.username, this.email, this.password);
      } else {
        await this.auth.login(this.identifier, this.password, this.remember);
      }
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      const msg =
        e?.error?.message ??
        (e?.status === 409 ? 'Ese usuario o email ya existe' : 'Error inesperado');
      this.error.set(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      this.loading.set(false);
    }
  }
}
