export interface User {
  id: string;
  username: string;
  email: string;
  units: 'metric' | 'imperial';
  theme: 'light' | 'dark' | 'auto';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type MeasurementCategory = 'blood_pressure' | 'single';

export interface MeasurementType {
  id: string;
  key: string;
  label: string;
  unit: string;
  category: MeasurementCategory;
  defaultMin: number;
  defaultMax: number;
  icon: string;
}

export type ReadingStatus = 'ok' | 'high' | 'low' | 'critical';

export interface Reading {
  id: string;
  userId: string;
  typeId: string;
  type?: MeasurementType;
  value: number | null;
  systolic: number | null;
  diastolic: number | null;
  unit: string;
  recordedAt: string;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LatestReading {
  type: MeasurementType;
  reading: Reading | null;
  status: ReadingStatus | null;
  rangeMin: number;
  rangeMax: number;
  sparkline: number[];
}

export interface DashboardData {
  latest: LatestReading[];
  pendingAlerts: number;
  recent: Reading[];
}

export interface SeriesPoint {
  day: string;
  value: number | null;
  systolic: number | null;
  diastolic: number | null;
}

export interface TrendsResponse {
  type: { id: string; key: string; label: string; unit: string; category: string };
  series: SeriesPoint[];
  avg7d: { value: number; systolic: number; diastolic: number; total: number };
  range: { min: number; max: number; diastolicMax: number };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TargetRange {
  userId: string;
  typeId: string;
  min: number;
  max: number;
  updatedAt: string;
}

export interface RangeWithDefaults {
  typeId: string;
  min: number;
  max: number;
  isCustom: boolean;
  type: MeasurementType;
}

export type AlertSeverity = 'high' | 'low' | 'critical';

export interface Alert {
  id: string;
  userId: string;
  readingId: string;
  typeId: string;
  severity: AlertSeverity;
  message: string;
  acknowledgedAt: string | null;
  createdAt: string;
  reading?: Reading;
  type?: MeasurementType;
}

export interface Provider {
  id: string;
  userId: string;
  name: string;
  specialty: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Appointment {
  id: string;
  userId: string;
  providerId: string;
  provider?: Provider;
  scheduledAt: string;
  reason: string | null;
  notes: string | null;
  followUp: string | null;
  createdAt: string;
}

export const TAG_OPTIONS = ['en-ayunas', 'antes-de-comer', 'post-ejercicio', 'noche', 'mañana'];
