#!/usr/bin/env python3
"""Smoke test de la API de Vitalscope (endpoints reales)."""
import json
import urllib.request

BASE = "http://localhost:3043/api"
ok = 0
fail = 0


def call(method, path, body=None, token=None, raw=False):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data=data, timeout=15) as resp:
            payload = resp.read()
            return resp.status, (payload.decode() if raw else json.loads(payload or b"{}"))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def check(name, cond, extra=""):
    global ok, fail
    if cond:
        ok += 1
        print(f"  OK  {name} {extra}")
    else:
        fail += 1
        print(f"  FAIL {name} {extra}")


print("== Auth ==")
import time
unique = f"smoketest{int(time.time())}"
s, r = call("POST", "/auth/register", {"username": unique, "email": f"{unique}@test.es", "password": "password123"})
check("register nuevo usuario", s == 201, f"({s})")
s, r = call("POST", "/auth/register", {"username": "ana", "email": "otro@test.es", "password": "password123"})
check("register duplicado username -> 409", s == 409, f"({s})")
s, r = call("POST", "/auth/login", {"identifier": "ana", "password": "vitalscope123"})
check("login por username", s == 200 and "token" in r, f"({s})")
token = r.get("token", "")
s, r = call("POST", "/auth/login", {"identifier": "ana@correo.es", "password": "vitalscope123"})
check("login por email", s == 200 and "token" in r, f"({s})")
s, r = call("POST", "/auth/login", {"identifier": "ana", "password": "incorrecta1"})
check("login password mal -> 401", s == 401, f"({s})")

print("== Measurement types ==")
s, r = call("GET", "/measurement-types", token=token)
check("listar types", s == 200 and len(r) >= 5, f"({s}, {len(r)} tipos)")

print("== Readings ==")
s, r = call("GET", "/readings/dashboard", token=token)
check("dashboard", s == 200 and "latest" in r, f"({s})")
check("  latest tiene BP + HR", len(r.get("latest", [])) >= 4, "")
s, r = call("GET", "/readings?limit=5", token=token)
check("list readings paginado", s == 200 and "items" in r and r["total"] > 10, f"({s}, total={r.get('total')})")
s, r = call("POST", "/readings", {"typeId": "mt-bp", "systolic": 118, "diastolic": 74}, token=token)
check("crear lectura en rango", s == 201, f"({s})")
s, r = call("POST", "/readings", {"typeId": "mt-hr", "value": 160, "tags": ["post-ejercicio"]}, token=token)
check("crear lectura alta -> alerta", s == 201 and r.get("alert"), f"({s}, alert={bool(r.get('alert'))})")
reading_id = r.get("reading", {}).get("id", "")
s, r = call("PATCH", f"/readings/{reading_id}", {"value": 75}, token=token)
check("patch lectura", s == 200, f"({s})")
s, r = call("GET", "/readings/trends?typeId=mt-bp&days=30", token=token)
check("trends BP", s == 200 and len(r.get("series", [])) > 0, f"({s})")
s, r = call("GET", "/readings/export", token=token, raw=True)
check("export CSV", s == 200 and "typeId" in r, f"({s}, {len(r)} bytes)")
s, r = call("GET", f"/readings/{reading_id}", token=token)
check("get reading detail", s == 200, f"({s})")
s, r = call("DELETE", f"/readings/{reading_id}", token=token)
check("delete reading", s == 200, f"({s})")

print("== Ranges ==")
s, r = call("GET", "/ranges", token=token)
check("list ranges con defaults", s == 200 and len(r) >= 5 and any(x.get("isCustom") for x in r), f"({s})")
s, r = call("PUT", "/ranges/mt-glucose", {"min": 80, "max": 130}, token=token)
check("upsert custom range", s == 200 or s == 201, f"({s})")
s, r = call("GET", "/ranges", token=token)
custom = [x for x in r if x["typeId"] == "mt-glucose"]
check("range custom aplicado", custom and custom[0]["isCustom"], "")

print("== Alerts ==")
s, r = call("GET", "/alerts?acknowledged=false", token=token)
check("list alerts pendientes", s == 200 and "items" in r, f"({s})")
s, r = call("GET", "/alerts/count", token=token)
check("count pending", s == 200 and r.get("pending", 0) >= 1, f"({s}, pending={r.get('pending')})")
if r.get("pending", 0) >= 1:
    s, r2 = call("GET", "/alerts?acknowledged=false&limit=5", token=token)
    alert_id = r2["items"][0]["id"]
    s, r3 = call("PATCH", f"/alerts/{alert_id}/ack", {}, token=token)
    check("ack alerta", s == 200, f"({s})")

print("== Providers ==")
s, r = call("GET", "/providers", token=token)
check("list providers", s == 200 and len(r) >= 1, f"({s}, {len(r)})")
s, r = call("POST", "/providers", {"name": "Dr. Prueba", "specialty": "Neurología", "phone": "91 111 222"}, token=token)
check("create provider", s == 201, f"({s})")
provider_id = r.get("id", "")
s, r = call("PATCH", f"/providers/{provider_id}", {"specialty": "Cardiología"}, token=token)
check("patch provider", s == 200, f"({s})")

print("== Appointments ==")
s, r = call("POST", "/appointments", {"providerId": provider_id, "scheduledAt": "2026-09-01T10:30:00.000Z", "reason": "Revisión"}, token=token)
check("create appointment", s == 201, f"({s})")
s, r = call("GET", "/appointments?scope=upcoming", token=token)
check("list upcoming", s == 200 and len(r) >= 1, f"({s})")
appt_id = r[0]["id"] if r else ""
s, r = call("DELETE", f"/appointments/{appt_id}", token=token)
check("delete appointment", s == 200, f"({s})")

print(f"\nRESULTADO: {ok} OK / {fail} FAIL")
exit(1 if fail else 0)
