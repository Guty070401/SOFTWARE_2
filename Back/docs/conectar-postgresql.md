# Conectar el backend a tu base de datos PostgreSQL

La captura que compartiste muestra una instancia con dos bases (`Software` y `postgres`). A continuación tienes los pasos concretos para que el backend las utilice.

## 1. Verifica la base en pgAdmin (o tu cliente favorito)

1. Abre pgAdmin y asegúrate de que la base `Software` existe y está en estado "conectado".
2. Comprueba los valores de conexión (host/servidor, puerto, usuario) haciendo clic derecho en la base → **Propiedades**.
3. Confirma que el usuario que aparece (por ejemplo `postgres`) tiene permisos de lectura y escritura sobre la base.

> Si prefieres la terminal, ejecuta `\l` en `psql` para listar las bases y confirmar que `Software` figura en la lista.

## 2. Ajusta el `.env` del backend

Dentro del directorio `Back/`, crea (o edita) el archivo `.env` con los valores exactos que utilizas en pgAdmin. Usa este formato:

```env
DB_HOST=localhost        # o la IP/hostname que muestre pgAdmin
DB_PORT=5432             # puerto por defecto de PostgreSQL
DB_NAME=Software         # el nombre que aparece en tu captura
DB_USER=postgres         # el rol con permisos sobre la base
DB_PASSWORD=Guty         # la contraseña de ese rol
JWT_SECRET=super-secreto # puedes personalizarla
CORS_ORIGIN=http://localhost:5173
```

- Si tu instancia está en otra máquina, reemplaza `localhost` por la IP real.
- Si cambiaste la contraseña del rol `postgres`, usa la nueva contraseña.
- El repositorio incluye un `.env` de ejemplo para que solo tengas que copiarlo y actualizar valores.

## 3. Instala dependencias y prueba la conexión

En una terminal, ejecuta:

```bash
cd Back
npm install
npm run dev
```

Durante el arranque verás en consola mensajes como `Conectado a PostgreSQL` o errores si las credenciales no son correctas. Si todo va bien, la API quedará en `http://localhost:3000/api`.

## 4. (Opcional) Verifica que haya datos

Para comprobar que el backend está leyendo la base correcta:

1. Ejecuta `psql -U postgres -d "Software" -c "SELECT email FROM usuario;"` y verifica que existan los usuarios de prueba.
2. Haz una petición `GET http://localhost:3000/api/stores` desde tu navegador o herramienta como Postman. Debes recibir las tiendas y productos sembrados.

Si recibes errores de conexión:

- Revisa que el servidor de PostgreSQL esté en ejecución.
- Valida que el firewall permita conexiones al puerto `5432`.
- Confirma que los valores del `.env` no tengan espacios o comillas innecesarias.

Con estos pasos el backend queda apuntando a la base que ya aparece en pgAdmin.
