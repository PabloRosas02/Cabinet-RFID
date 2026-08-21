-- ------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------

CREATE TYPE "Departamento" AS ENUM ('INGENIERIA', 'MANTENIMIENTO', 'ADMINISTRACION');
CREATE TYPE "RolUsuario" AS ENUM ('ADMINISTRADOR', 'SUPERVISOR_ALMACEN', 'ALMACENISTA', 'OPERADOR');
CREATE TYPE "EstadoHerramienta" AS ENUM ('ACTIVA', 'EN_MANTENIMIENTO', 'DADA_DE_BAJA');
CREATE TYPE "TipoAccion" AS ENUM ('CREACION', 'MODIFICACION', 'ELIMINACION');
CREATE TYPE "EstadoSalida" AS ENUM ('PENDIENTE', 'DEVUELTO');

-- ------------------------------------------------------
-- TABLAS
-- ------------------------------------------------------

CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "numTrabajador" INTEGER NOT NULL,
    "contrasena" TEXT NOT NULL,
    "depart" "Departamento" NOT NULL DEFAULT 'INGENIERIA',
    "rol" "RolUsuario" NOT NULL DEFAULT 'OPERADOR',
    "tarjetaRfid" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Herramienta" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "marca" TEXT,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "cantidadDisponible" INTEGER NOT NULL DEFAULT 0,
    "cantidadMinima" INTEGER NOT NULL DEFAULT 0,
    "imagen" TEXT,
    "estado" "EstadoHerramienta" NOT NULL DEFAULT 'ACTIVA',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT,
    "ubicacion" TEXT,

    CONSTRAINT "Herramienta_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HistorialHerramienta" (
    "id" SERIAL NOT NULL,
    "accion" "TipoAccion" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detalle" TEXT,
    "herramientaId" INTEGER,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "HistorialHerramienta_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Salida" (
    "id" SERIAL NOT NULL,
    "trabajadorNumero" TEXT NOT NULL,
    "trabajadorNombre" TEXT NOT NULL,
    "numeroOrden" TEXT,
    "numeroMaquina" TEXT,
    "prestadorId" INTEGER NOT NULL,
    "receptorId" INTEGER,
    "fechaSalida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaDevolucion" TIMESTAMP(3),
    "estado" "EstadoSalida" NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "Salida_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DetalleSalida" (
    "id" SERIAL NOT NULL,
    "salidaId" INTEGER NOT NULL,
    "herramientaId" INTEGER NOT NULL,
    "cantidadPrestada" INTEGER NOT NULL,
    "cantidadRegresada" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DetalleSalida_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DevolucionParcial" (
    "id" SERIAL NOT NULL,
    "detalleId" INTEGER NOT NULL,
    "receptorId" INTEGER NOT NULL,
    "cantidadDevuelta" INTEGER NOT NULL,
    "fechaDevolucion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevolucionParcial_pkey" PRIMARY KEY ("id")
);

-- ------------------------------------------------------
-- ÍNDICES
-- ------------------------------------------------------

CREATE UNIQUE INDEX "Usuario_numTrabajador_key" ON "Usuario"("numTrabajador");
CREATE UNIQUE INDEX "Usuario_tarjetaRfid_key" ON "Usuario"("tarjetaRfid");
CREATE UNIQUE INDEX "Herramienta_codigo_key" ON "Herramienta"("codigo");

-- ------------------------------------------------------
-- LLAVES FORÁNEAS (FOREIGN KEYS)
-- ------------------------------------------------------

ALTER TABLE "HistorialHerramienta" ADD CONSTRAINT "HistorialHerramienta_herramientaId_fkey" FOREIGN KEY ("herramientaId") REFERENCES "Herramienta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HistorialHerramienta" ADD CONSTRAINT "HistorialHerramienta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Salida" ADD CONSTRAINT "Salida_prestadorId_fkey" FOREIGN KEY ("prestadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Salida" ADD CONSTRAINT "Salida_receptorId_fkey" FOREIGN KEY ("receptorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DetalleSalida" ADD CONSTRAINT "DetalleSalida_salidaId_fkey" FOREIGN KEY ("salidaId") REFERENCES "Salida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DetalleSalida" ADD CONSTRAINT "DetalleSalida_herramientaId_fkey" FOREIGN KEY ("herramientaId") REFERENCES "Herramienta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DevolucionParcial" ADD CONSTRAINT "DevolucionParcial_detalleId_fkey" FOREIGN KEY ("detalleId") REFERENCES "DetalleSalida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DevolucionParcial" ADD CONSTRAINT "DevolucionParcial_receptorId_fkey" FOREIGN KEY ("receptorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ------------------------------------------------------
-- DATOS INICIALES (SEED)
-- ------------------------------------------------------

INSERT INTO "Usuario" ("numTrabajador", "nombre", "contrasena", "depart", "rol", "tarjetaRfid") VALUES
(1000, 'Admin Principal', '$2b$12$CXuyI7fzGmdjgm5Cm1GIZusRiVDQsINuDU8L3xz8kQEHFQcO5Ky8e', 'ADMINISTRACION', 'ADMINISTRADOR', 100001),
(1001, 'Supervisor Almacén', '$2b$12$CXuyI7fzGmdjgm5Cm1GIZusRiVDQsINuDU8L3xz8kQEHFQcO5Ky8e', 'INGENIERIA', 'SUPERVISOR_ALMACEN', 100002),
(1002, 'Almacenista Uno', '$2b$12$CXuyI7fzGmdjgm5Cm1GIZusRiVDQsINuDU8L3xz8kQEHFQcO5Ky8e', 'MANTENIMIENTO', 'ALMACENISTA', 100003),
(1003, 'Almacenista Dos', '$2b$12$CXuyI7fzGmdjgm5Cm1GIZusRiVDQsINuDU8L3xz8kQEHFQcO5Ky8e', 'INGENIERIA', 'ALMACENISTA', 100004),
(1004, 'Operador Alpha', '$2b$12$CXuyI7fzGmdjgm5Cm1GIZusRiVDQsINuDU8L3xz8kQEHFQcO5Ky8e', 'MANTENIMIENTO', 'OPERADOR', 100005),
(1005, 'Operador Beta', '$2b$12$CXuyI7fzGmdjgm5Cm1GIZusRiVDQsINuDU8L3xz8kQEHFQcO5Ky8e', 'INGENIERIA', 'OPERADOR', 100006),
(1006, 'Operador Gamma', '$2b$12$CXuyI7fzGmdjgm5Cm1GIZusRiVDQsINuDU8L3xz8kQEHFQcO5Ky8e', 'MANTENIMIENTO', 'OPERADOR', 100007),
(1007, 'Operador Delta', '$2b$12$CXuyI7fzGmdjgm5Cm1GIZusRiVDQsINuDU8L3xz8kQEHFQcO5Ky8e', 'ADMINISTRACION', 'OPERADOR', 100008),
(1008, 'Operador Epsilon', '$2b$12$CXuyI7fzGmdjgm5Cm1GIZusRiVDQsINuDU8L3xz8kQEHFQcO5Ky8e', 'INGENIERIA', 'OPERADOR', 100009),
(1009, 'Operador Zeta', '$2b$12$CXuyI7fzGmdjgm5Cm1GIZusRiVDQsINuDU8L3xz8kQEHFQcO5Ky8e', 'MANTENIMIENTO', 'OPERADOR', NULL)
ON CONFLICT ("numTrabajador") DO NOTHING;

INSERT INTO "Herramienta" ("codigo", "nombre", "marca", "cantidad", "cantidadDisponible", "cantidadMinima", "tipo", "ubicacion", "estado", "actualizadoEn") VALUES
('HERR-001', 'Taladro Inalámbrico 20V', 'DeWalt', 5, 5, 2, 'Eléctrica', 'Estante A1', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-002', 'Multímetro Digital', 'Fluke', 3, 3, 2, 'Medición', 'Estante A2', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-003', 'Cautín 40W', 'Weller', 10, 10, 2, 'Soldadura', 'Estante B1', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-004', 'Osciloscopio 100MHz', 'Tektronix', 2, 2, 2, 'Medición', 'Estante A3', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-005', 'Fuente de Poder DC', 'Korad', 4, 4, 2, 'Electrónica', 'Estante B2', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-006', 'Juego de Desarmadores', 'Truper', 15, 15, 2, 'Manual', 'Estante C1', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-007', 'Pinzas de Corte Diagonal', 'Klein Tools', 8, 8, 2, 'Manual', 'Estante C2', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-008', 'Pinzas Pelacables', 'Stanley', 12, 12, 2, 'Manual', 'Estante C2', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-009', 'Esmeriladora 4-1/2"', 'Makita', 3, 3, 2, 'Eléctrica', 'Estante A4', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-010', 'Sierra Circular 7-1/4"', 'Bosch', 2, 2, 2, 'Eléctrica', 'Estante A4', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-011', 'Pistola de Calor', 'Black+Decker', 5, 5, 2, 'Eléctrica', 'Estante B3', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-012', 'Vernier Digital', 'Mitutoyo', 6, 6, 2, 'Medición', 'Estante A2', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-013', 'Llave Inglesa 10"', 'Crescent', 10, 10, 2, 'Manual', 'Estante D1', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-014', 'Juego de Llaves Allen', 'Bondhus', 20, 20, 2, 'Manual', 'Estante D2', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-015', 'Martillo de Uña 16 oz', 'Truper', 8, 8, 2, 'Manual', 'Estante D3', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-016', 'Cinta Métrica 5m', 'Stanley', 15, 15, 2, 'Medición', 'Estante D4', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-017', 'Nivel de Gota 24"', 'Empire', 4, 4, 2, 'Medición', 'Estante D4', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-018', 'Estación de Soldadura', 'Hakko', 3, 3, 2, 'Soldadura', 'Estante B1', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-019', 'Extractor de Soldadura', 'Steren', 10, 10, 2, 'Soldadura', 'Estante B1', 'ACTIVA', CURRENT_TIMESTAMP),
('HERR-020', 'Lámpara de Trabajo LED', 'Milwaukee', 6, 6, 2, 'Iluminación', 'Estante E1', 'ACTIVA', CURRENT_TIMESTAMP)
ON CONFLICT ("codigo") DO NOTHING;