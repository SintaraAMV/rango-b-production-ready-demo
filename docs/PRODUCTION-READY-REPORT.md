# Production Ready Demo 01 — TeamVault

**Fecha:** 2026-10-28  
**Repositorio:** `SintaraAMV/rango-b-production-ready-demo`  
**Baseline:** `5f0fa7fd08cd90df2e4c54b3ada32c46b12e82e9`  
**Commit verificado:** `fd1029bcbbc919bffb73ce22492978296548c58b`  
**Workflow final:** GitHub Actions run #5 — PASS  
**Tipo:** demo técnica sintética

## Escenario acordado

TeamVault es un MVP Node.js/Express con PostgreSQL, sesiones persistidas, usuarios Alice/Bob/Admin y notas privadas. El escenario de referencia es un equipo pequeño (aprox. 10–30 usuarios), un único web service y una base PostgreSQL administrada. No hay pagos, webhooks ni requisitos regulatorios especiales.

La demo evalúa preparación técnica del release candidate. No se ha realizado un lanzamiento público en un proveedor externo dentro de esta ejecución.

## Baseline observado

La aplicación arrancaba conceptualmente y su flujo principal estaba implementado, pero el código inicial presentaba brechas de preparación:

- `SESSION_SECRET` tenía fallback fijo.
- Los logs imprimían cuerpos completos de request.
- Los errores devolvían `stack` al cliente.
- `GET /api/notes/:id` no filtraba por propietario.
- `DELETE /api/notes/:id` no filtraba por propietario.
- `GET /api/admin/notes` solo exigía autenticación, no rol admin.
- `/health` no comprobaba la dependencia PostgreSQL.
- No existía evidencia ejecutada de alertas, backup/restore o rollback.

El caso seguía siendo un MVP funcional y acotado, por lo que se mantuvo en Production Ready y no se derivó a Rescue.

## Cambios aplicados

- Validación de `SESSION_SECRET` en producción.
- Cookie de sesión `httpOnly`, `sameSite=lax` y `secure` en producción.
- `trust proxy` en producción.
- Request ID por petición.
- Logs estructurados sin body ni credenciales.
- Errores 5xx sanitizados sin stack para el cliente.
- `/ready` con comprobación real de PostgreSQL.
- Webhook de alerta para errores 5xx/readiness.
- Autorización de propietario aplicada en SQL para leer, editar y borrar notas.
- Middleware de rol admin para todo `/api/admin`.
- Suite automática de pruebas con PostgreSQL real.
- Prueba de caída de dependencia y recepción de alerta.
- Backup PostgreSQL y restauración en DB aislada.
- Smoke test de rollback de código.

## Matriz PR-01 → PR-07

### PR-01 — Build y configuración

**Estado: PASS con riesgo residual menor.**

Evidencia:

- Node 22 en CI.
- PostgreSQL 16 real.
- instalación de dependencias exitosa;
- esquema y seed ejecutados;
- `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV`, `PORT` y `ALERT_WEBHOOK_URL` documentados;
- secreto de sesión exigido en producción;
- valores sensibles fuera del código/logs.

Riesgo residual:

El ZIP original incluía `package-lock.json`, pero ese archivo no quedó versionado en el repositorio durante esta ejecución por una limitación del canal de escritura usado. El workflow instala desde `package.json`; por tanto, la reproducibilidad de versiones transitivas no es absoluta. Antes de un lanzamiento real debe versionarse el lockfile.

### PR-02 — Identidad y acceso a datos

**Estado: PASS.**

Pruebas ejecutadas:

- anónimo → notas: 401;
- Alice lista únicamente sus notas;
- Alice → GET nota Bob: 404;
- Alice → PUT nota Bob: 404;
- Alice → DELETE nota Bob: 404;
- Bob → admin notes: 403;
- Admin → admin notes: 200.

La autorización está aplicada en servidor/capa SQL, no solo en UI.

### PR-03 — Persistencia y errores

**Estado: PASS.**

Pruebas:

- credenciales inválidas controladas;
- input inválido: 400;
- alta de nota: PASS;
- relectura: PASS;
- edición propia: PASS;
- persistencia confirmada directamente en PostgreSQL;
- ruta inexistente: 404;
- readiness devuelve 503 cuando PostgreSQL cae;
- respuestas no exponen stack;
- logs no contienen las contraseñas demo.

### PR-04 — Integraciones críticas

**Estado: N/A justificado.**

El alcance no contiene pagos, webhooks de negocio ni integraciones críticas externas. El webhook de alerta pertenece a observabilidad y se evalúa en PR-05.

### PR-05 — Observabilidad

**Estado: PASS para el escenario de demo.**

- logs estructurados con request ID, método, path, status y duración;
- no se registran bodies de login;
- caída real del PostgreSQL del entorno de prueba;
- `/ready` respondió 503;
- webhook recibió un evento `readiness_failed`;
- evidencia guardada como artifact de GitHub Actions.

La prueba demuestra transporte de alerta al receptor acordado de la demo; no demuestra un SLA humano 24×7.

### PR-06 — Recuperación

**Estado: PASS para el dataset/entorno probado.**

Run final:

- `pg_dump` ejecutado con herramientas PostgreSQL 16;
- restauración en base aislada `teamvault_restore`;
- notas origen: 7;
- notas restauradas: 7;
- hash de contenido: idéntico;
- restore medido: 1 segundo en run #5.

Ese tiempo no es una promesa de RTO para otros volúmenes o proveedores.

### PR-07 — Release y operación

**Estado: PASS para el release candidate / NO EVALUADO en proveedor público externo.**

- smoke del release candidate: PASS;
- rollback real por Git al último commit de aplicación:
  `04f1c50291cb2350aa5ee161ace88b5fd1b11273`;
- instancia de rollback arrancada en puerto alternativo;
- `/health`: PASS;
- `/ready`: PASS;
- rollback smoke: PASS.

No se desplegó TeamVault en Render, Neon u otro proveedor público dentro de esta ejecución, por lo que HTTPS, dominio, variables del proveedor y smoke de una URL pública no se afirman como verificados.

## Evidencia automática final

GitHub Actions run #5:

- controles funcionales/seguridad: **16/16 PASS**;
- backup/restore: **PASS**;
- conteo restaurado: **7/7**;
- hash de contenido: **MATCH**;
- restore medido: **1 s**;
- rollback: **PASS**;
- fallo de dependencia: **PASS**;
- alerta recibida: **PASS**;
- workflow final: **SUCCESS**.

## Decisión técnica

### Release candidate

**GO**

El código y la operación mínima probada son aptos para pasar a un entorno de staging/hosting autorizado.

### Lanzamiento público para usuarios reales

**NO-GO todavía**

Bloqueos de lanzamiento:

1. versionar `package-lock.json`;
2. desplegar en el proveedor objetivo autorizado;
3. configurar secretos reales mediante el proveedor;
4. verificar HTTPS y URL final;
5. ejecutar smoke final en ese entorno;
6. comprobar que la alerta llega al responsable real;
7. asociar la estrategia de backup/restore al PostgreSQL administrado elegido.

Esto no invalida la preparación técnica realizada; separa correctamente el release candidate de una producción que todavía no fue desplegada.

## Resultado de la demo

**DEMO TÉCNICA EJECUTADA.**

La aplicación pasó de un MVP funcional con brechas de acceso, configuración, errores y operación a un release candidate endurecido y validado automáticamente.

La comparación contra el Ground Truth privado del CASE BUILDER debe hacerse después de congelar este resultado.
