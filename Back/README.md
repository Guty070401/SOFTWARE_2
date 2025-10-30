# Backend API

Este backend expone un conjunto de endpoints REST en memoria que siguen el diagrama de clases provisto.

## Requisitos

- Node.js 20+
- npm

## Instalación

```bash
cd Back
npm install
```

> **Nota:** Durante la instalación `bcrypt` necesita descargar un binario. Si se está detrás de un proxy, configure las variables `npm_config_proxy` y `npm_config_https_proxy` o instale `build-essential` para permitir que npm compile el módulo.

## Ejecución

Ambos scripts levantan el servidor en `http://localhost:3000`:

```bash
npm run dev   # recarga automática con nodemon
npm start     # ejecución simple
```

Puede configurar las variables de entorno en un archivo `.env`. Las más relevantes son:

- `PORT`: Puerto HTTP (por defecto 3000)
- `JWT_SECRET`: Clave usada para firmar tokens
- `CORS_ORIGIN`: Lista separada por comas de orígenes permitidos

## Flujo típico de uso

1. **Autenticación**
   - `POST /api/auth/login` con `email` y `password`. Devuelve el token JWT.
   - `POST /api/auth/register` crea un nuevo usuario comprador.

2. **Usuarios**
   - `GET /api/users/me` devuelve el perfil autenticado.
   - `PUT /api/users/me` actualiza datos del perfil.
   - `GET /api/users` (solo admins) lista todos los usuarios.

3. **Tiendas y productos**
   - `GET /api/stores` lista tiendas con sus productos.
   - `POST /api/stores` (admins) crea tiendas nuevas.
   - `POST /api/stores/:storeId/products` (dueño de tienda) agrega productos.

4. **Órdenes**
   - `POST /api/orders` crea una orden para una tienda.
   - `GET /api/orders` lista órdenes según el rol del usuario.
   - `PATCH /api/orders/:orderId/status` actualiza el estado siguiendo la secuencia `pendiente → preparada → enviada → entregada`.

## Estructura interna

- `src/models`: Modelos en memoria que representan el diagrama de clases (Usuario, Tienda, Tarjeta, Orden, etc.).
- `src/services`: Contienen la lógica de negocio y actualizan los modelos.
- `src/controllers`: Traducen las peticiones HTTP a llamadas de servicio.
- `src/routes`: Define los endpoints y middlewares de autorización.
- `src/data/database.js`: Fuente de datos en memoria y generadores de IDs.
- `src/seed/seedData.js`: Carga datos de ejemplo al iniciar el servidor.

## Datos de ejemplo

El servidor se inicializa con:

- **Usuarios:** un courier (`00000001@aloe.ulima.edu.pe`) y un comprador (`00000002@aloe.ulima.edu.pe`).
- **Tiendas:** una tienda con dos productos.
- **Órdenes:** ejemplos con historial de estados para probar el flujo completo.

Puede modificar `src/seed/seedData.js` para adaptar los datos iniciales al frontend.

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

