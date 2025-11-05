-- Esquema de base de datos para PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('customer', 'courier', 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'picked', 'on_route', 'delivered', 'canceled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_usuario VARCHAR(255) NOT NULL,
  correo VARCHAR(255) NOT NULL UNIQUE,
  celular VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  foto TEXT,
  rol user_role NOT NULL DEFAULT 'customer',
  solucion BOOLEAN NOT NULL DEFAULT FALSE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public'
      AND table_name = 'usuarios'
      AND constraint_name = 'usuarios_correo_aloe_chk'
  ) THEN
    ALTER TABLE usuarios
      ADD CONSTRAINT usuarios_correo_aloe_chk
      CHECK (correo ~ '^[0-9]{8}@aloe\\.ulima\\.edu\\.pe$')
      NOT VALID;
  END IF;

  BEGIN
    ALTER TABLE usuarios
      VALIDATE CONSTRAINT usuarios_correo_aloe_chk;
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'Existen usuarios con correos fuera del dominio aloe.ulima.edu.pe. Actualízalos para validar la restricción.';
  END;
END $$;

CREATE TABLE IF NOT EXISTS tiendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_origen VARCHAR(255) NOT NULL,
  descripcion TEXT,
  logo TEXT,
  cantidad INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  foto TEXT,
  precio NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tarjetas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  numero_tarjeta VARCHAR(32) NOT NULL,
  vencimiento DATE NOT NULL,
  csv VARCHAR(10) NOT NULL,
  titulo VARCHAR(255),
  foto TEXT,
  invalidada BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ordenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking VARCHAR(255) NOT NULL UNIQUE,
  tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE RESTRICT,
  tarjeta_id UUID REFERENCES tarjetas(id) ON DELETE SET NULL,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  estado order_status NOT NULL DEFAULT 'pending',
  solucion BOOLEAN NOT NULL DEFAULT FALSE,
  tiempo_estimado INTEGER,
  direccion_entrega VARCHAR(255),
  comentarios TEXT,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orden_productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orden_usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  es_propietario BOOLEAN NOT NULL DEFAULT FALSE,
  es_repartidor BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT orden_usuarios_unq UNIQUE (orden_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS historial_estados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  estado order_status NOT NULL,
  comentarios TEXT,
  hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Datos de ejemplo ---------------------------------------------------------

INSERT INTO usuarios (id, nombre_usuario, correo, celular, password_hash, rol)
VALUES
  ('8d0f0b76-d93b-4a1c-9bfb-08c8d0f8d111', 'Cliente Demo', '20123456@aloe.ulima.edu.pe', '988888888', crypt('123456', gen_salt('bf')), 'customer'),
  ('d2c0e5b4-3e8b-41f0-8d6a-2b9f1283c222', 'Courier UFOOD', '20023456@aloe.ulima.edu.pe', '999999999', crypt('123456', gen_salt('bf')), 'courier')
ON CONFLICT (correo) DO NOTHING;

INSERT INTO tiendas (id, nombre_origen, descripcion, logo, cantidad)
VALUES
  ('5aa2fbe2-08e4-4c8d-96a0-1baf0c9c5a01', 'Bembos', 'Las hamburguesas más bravas', 'https://images.ufood.app/bembos-logo.png', 2),
  ('fd39f61a-3d34-4c67-a768-22a28cf3839a', 'La Nevera Fit', 'Tus desayunos siempre ganan', 'https://images.ufood.app/neverafit-logo.png', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO productos (id, tienda_id, nombre, descripcion, foto, precio)
VALUES
  ('a1e5dc46-9229-4e15-8ab1-7d6a26c8f5a1', '5aa2fbe2-08e4-4c8d-96a0-1baf0c9c5a01', 'Nuggets', 'Nuggets de pollo crujientes.', 'https://images.ufood.app/nuggets.jpg', 18.00),
  ('44a6f0df-4e56-47dd-a2f8-6e1a3a06c9ed', '5aa2fbe2-08e4-4c8d-96a0-1baf0c9c5a01', 'Hamburguesa Extrema', 'Doble carne y queso Edam.', 'https://images.ufood.app/hamburguesa-extrema.jpg', 23.90),
  ('a803d9d1-9f35-4a41-bd55-86a45bc1c712', 'fd39f61a-3d34-4c67-a768-22a28cf3839a', 'Açai Bowl', 'Con granola, plátano, fresas y arándanos.', 'https://images.ufood.app/acai.jpg', 25.00),
  ('1d2d5050-7cb6-4c86-bc30-df4b0da93b7e', 'fd39f61a-3d34-4c67-a768-22a28cf3839a', 'Tostadas con Palta', 'Pan integral con palta y semillas.', 'https://images.ufood.app/tostadas.jpg', 15.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tarjetas (id, usuario_id, numero_tarjeta, vencimiento, csv, titulo, foto)
VALUES
  ('b61fbe64-bdf1-49a8-9a1e-5b86c90f8f31', '8d0f0b76-d93b-4a1c-9bfb-08c8d0f8d111', '4111111111111111', DATE '2026-01-31', '123', 'Visa personal', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ordenes (id, tracking, tienda_id, tarjeta_id, fecha, hora, estado, tiempo_estimado, direccion_entrega, comentarios, total)
VALUES
  ('77a2b366-4a08-4b2b-8f12-9c5e28a66ec4', 'trk_sample_001', '5aa2fbe2-08e4-4c8d-96a0-1baf0c9c5a01', 'b61fbe64-bdf1-49a8-9a1e-5b86c90f8f31', TIMESTAMP WITH TIME ZONE '2024-06-01 12:00:00+00', TIMESTAMP WITH TIME ZONE '2024-06-01 12:30:00+00', 'on_route', 35, 'Av. Demo 123, Lima', 'Sin cebolla, por favor', 59.90)
ON CONFLICT (id) DO NOTHING;

INSERT INTO orden_productos (id, orden_id, producto_id, cantidad, precio_unitario)
VALUES
  ('f5f395d9-5c78-4b9b-9180-56d2cd9928e0', '77a2b366-4a08-4b2b-8f12-9c5e28a66ec4', 'a1e5dc46-9229-4e15-8ab1-7d6a26c8f5a1', 2, 18.00),
  ('04b31743-3ca1-459f-b323-0d9bb66a0e75', '77a2b366-4a08-4b2b-8f12-9c5e28a66ec4', '44a6f0df-4e56-47dd-a2f8-6e1a3a06c9ed', 1, 23.90)
ON CONFLICT (id) DO NOTHING;

INSERT INTO orden_usuarios (id, orden_id, usuario_id, es_propietario, es_repartidor)
VALUES
  ('f70c2d4e-1908-4338-9a4d-66a312a9a7fb', '77a2b366-4a08-4b2b-8f12-9c5e28a66ec4', '8d0f0b76-d93b-4a1c-9bfb-08c8d0f8d111', TRUE, FALSE),
  ('e90ff3d1-27fe-4e5a-93d3-1f7afd2aa9dc', '77a2b366-4a08-4b2b-8f12-9c5e28a66ec4', 'd2c0e5b4-3e8b-41f0-8d6a-2b9f1283c222', FALSE, TRUE)
ON CONFLICT (orden_id, usuario_id) DO NOTHING;

INSERT INTO historial_estados (id, orden_id, estado, comentarios, hora)
VALUES
  ('1f0c02ec-625f-4d06-9a2e-9b16b3fe7e60', '77a2b366-4a08-4b2b-8f12-9c5e28a66ec4', 'pending', 'Pedido registrado', TIMESTAMP WITH TIME ZONE '2024-06-01 12:00:00+00'),
  ('c585ac29-8730-4b7b-a8a5-7cf21c6e88af', '77a2b366-4a08-4b2b-8f12-9c5e28a66ec4', 'accepted', 'Tienda aceptó el pedido', TIMESTAMP WITH TIME ZONE '2024-06-01 12:05:00+00'),
  ('d54df2e8-513e-49bb-8d7d-90ec0b9f531b', '77a2b366-4a08-4b2b-8f12-9c5e28a66ec4', 'on_route', 'Repartidor en camino', TIMESTAMP WITH TIME ZONE '2024-06-01 12:20:00+00')
ON CONFLICT (id) DO NOTHING;

