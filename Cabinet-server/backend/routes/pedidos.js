import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
    // Si el usuario ingresó manualmente y no existe en la BD, lo manejamos mediante su número
    const { trabajadorNumero, herramientas } = req.body;

    try {
        await prisma.$transaction(async (tx) => {
            // Intentamos buscar al usuario, si no existe, tomaremos un ID por defecto para el historial
            // o podrías modificar tu lógica para permitir registros sin un usuario estrictamente existente.
            let usuario = await tx.usuario.findUnique({ 
                where: { numTrabajador: parseInt(trabajadorNumero) } 
            });

            for (const item of herramientas) {
                // Actualizar stock de la herramienta
                await tx.herramienta.update({
                    where: { id: item.id },
                    data: { cantidadDisponible: { decrement: item.cantidadPrestada } }
                });

                // Registrar en el historial (si el usuario existe, asignamos su ID, de lo contrario usamos 1 o ajustas según tu necesidad)
                await tx.historialHerramienta.create({
                    data: {
                        accion: 'MODIFICACION',
                        herramientaId: item.id,
                        usuarioId: usuario ? usuario.id : 1 
                    }
                });
            }
            return true;
        });

        res.status(201).json({ message: "Pedido procesado y stock actualizado." });
    } catch (error) {
        console.error("Error en pedido:", error);
        res.status(400).json({ error: error.message });
    }
});

export default router;