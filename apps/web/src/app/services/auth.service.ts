import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import type { AuthResponse, User } from '../models/models';

export const TOKEN_KEY = 'vs_token';
export const USER_KEY = 'vs_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenSig = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private userSig = signal<User | null>(this.readStoredUser());

  readonly token = this.tokenSig.asReadonly();
  readonly currentUser = this.userSig.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSig());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  async register(username: string, email: string, password: string) {
    const res = await lastValueFrom(
      this.http.post<AuthResponse>('/api/auth/register', { username, email, password }),
    );
    this.persist(res);
    return res;
  }

  async login(identifier: string, password: string, remember = true) {
    const res = await lastValueFrom(
      this.http.post<AuthResponse>('/api/auth/login', { identifier, password }),
    );
    this.persist(res, remember);
    return res;
  }

  async refreshMe(): Promise<User> {
    const user = await lastValueFrom(this.http.get<User>('/api/auth/me'));
    this.userSig.set(user);
    return user;
  }

  logout() {
    this.tokenSig.set(null);
    this.userSig.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.router.navigate(['/login']);
  }

  private persist(res: AuthResponse, remember = true) {
    this.tokenSig.set(res.token);
    this.userSig.set(res.user);
    if (remember) {
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } else {
      sessionStorage.setItem(TOKEN_KEY, res.token);
    }
  }

  private readStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
