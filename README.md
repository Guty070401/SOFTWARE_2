# SOFTWARE_2

Aplicación full-stack para la gestión de pedidos de comida, compuesta por un backend en Node.js/Express con PostgreSQL y un frontend en React (Vite).

> **Nota:** Los usuarios del sistema usan correos institucionales `########@aloe.ulima.edu.pe` (ocho dígitos antes del dominio).

## Requisitos previos

- Node.js 20 o superior y npm
- PostgreSQL 14 o superior (o un servicio compatible)
- Bash o una terminal equivalente para ejecutar los comandos

## 1. Preparar la base de datos PostgreSQL

1. Inicia sesión en tu servidor PostgreSQL como un usuario con privilegios de superusuario (por ejemplo `postgres`).
2. Establece la contraseña `Guty` para el rol que utilizará la aplicación (puedes omitir este paso si ya cuentas con otra contraseña y la reflejas en el `.env`):

   ```sql
   ALTER ROLE postgres WITH PASSWORD 'Guty';
   ```

3. Crea la base de datos que usará el proyecto:

   ```sql
   CREATE DATABASE "Software";
   ```

4. Desde el directorio `Back/`, ejecuta el script de esquema para generar todas las tablas y tipos necesarios:

   ```bash
   psql -U postgres -d "Software" -f database/schema.sql
   ```

   Ajusta usuario, host o puerto según tu entorno.

   > Si ya tienes la base creada (por ejemplo desde pgAdmin) y solo buscas conectar el backend, sigue la guía detallada en [`Back/docs/conectar-postgresql.md`](Back/docs/conectar-postgresql.md).

## 2. Configurar y arrancar el backend

1. Sitúate en el directorio del backend y crea un archivo `.env` (el repositorio incluye un `.env` de referencia que puedes copiar o adaptar):

   ```bash
   cd Back
   cp .env .env.local  # opcional: conserva una copia con tus credenciales
   ```

   Variables mínimas esperadas:

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=Software
   DB_USER=postgres
   DB_PASSWORD=Guty
   JWT_SECRET=super-secreto
   CORS_ORIGIN=http://localhost:5173
   ```

2. Instala dependencias y arranca el servidor:

   ```bash
   npm install
   npm run dev   # recarga automática con nodemon
   ```

   El backend quedará disponible en `http://localhost:3000/api`. Durante el arranque se autenticará contra PostgreSQL, ejecutará las migraciones (`sequelize.sync()`) y poblará datos de ejemplo mediante `src/seed/seedData.js`.

## 3. Configurar y arrancar el frontend

1. En otra terminal, instala las dependencias del cliente:

   ```bash
   cd Front
   npm install
   ```

2. (Opcional) Define un archivo `.env` si quieres apuntar a un backend distinto. El cliente utiliza rutas relativas (`/api`) y en desarrollo Vite proxya automáticamente hacia `http://localhost:3000`, pero puedes sobrescribir el destino con:

   ```env
   # Cambia la URL base que usarán las peticiones del cliente
   VITE_API_URL=https://tu-backend/api

   # (solo desarrollo) especifica otro origen para el proxy de Vite
   VITE_API_PROXY_TARGET=http://tu-backend:3000
   ```

3. Inicia el servidor de desarrollo de Vite:

   ```bash
   npm run dev
   ```

   El frontend quedará expuesto típicamente en `http://localhost:5173` y consumirá la API del backend.

## 4. Flujo rápido de verificación

1. Autentícate con el usuario sembrado `20123456@aloe.ulima.edu.pe` / `123456` usando `POST /api/auth/login`.
2. Usa el token devuelto para consultar `GET /api/stores` y visualizar el catálogo desde el frontend.
3. Genera órdenes de prueba para comprobar el historial de estados y los listados para cada rol.

Consulta [`Back/README.md`](Back/README.md) para detalles adicionales sobre endpoints, semillas y estructura interna del backend.
