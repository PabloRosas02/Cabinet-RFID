import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { enviarNotificacionPendientes } from '../services/emailService.js';

const prisma = new PrismaClient();
const router = Router();

router.get('/pendientes', async (req, res) => {
    try {
        // 1. Proteger el endpoint contra ejecuciones no autorizadas
        const authHeader = req.headers.authorization;
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // 2. Consultar la configuración desde la Base de Datos (en lugar de memoria)
        const config = await prisma.configuracion.findFirst({ where: { clave: 'AUTOMATIZACION_ALERTAS' } });
        const automatizacionActiva = config ? config.valor === 'true' : true;

        if (!automatizacionActiva) {
            console.log('⏸️ Cron omitido: Automatización desactivada en BD.');
            return res.status(200).json({ success: true, message: 'Automatización desactivada' });
        }

        console.log('⏰ Ejecutando revisión de pendientes (Vercel Cron)...');

        // 3. Buscar salidas pendientes
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

        // 4. Enviar notificación
        await enviarNotificacionPendientes(process.env.ADMIN_EMAIL, listaFormateada);
        
        return res.status(200).json({ success: true, enviados: listaFormateada.length });
    } catch (error) {
        console.error('Error en cron de Vercel:', error);
        return res.status(500).json({ error: error.message });
    }
});

export default router;