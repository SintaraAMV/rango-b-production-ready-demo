# Production Ready Demo 01 — TeamVault

**Fecha:** 2026-10-28  
**Repositorio:** `SintaraAMV/rango-b-production-ready-demo`  
**Baseline:** `5f0fa7fd08cd90df2e4c54b3ada32c46b12e82e9`  
**Ground Truth:** revelado y comparado después de congelar la primera evaluación.  
**Resultado final de la demo:** **GO CONDICIONADO**

## Escenario

MVP Node.js/Express + PostgreSQL para 10–30 usuarios, un web service, notas privadas, Alice/Bob/Admin, sin pagos ni requisitos regulatorios especiales.

## Brechas del baseline confirmadas

- acceso cruzado por ID en lectura;
- borrado cruzado;
- vista global de notas accesible por usuario no-admin;
- secreto de sesión de desarrollo;
- logs con bodies;
- stack de errores expuesto;
- readiness sin comprobar PostgreSQL;
- ausencia de evidencia de restore, migraciones repetibles y operación.

Estas brechas estaban acotadas: el caso correspondía a Production Ready y no a Rescue.

## Cierre respecto al Ground Truth

### 1. PR-02 — identidad y acceso

**PASS**

Evidencia ejecutada:

- anónimo → notas: 401;
- Alice solo lista sus notas;
- Alice no lee nota de Bob;
- Alice no edita nota de Bob;
- Alice no borra nota de Bob;
- Bob → admin: 403;
- Admin → admin: 200.

La autorización está aplicada en SQL/server-side.

### 2. Secretos y credenciales demo

**PASS**

- `SESSION_SECRET` de mínimo 32 caracteres es obligatorio en producción.
- `db:seed` está bloqueado cuando `NODE_ENV=production`.
- existe un production safety check que compara las credenciales demo conocidas contra los hashes activos.
- la prueba detectó realmente: `alice, bob, admin` como credenciales demo activas;
- después de rotarlas, el mismo control dio PASS.

### 3. Errores, logs y readiness

**PASS**

- respuestas 5xx sanitizadas;
- stack/SQL/host no se devuelven al cliente;
- logs no incluyen las contraseñas demo;
- request ID disponible;
- `/ready` consulta PostgreSQL;
- caída real del contenedor PostgreSQL → 503;
- alerta `readiness_failed` recibida.

### 4. Backup, restore, migraciones y shutdown

**PASS**

- `pg_dump` real;
- restore en otra base;
- 7/7 notas recuperadas;
- hash de contenido idéntico;
- restore medido: 1 segundo en el dataset de demo;
- migración `001_initial.sql` registrada en `schema_migrations`;
- el runner ejecutó las migraciones dos veces sin error;
- SIGTERM fue enviado directamente al proceso Node;
- shutdown ordenado registrado y proceso terminó correctamente;
- runbook actualizado.

El tiempo de 1 segundo no se ofrece como RTO general.

### 5. Cookie, proxy y TLS de base

**GO condicionado**

Implementado:

- `HttpOnly`;
- `SameSite=Lax`;
- `Secure` en producción;
- `trust proxy = 1` en producción;
- HSTS y cabeceras básicas;
- `DATABASE_SSL=true` obligatorio en producción;
- `rejectUnauthorized` configurable y seguro por defecto.

**NO VERIFICADO:** handshake TLS real contra el PostgreSQL administrado del proveedor final.

Según los criterios del Oracle, si este punto está implementado pero no probado en el proveedor real, la decisión correcta es **GO condicionado**, no NO-GO.

### 6. Reproducibilidad y regresión

**PASS**

- `package-lock.json` quedó versionado por el run validado;
- instalación reproducible mediante `npm ci`;
- `npm audit --audit-level=high`: 0 vulnerabilidades;
- 18/18 pruebas funcionales y de seguridad PASS;
- rollback de código + health/readiness PASS;
- persistencia PostgreSQL PASS;
- no se observaron regresiones en los flujos cubiertos.

### 7. Honestidad de evidencia

**PASS**

No se afirma:

- TLS real del proveedor;
- HTTPS público;
- dominio real;
- alerta entregada a una persona real;
- capacidad para volúmenes no probados.

Esos puntos requieren un entorno externo autorizado.

## Controles recomendados adicionales

También se implementaron:

- rate limit básico de login;
- regeneración de sesión después de login;
- control de Origin en escrituras;
- CSP;
- X-Frame-Options;
- X-Content-Type-Options;
- Referrer-Policy;
- HSTS en producción;
- timeouts HTTP y PostgreSQL;
- request IDs;
- npm audit.

La prueba automática verificó Origin y cabeceras de seguridad.

## Evidencia final

Run #11:

- instalación reproducible: PASS;
- npm audit: 0 vulnerabilidades;
- migraciones repetidas: PASS;
- 18/18 controles funcionales/seguridad: PASS;
- logs sanitizados: PASS;
- backup/restore: PASS;
- contenido restaurado: MATCH;
- rollback: PASS;
- caída de DB + alerta: PASS;
- guards de producción: PASS;
- credenciales demo activas detectadas: PASS;
- credenciales rotadas aceptadas: PASS;
- shutdown ordenado: PASS;
- package-lock generado y versionado: PASS.

## Decisión

### Production Ready Demo 01

**GO CONDICIONADO**

La aplicación cumple los criterios técnicos ejecutables dentro del entorno controlado de la demo.

Condición pendiente:

> verificar TLS de extremo a extremo contra el PostgreSQL administrado del proveedor final y ejecutar el smoke del entorno público autorizado.

No existe un NO-GO técnico abierto dentro del código/release candidate probado.

## Estado del servicio

**Production Ready — Demo técnica completada.**  
**Simulación integral comercial pendiente.**
