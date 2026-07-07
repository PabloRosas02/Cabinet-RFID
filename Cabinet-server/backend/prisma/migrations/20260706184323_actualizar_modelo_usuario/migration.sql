/*
  Warnings:

  - You are about to drop the column `activo` on the `Usuario` table. All the data in the column will be lost.
  - The `departamento` column on the `Usuario` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[correo]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contrasena` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `correo` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `tarjetaRfid` on the `Usuario` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DepartamentoOpciones" AS ENUM ('INGENIERIA', 'MANTENIMIENTO', 'ADMINISTRACION');

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "activo",
ADD COLUMN     "contrasena" TEXT NOT NULL,
ADD COLUMN     "correo" TEXT NOT NULL,
DROP COLUMN "departamento",
ADD COLUMN     "departamento" "DepartamentoOpciones" NOT NULL DEFAULT 'INGENIERIA',
DROP COLUMN "tarjetaRfid",
ADD COLUMN     "tarjetaRfid" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_tarjetaRfid_key" ON "Usuario"("tarjetaRfid");
