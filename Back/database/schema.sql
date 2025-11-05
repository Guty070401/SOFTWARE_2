-- Esquema de base de datos para PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

