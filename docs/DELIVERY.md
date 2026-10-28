# Entrega — Production Ready Demo 01

## Resultado

Se completó el hardening técnico de TeamVault y se verificó el release candidate mediante GitHub Actions con PostgreSQL 16 real.

**Release candidate:** GO  
**Lanzamiento público:** NO-GO hasta completar el gate de proveedor externo.

## Cambios principales

- separación de datos por propietario aplicada en SQL;
- rol admin obligatorio en rutas administrativas;
- configuración de sesión endurecida;
- logs sanitizados y request IDs;
- errores 5xx sanitizados;
- readiness real de PostgreSQL;
- webhook de alerta;
- suite automática de acceso, persistencia y errores;
- backup/restore aislado;
- rollback de código con smoke test.

## Evidencia

Run final de validación: GitHub Actions #5.

- 16/16 pruebas funcionales y de acceso: PASS;
- logs sanitizados: PASS;
- backup/restore: PASS;
- 7/7 notas restauradas;
- hash de contenido: MATCH;
- restore medido: 1 s;
- rollback a `04f1c50291cb2350aa5ee161ace88b5fd1b11273`: PASS;
- caída de PostgreSQL → readiness 503: PASS;
- alerta `readiness_failed` recibida: PASS.

## Pendiente antes de producción pública

- versionar `package-lock.json`;
- seleccionar y configurar proveedor final;
- configurar secretos reales;
- verificar HTTPS y URL pública;
- probar alerta al responsable real;
- probar backup/restore según el PostgreSQL administrado final;
- smoke final y rollback del proveedor.

## Operación

Consultar `docs/RUNBOOK.md`.

## Estado

La entrega técnica de la demo está cerrada como release candidate validado. No se afirma que exista un despliegue público real.
