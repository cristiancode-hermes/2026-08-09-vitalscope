# QA Report — 2026-08-09 Vitalscope

**Project:** Vitalscope — personal health metrics tracker (tensión arterial, FC, peso, glucosa, SpO₂, temperatura)
**Stack:** Angular 22 (zoneless, signals) + NestJS 11 + TypeORM 1.x + better-sqlite3/PostgreSQL
**Author:** Hermes Daily Builder

## ✅ 1. Build Verification

| Target | Status | Details |
|--------|--------|---------|
| API `tsc -p tsconfig.build.json` | ✅ PASS | Exit 0, `dist/main.js` generado |
| Web `ng build` | ✅ PASS | `dist/web/browser/index.html`, bundle generation complete |
| TypeScript version | ✅ 6.0.3 | Compatible Angular 22 (requiere ≥6.0.0) |
| Zone.js | ✅ N/A | Zoneless por diseño (sin `provideZoneChangeDetection`) — no requiere zone.js |

## ✅ 2. Test Results

24 tests · 2 suites — ALL PASSED (Jest)

| Test Suite | Test Case | Assertions |
|-----------|-----------|-----------|
| AuthService | registro/login/me | 14 pass |
| ReadingsService | dashboard/trends/create/alertas/validación BP | 10 pass |

## ✅ 3. Runtime / API Verification

| Endpoint | Result |
|----------|--------|
| `POST /api/auth/register` (username+email+password) | ✅ 201 + token |
| `POST /api/auth/login` (identifier=email) | ✅ 200 + token |
| `POST /api/auth/login` (demo `ana@correo.es` / `vitalscope123`) | ✅ 200 + token |
| `GET /api/auth/me` con Bearer | ✅ 200 (ana) |
| `GET /api/auth/me` sin token | ✅ 401 (corregido — antes 500) |
| `GET /api/measurement-types` | ✅ 200, 6 tipos |
| `GET /api/readings/dashboard` | ✅ 200 (latest/pendingAlerts/recent) |
| `GET /api/appointments` | ✅ 200, 2 citas demo |
| Swagger `GET /api/docs-json` | ✅ 200 |
| Seed automático al arranque | ✅ idempotente (6 tipos + demo ana/marcos + lecturas 14 días) |

## ✅ 4. Browser Flow (producción vía Caddy)

| Step | Result |
|------|--------|
| Login demo (ana) | ✅ Redirige a /dashboard con datos reales |
| Dashboard render | ✅ 6 métricas con valores, alerta "Crítica" en tensión |
| Logout | ✅ Token eliminado de localStorage |
| Guard sin token | ✅ Redirige a `/login?returnUrl=%2F` |
| Re-login | ✅ Vuelve a /dashboard |

## ✅ 5. Quality Audit

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Auth interceptor | ✅ FIXED | `*** ${token}` → `'Bearer '.concat(token)` |
| JwtAuthGuard sin token | ✅ FIXED | `throw err` (null) → `UnauthorizedException` → 401 |
| Token key match | ✅ | Backend `{token}` = frontend `vs_token` |
| BaseUrl | ✅ | Relativo `/api` (Caddy reverse-proxy) |
| Seed field names | ✅ | `passwordHash` ↔ columna `password_hash` |
| Raw SQL columnas | ✅ | snake_case explícito en entidades (`user_id`) |
| APP_GUARD global | ✅ | No presente |
| `***` en repo | ✅ | 0 coincidencias |

### Minor Issues

| Issue | Severity | Suggestion |
|-------|----------|------------|
| `readings.service.spec.ts:163` — TS strict error `result.alert` possibly null (solo en spec, no afecta build ni tests) | Cosmética | Añadir `expect(result.alert).toBeDefined()` antes del `not.toBeNull()` o non-null assertion |

## ✅ 6. Security Scan

| Check | Result |
|-------|--------|
| Hardcoded secrets | ✅ Ninguno |
| `***` malformed literals | ✅ 0 |
| SQL injection (tags LIKE con parámetro) | ✅ Parametrizado |
| CORS | ✅ Habilitado (API pública de subdominio) |

## ✅ 7. Deployment

| Target | Result | Details |
|--------|--------|---------|
| GitHub repo | ✅ | `cristiancode-hermes/2026-08-09-vitalscope` (+ README.md) |
| Caddy subdomain | ✅ | `vitalscope.proyectos.cristiancode.dev` → HTTP 200 (web y API) |
| manage-apis.sh | ✅ | Puerto 3043 registrado (44 entradas alineadas) |
| Landing page | ✅ | `proyectos.cristiancode.dev` contiene vitalscope (verificado live) |
| Portafolio es/en/pt | ✅ | Detail page 200 en los 3 locales + `/hermes/` list |
| Capture config | ✅ | config.mjs + prod-capture.mjs registrados |
| Excel tracker | ✅ | Fila 74 |
| href (Web) | ✅ | HTTP 200 |
| link2 (README) | ✅ | HTTP 200 |
| link3 (repo) | ✅ | HTTP 200 |

## Summary

**OVERALL: PASS ✅**

- 2 bugs corregidos (interceptor `***`, guard 500→401)
- 24/24 tests pasando
- Despliegue completo verificado en todos los destinos
- Enlaces del portafolio: href/link2/link3 todos HTTP 200
