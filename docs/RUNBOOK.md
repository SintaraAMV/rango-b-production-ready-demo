# TeamVault — Runbook mínimo

**Estado:** release candidate validado  
**Última validación técnica:** 2026-10-28

## Componentes

- Node.js + Express.
- PostgreSQL.
- Sesiones persistidas en PostgreSQL.
- Frontend en `public/`.
- CI: `.github/workflows/production-ready.yml`.

## Configuración

Valores reales siempre fuera de Git:

- `DATABASE_URL`
- `SESSION_SECRET` (mínimo 32 caracteres en producción)
- `NODE_ENV=production`
- `PORT`
- `ALERT_WEBHOOK_URL`

## Preparación y arranque

Instalar dependencias, aplicar esquema, cargar únicamente datos de prueba cuando corresponda y arrancar con el entorno de producción configurado.

Antes de aceptar un release:

- `GET /health` debe responder 200 con `status=ok`.
- `GET /ready` debe responder 200 con `status=ready`.

`/health` verifica proceso y `/ready` verifica PostgreSQL.

## Smoke funcional

1. iniciar sesión como Alice;
2. listar notas;
3. crear y editar una nota;
4. recargar y comprobar persistencia;
5. comprobar con Bob que no existe acceso cruzado;
6. comprobar que Bob recibe 403 en admin;
7. comprobar que Admin sí accede a la vista administrativa.

## Logs

Los logs contienen requestId, método, path, status, duración y userId cuando esté disponible.

No deben contener contraseñas, bodies de login, connection strings, secretos ni stacks enviados al cliente.

## Alertas

Se envía alerta HTTP ante fallo de readiness o errores 5xx capturados. El receptor real debe probarse en el proveedor final antes del lanzamiento público.

## Backup y restore

Generar backup con herramientas compatibles con la versión PostgreSQL del proveedor. Restaurar primero en una base aislada y comparar conteo y contenido antes de utilizar una copia como recuperación.

En la demo se restauraron 7/7 notas, con hash de contenido idéntico y restore medido en 1 segundo. Ese tiempo no se generaliza como RTO comercial.

## Rollback

Identificar un commit aprobado, arrancarlo en un entorno seguro y repetir `/health`, `/ready` y smoke funcional.

La demo restauró el commit de aplicación `04f1c50291cb2350aa5ee161ace88b5fd1b11273` y el smoke pasó.

Un rollback de código no revierte datos. Cambios de esquema futuros requieren un plan específico de datos.

## Incidente PostgreSQL

Si `/health` funciona y `/ready` devuelve 503:

1. tratar el servicio como no listo;
2. revisar PostgreSQL;
3. localizar requestId/alerta;
4. recuperar la dependencia o restaurar según autorización;
5. repetir readiness;
6. ejecutar smoke.

## Gate de lanzamiento público

- [ ] package-lock versionado;
- [ ] proveedor objetivo definido;
- [ ] secretos configurados fuera de Git;
- [ ] HTTPS verificado;
- [ ] health/readiness verificados en URL final;
- [ ] alerta entregada al responsable real;
- [ ] backup/restauración del proveedor demostrados;
- [ ] rollback del proveedor conocido;
- [ ] smoke final PASS.

Un control crítico necesario sin prueba mantiene NO-GO.
