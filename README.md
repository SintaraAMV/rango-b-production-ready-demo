# TeamVault

Aplicación web pequeña para que cada persona del equipo gestione sus **notas privadas**.
Cada usuario inicia sesión y solo ve y administra sus propias notas; existe además un
usuario administrador con una vista de resumen del equipo.

- Backend: Node.js (>= 18) + Express
- Base de datos: PostgreSQL (paquete `pg`)
- Frontend: HTML, CSS y JavaScript sin frameworks (carpeta `public/`)
- Autenticación: usuario y contraseña (hash bcrypt) con sesiones guardadas en PostgreSQL

## Funcionalidades

- Inicio y cierre de sesión
- Listado, creación, edición y eliminación de notas propias
- Vista de administración (usuarios y notas del equipo) para el rol `admin`
- `GET /health` para comprobar que el servicio responde

## Requisitos

- Node.js 18 o superior y npm
- PostgreSQL 13 o superior

## Instalación

```bash
git clone <este-repositorio> teamvault
cd teamvault
npm install
cp .env.example .env
```

Edita `.env` con tu cadena de conexión (`DATABASE_URL`).

## Preparar la base de datos

1. Crea el rol y la base de datos (como superusuario de PostgreSQL):

   ```sql
   CREATE ROLE teamvault LOGIN PASSWORD 'TU_PASSWORD';
   CREATE DATABASE teamvault OWNER teamvault;
   ```

2. Crea las tablas y carga los datos de ejemplo:

   ```bash
   npm run db:init   # aplica db/schema.sql
   npm run db:seed   # usuarios y notas de ejemplo (sintéticos)
   ```

## Ejecutar

```bash
npm start
```

La aplicación queda disponible en `http://localhost:3000` (o el `PORT` configurado).

## Variables de entorno

| Variable       | Descripción                                   | Ejemplo                                          |
|----------------|-----------------------------------------------|--------------------------------------------------|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL (obligatoria) | `postgres://teamvault:TU_PASSWORD@localhost:5432/teamvault` |
| `PORT`         | Puerto HTTP (por defecto 3000)                | `3000`                                           |

## Usuarios de demostración

Datos completamente sintéticos, solo para pruebas locales:

| Usuario | Contraseña        | Rol           |
|---------|-------------------|---------------|
| alice   | `Alice-demo-2026` | usuario       |
| bob     | `Bob-demo-2026`   | usuario       |
| admin   | `Admin-demo-2026` | administrador |

## API (resumen)

| Método | Ruta                  | Descripción                         |
|--------|-----------------------|-------------------------------------|
| POST   | `/api/login`          | Iniciar sesión                      |
| POST   | `/api/logout`         | Cerrar sesión                       |
| GET    | `/api/me`             | Usuario autenticado                 |
| GET    | `/api/notes`          | Listar mis notas                    |
| GET    | `/api/notes/:id`      | Ver una nota                        |
| POST   | `/api/notes`          | Crear nota                          |
| PUT    | `/api/notes/:id`      | Editar nota                         |
| DELETE | `/api/notes/:id`      | Eliminar nota                       |
| GET    | `/api/admin/users`    | Usuarios y cantidad de notas (admin)|
| GET    | `/api/admin/notes`    | Notas del equipo (admin)            |
| GET    | `/health`             | Estado del servicio                 |
