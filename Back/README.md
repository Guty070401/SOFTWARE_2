# Backend API

Este backend expone un conjunto de endpoints REST respaldados por PostgreSQL que siguen el diagrama de clases provisto.

## Requisitos

- Node.js 20+
- npm
- PostgreSQL 14+ (o una instancia compatible)

## Instalación

```bash
cd Back
npm install
```

> **Nota:** Durante la instalación `bcrypt` necesita descargar un binario. Si se está detrás de un proxy, configure las variables `npm_config_proxy` y `npm_config_https_proxy` o instale `build-essential` para permitir que npm compile el módulo.

## Configuración de la base de datos

1. Ajuste la contraseña del usuario que usará la aplicación. Si utiliza el usuario `postgres` por defecto, puede establecer la contraseña `Guty` con:

   ```sql
   ALTER ROLE postgres WITH PASSWORD 'Guty';
   ```

   Si ya cuenta con una contraseña distinta, solo actualice el `.env` con ese valor.

2. Cree una base de datos vacía en PostgreSQL:

   ```sql
   CREATE DATABASE "Software";
   ```

3. Ejecute el script `database/schema.sql` para generar las tablas y tipos necesarios:

   ```bash
   psql -U postgres -d "Software" -f database/schema.sql
   ```

   Ajuste el usuario, host o puerto según su entorno.

4. Configure las credenciales en un archivo `.env` dentro del directorio `Back/` (el repositorio incluye un ejemplo con la contraseña `Guty`):

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=Software
   DB_USER=postgres
   DB_PASSWORD=Guty
   JWT_SECRET=super-secreto
   CORS_ORIGIN=http://localhost:5173
   ```

## Ejecución

Ambos scripts levantan el servidor en `http://localhost:3000` una vez que la conexión a PostgreSQL es válida:

```bash
npm run dev   # recarga automática con nodemon
npm start     # ejecución simple
```

Variables de entorno disponibles:

- `PORT`: Puerto HTTP (por defecto 3000)
- `DB_*`: Credenciales de PostgreSQL (host, puerto, nombre, usuario y contraseña)
- `DB_LOGGING`: Establezca `true` para ver las consultas SQL en consola
- `JWT_SECRET`: Clave usada para firmar tokens
- `CORS_ORIGIN`: Lista separada por comas de orígenes permitidos

## Flujo típico de uso

1. **Autenticación**
   - `POST /api/auth/register` crea un nuevo usuario comprador.
   - `POST /api/auth/login` con `email` y `password`. Devuelve el token JWT.

2. **Usuarios**
   - `GET /api/users/me` devuelve el perfil autenticado.
   - `PATCH /api/users/me` actualiza datos del perfil (nombre, celular, foto, rol).
   - `GET /api/users/me/cards` lista las tarjetas del usuario.
   - `POST /api/users/me/cards` agrega una tarjeta.
   - `DELETE /api/users/me/cards/:cardId` elimina una tarjeta del usuario.

3. **Tiendas y productos**
   - `GET /api/stores` lista tiendas con sus productos disponibles, listos para poblar el menú del frontend.

4. **Órdenes**
   - `POST /api/orders` crea una orden para la tienda seleccionada.
   - `GET /api/orders` lista órdenes según el rol del usuario (cliente, repartidor o administrador).
   - `GET /api/orders/:orderId` devuelve el detalle completo de una orden.
   - `PATCH /api/orders/:orderId/status` actualiza el estado siguiendo la secuencia `pending → accepted → picked → on_route → delivered` (o `canceled`).

## Estructura interna

- `src/database/connection.js`: Configuración de Sequelize y la conexión a PostgreSQL.
- `src/models`: Modelos de Sequelize (Usuario, Tienda, Tarjeta, Orden, etc.) y sus asociaciones.
- `src/services`: Contienen la lógica de negocio sobre los modelos persistentes.
- `src/controllers`: Traducen las peticiones HTTP a llamadas de servicio.
- `src/routes`: Define los endpoints y middlewares de autorización.
- `src/seed/seedData.js`: Carga datos de ejemplo directamente en la base de datos.

## Datos de ejemplo

El servidor se inicializa (tras sincronizar y aplicar la seed) con:

- **Usuarios:** un comprador de prueba y un repartidor.
- **Tiendas:** tres restaurantes con sus productos destacados.
- **Órdenes:** un pedido de ejemplo con historial de estados para probar el flujo de seguimiento.

Puede modificar `src/seed/seedData.js` para adaptar los datos iniciales o reemplazar `database/schema.sql` con su propia migración.

## Uso con el frontend

Configure el frontend para apuntar a `http://localhost:3000/api`. Con el token JWT generado en `/api/auth/login`, envíe el header `Authorization: Bearer <token>` para acceder a los endpoints protegidos.

## Colección de pruebas rápida

Use una herramienta como Postman o Thunder Client con las siguientes llamadas:

1. `POST /api/auth/login`
2. `GET /api/users/me` (con header Authorization)
3. `GET /api/stores`
4. `POST /api/orders`
5. `PATCH /api/orders/:orderId/status`

Estos pasos cubren el ciclo completo de compra desde la autenticación, selección de productos, creación de orden y actualización de estados.

## ¿Qué hacer después de iniciar el backend?

Si quieres validar rápidamente que todo funciona sin abrir el frontend, puedes seguir esta secuencia con `curl` (las credenciales provienen de los datos seed):

```bash
# 1) Autentícate con el usuario demo
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "cliente@ufood.com", "password": "123456"}'

# Guarda el token que devuelve la petición anterior en la variable TOKEN
export TOKEN="<token_devuelto>"

# 2) Consulta tu perfil
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN"

# 3) Lista tiendas y productos
curl http://localhost:3000/api/stores \
  -H "Authorization: Bearer $TOKEN"

# 4) Crea una orden usando los IDs obtenidos en la respuesta anterior
curl -X POST http://localhost:3000/api/orders \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"storeId": "<tienda_id>", "items": [{"productoId": "<producto_id>", "cantidad": 1}], "tarjetaId": "<tarjeta_id>"}'

# 5) Revisa tus pedidos
curl http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN"
```

Con esto confirmas que la autenticación, la consulta de catálogos y el flujo de órdenes funcionan con los datos cargados de ejemplo.

