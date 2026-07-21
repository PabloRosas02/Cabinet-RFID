-- CreateEnum
CREATE TYPE "Departamento" AS ENUM ('INGENIERIA', 'MANTENIMIENTO', 'ADMINISTRACION');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMINISTRADOR', 'SUPERVISOR_ALMACEN', 'ALMACENISTA', 'OPERADOR');

-- CreateEnum
CREATE TYPE "EstadoHerramienta" AS ENUM ('ACTIVA', 'EN_MANTENIMIENTO', 'DADA_DE_BAJA');

-- CreateEnum
CREATE TYPE "TipoAccion" AS ENUM ('CREACION', 'MODIFICACION', 'ELIMINACION');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'DEVUELTO');

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "HistorialHerramienta" (
    "id" SERIAL NOT NULL,
    "accion" "TipoAccion" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "herramientaId" INTEGER,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "HistorialHerramienta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" SERIAL NOT NULL,
    "trabajadorNumero" TEXT NOT NULL,
    "trabajadorNombre" TEXT NOT NULL,
    "prestadorId" INTEGER NOT NULL,
    "receptorId" INTEGER,
    "fechaPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaDevolucion" TIMESTAMP(3),
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetallePedido" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "herramientaId" INTEGER NOT NULL,
    "cantidadPrestada" INTEGER NOT NULL,
    "cantidadRegresada" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DetallePedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_numTrabajador_key" ON "Usuario"("numTrabajador");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_tarjetaRfid_key" ON "Usuario"("tarjetaRfid");

-- CreateIndex
CREATE UNIQUE INDEX "Herramienta_codigo_key" ON "Herramienta"("codigo");

-- AddForeignKey
ALTER TABLE "HistorialHerramienta" ADD CONSTRAINT "HistorialHerramienta_herramientaId_fkey" FOREIGN KEY ("herramientaId") REFERENCES "Herramienta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialHerramienta" ADD CONSTRAINT "HistorialHerramienta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_prestadorId_fkey" FOREIGN KEY ("prestadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_receptorId_fkey" FOREIGN KEY ("receptorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetallePedido" ADD CONSTRAINT "DetallePedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetallePedido" ADD CONSTRAINT "DetallePedido_herramientaId_fkey" FOREIGN KEY ("herramientaId") REFERENCES "Herramienta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
