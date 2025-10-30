# SOFTWARE_2
Grupo 1 software 2

Integrantes:
NICOLÁS EDGARDO LÓPEZ HUERTA
PIERO ALEJANDRO GUTIERREZ HURTADO
FABRIZIO FRANCISCO MANUEL COLACCI CHAVEZ
HAROLD VIVIANO
LUIS CUELLAR

## Base de datos PostgreSQL

El archivo [`POSTGREES.txt`](POSTGREES.txt) replica exactamente las entidades del diagrama UML
compartido (Usuario, Tarjeta, Tienda, Producto, Ordenes, Orden_Usuario, Orden_Producto e
Historial_Estados). Cada tabla incluye las columnas con los mismos nombres y tipos de datos
coherentes con el modelo, las claves primarias/foráneas y un juego de datos de prueba para que
puedas validar la aplicación rápidamente.

Para ejecutarlo:

1. Crea la base de datos (por ejemplo `software2`):

   ```bash
   createdb software2
   ```

2. Importa el script para generar las tablas, restricciones e inserts de prueba:

   ```bash
   psql -d software2 -f POSTGREES.txt
   ```

El script elimina cualquier tabla previa, vuelve a crearlas respetando las relaciones del diagrama
(titulares de tarjetas, productos por tienda, usuarios asignados a órdenes y sus estados) y deja
usuarios, tarjetas, tiendas, productos, órdenes con sus participantes, ítems e historial de estados
listos para validar los endpoints del backend o hacer pruebas manuales. Los correos de ejemplo
siguen la convención de 8 dígitos antes del dominio `@aloe.ulima.edu.pe`, tal como solicitaste.
