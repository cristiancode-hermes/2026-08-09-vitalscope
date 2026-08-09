import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import type { User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly units = signal<'metric' | 'imperial'>('metric');
  readonly theme = signal<'light' | 'dark' | 'auto'>('auto');

  constructor(private http: HttpClient) {}

  applyFromUser(user: User | null) {
    if (!user) return;
    this.units.set(user.units);
    this.theme.set(user.theme);
  }

  async update(payload: Partial<Pick<User, 'username' | 'email' | 'units' | 'theme'>>) {
    const updated = await lastValueFrom(this.http.patch<User>('/api/users/me', payload));
    this.units.set(updated.units);
    this.theme.set(updated.theme);
    return updated;
  }
}
