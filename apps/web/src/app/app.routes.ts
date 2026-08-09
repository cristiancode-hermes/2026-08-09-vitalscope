import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'readings',
        loadComponent: () => import('./pages/readings/readings.page').then((m) => m.ReadingsPage),
      },
      {
        path: 'readings/new',
        loadComponent: () => import('./pages/new-reading/new-reading.page').then((m) => m.NewReadingPage),
      },
      {
        path: 'readings/:id',
        loadComponent: () => import('./pages/reading-detail/reading-detail.page').then((m) => m.ReadingDetailPage),
      },
      {
        path: 'trends',
        loadComponent: () => import('./pages/trends/trends.page').then((m) => m.TrendsPage),
      },
      {
        path: 'ranges',
        loadComponent: () => import('./pages/ranges/ranges.page').then((m) => m.RangesPage),
      },
      {
        path: 'alerts',
        loadComponent: () => import('./pages/alerts/alerts.page').then((m) => m.AlertsPage),
      },
      {
        path: 'providers',
        loadComponent: () => import('./pages/providers/providers.page').then((m) => m.ProvidersPage),
      },
      {
        path: 'providers/:id',
        loadComponent: () => import('./pages/provider-detail/provider-detail.page').then((m) => m.ProviderDetailPage),
      },
      {
        path: 'appointments',
        loadComponent: () => import('./pages/appointments/appointments.page').then((m) => m.AppointmentsPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
