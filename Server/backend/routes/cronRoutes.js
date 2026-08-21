import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { enviarNotificacionPendientes } from '../services/emailService.js';
import { obtenerEstadoGlobal } from './configRoutes.js'; // Importamos el estado del switch

const router = Router();

router.get('/pendientes', async (req, res) => {
    try {
        // 1. Verificamos si el switch está activado por el usuario
        if (!obtenerEstadoGlobal()) {
            console.log('⏸️ Cron ejecutado, pero la automatización está DESACTIVADA por el usuario.');
            return res.status(200).json({ success: true, message: 'Automatización desactivada' });
        }

        console.log('⏰ Ejecutando revisión de pendientes (Vercel Cron)...');

        // 2. Buscamos las salidas pendientes en Prisma
        const salidasPendientes = await prisma.salida.findMany({
            where: { estado: 'PENDIENTE' },
            include: {
                detalles: {
                    include: { herramienta: true }
                }
            }
        });

        if (salidasPendientes.length === 0) {
            return res.status(200).json({ message: 'No hay pendientes' });
        }

        const listaFormateada = salidasPendientes.flatMap(s => 
            s.detalles.map(d => ({
                folio: s.id,
                trabajadorNombre: s.trabajadorNombre,
                herramientaNombre: d.herramienta?.nombre || 'Herramienta',
                numeroOrden: s.numeroOrden || 'N/A',
                numeroMaquina: s.numeroMaquina || 'N/A',
                fechaSalida: new Date(s.fechaSalida).toLocaleString('es-MX', { 
                    timeZone: 'America/Tijuana',
                    hour12: true 
                })
            }))
        );

        // 3. Enviamos el correo
        await enviarNotificacionPendientes(process.env.ADMIN_EMAIL, listaFormateada);
        return res.status(200).json({ success: true, enviados: listaFormateada.length });
    } catch (error) {
        console.error('Error en cron de Vercel:', error);
        return res.status(500).json({ error: error.message });
    }
});

export default router;