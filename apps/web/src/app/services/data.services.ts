import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import type {
  Alert,
  Appointment,
  DashboardData,
  MeasurementType,
  Paginated,
  Provider,
  RangeWithDefaults,
  Reading,
  TrendsResponse,
} from '../models/models';

export interface CreateReadingPayload {
  typeId: string;
  value?: number;
  systolic?: number;
  diastolic?: number;
  unit?: string;
  recordedAt?: string;
  notes?: string;
  tags?: string[];
}

export interface ListReadingsParams {
  type?: string;
  from?: string;
  to?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ReadingsService {
  constructor(private http: HttpClient) {}

  list(params: ListReadingsParams = {}) {
    let httpParams = new HttpParams();
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.from) httpParams = httpParams.set('from', params.from);
    if (params.to) httpParams = httpParams.set('to', params.to);
    if (params.tag) httpParams = httpParams.set('tag', params.tag);
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    return lastValueFrom(this.http.get<Paginated<Reading>>('/api/readings', { params: httpParams }));
  }

  create(payload: CreateReadingPayload) {
    return lastValueFrom(this.http.post<{ reading: Reading; alert: Alert | null }>('/api/readings', payload));
  }

  get(id: string) {
    return lastValueFrom(this.http.get<Reading>(`/api/readings/${id}`));
  }

  update(id: string, payload: Partial<CreateReadingPayload>) {
    return lastValueFrom(this.http.patch<{ reading: Reading; alert: Alert | null }>(`/api/readings/${id}`, payload));
  }

  remove(id: string) {
    return lastValueFrom(this.http.delete(`/api/readings/${id}`));
  }

  dashboard() {
    return lastValueFrom(this.http.get<DashboardData>('/api/readings/dashboard'));
  }

  trends(typeId: string, days: number) {
    return lastValueFrom(this.http.get<TrendsResponse>('/api/readings/trends', { params: { typeId, days } }));
  }
}

@Injectable({ providedIn: 'root' })
export class MeasurementTypesService {
  private cached: MeasurementType[] | null = null;

  constructor(private http: HttpClient) {}

  async list(): Promise<MeasurementType[]> {
    if (this.cached) return this.cached;
    this.cached = await lastValueFrom(this.http.get<MeasurementType[]>('/api/measurement-types'));
    return this.cached;
  }

  clearCache() {
    this.cached = null;
  }
}

@Injectable({ providedIn: 'root' })
export class RangesService {
  constructor(private http: HttpClient) {}

  list() {
    return lastValueFrom(this.http.get<RangeWithDefaults[]>('/api/ranges'));
  }

  upsert(typeId: string, min: number, max: number) {
    return lastValueFrom(this.http.put(`/api/ranges/${typeId}`, { min, max }));
  }

  remove(typeId: string) {
    return lastValueFrom(this.http.delete(`/api/ranges/${typeId}`));
  }
}

@Injectable({ providedIn: 'root' })
export class AlertsService {
  constructor(private http: HttpClient) {}

  list(acknowledged?: boolean, page = 1, limit = 20) {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (acknowledged !== undefined) params = params.set('acknowledged', String(acknowledged));
    return lastValueFrom(this.http.get<Paginated<Alert>>('/api/alerts', { params }));
  }

  pendingCount() {
    return lastValueFrom(this.http.get<{ pending: number }>('/api/alerts/count'));
  }

  acknowledge(id: string) {
    return lastValueFrom(this.http.patch<Alert>(`/api/alerts/${id}/ack`, {}));
  }

  remove(id: string) {
    return lastValueFrom(this.http.delete(`/api/alerts/${id}`));
  }
}

@Injectable({ providedIn: 'root' })
export class ProvidersService {
  constructor(private http: HttpClient) {}

  list() {
    return lastValueFrom(this.http.get<Provider[]>('/api/providers'));
  }

  create(payload: Partial<Provider>) {
    return lastValueFrom(this.http.post<Provider>('/api/providers', payload));
  }

  get(id: string) {
    return lastValueFrom(this.http.get<Provider>(`/api/providers/${id}`));
  }

  update(id: string, payload: Partial<Provider>) {
    return lastValueFrom(this.http.patch<Provider>(`/api/providers/${id}`, payload));
  }

  remove(id: string) {
    return lastValueFrom(this.http.delete(`/api/providers/${id}`));
  }
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  constructor(private http: HttpClient) {}

  list(scope: 'upcoming' | 'past' | 'all' = 'all') {
    return lastValueFrom(this.http.get<Appointment[]>('/api/appointments', { params: { scope } }));
  }

  create(payload: { providerId: string; scheduledAt: string; reason?: string; notes?: string; followUp?: string }) {
    return lastValueFrom(this.http.post<Appointment>('/api/appointments', payload));
  }

  update(id: string, payload: Partial<{ scheduledAt: string; reason: string; notes: string; followUp: string }>) {
    return lastValueFrom(this.http.patch<Appointment>(`/api/appointments/${id}`, payload));
  }

  remove(id: string) {
    return lastValueFrom(this.http.delete(`/api/appointments/${id}`));
  }
}
