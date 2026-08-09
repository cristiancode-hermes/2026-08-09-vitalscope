# Vitalscope — Personal Health Metrics Tracker

Seguimiento personal de métricas de salud: tensión arterial, frecuencia cardíaca, peso, glucosa, saturación O₂ y temperatura corporal. Con tendencias, rangos personalizados, alertas automáticas y gestión de doctores/citas.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 22 (zoneless, signals) + Tailwind CSS v4 |
| Backend | NestJS 11 + TypeORM 1.x |
| Base de datos | better-sqlite3 (local) / PostgreSQL (Neon, `DATABASE_TYPE=postgres`) |
| Auth | JWT (Passport) + bcrypt |
| Tests | Jest (24 tests API) |

## Estructura

```
apps/
  api/   # API NestJS (puerto 3043)
  web/   # Frontend Angular
```

## Puesta en marcha

```bash
npm install
npm run build
cd apps/api && PORT=3043 node dist/main.js   # seed automático e idempotente
```

## Demo

- Usuario: `ana` / `ana@correo.es`
- Contraseña: `vitalscope123`

## Endpoints principales

- `POST /api/auth/register` — `{ username, email, password }`
- `POST /api/auth/login` — `{ identifier, password }`
- `GET /api/auth/me` — perfil (Bearer token)
- `GET /api/readings/dashboard` — resumen con últimas lecturas y alertas
- `GET /api/readings/trends?typeId=&days=` — tendencias
- `GET/POST /api/readings` — lecturas paginadas
- `GET/PUT/DELETE /api/ranges/:typeId` — rangos personalizados
- `GET /api/alerts`, `GET/POST/PATCH /api/providers`, `GET/POST/PATCH /api/appointments`

## Tests

```bash
cd apps/api && npm test   # 24 tests, 2 suites
```

## Despliegue

- Web: `https://vitalscope.proyectos.cristiancode.dev`
- API: puerto `3043` (gestionada por `manage-apis.sh`)
