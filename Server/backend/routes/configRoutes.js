import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { enviarNotificacionPendientes } from '../services/emailService.js';

const router = Router();

let automatizacionGlobal = false;

router.get('/configuracion/automatizacion', (req, res) => {
    res.json({ activo: automatizacionGlobal });
});

router.post('/configuracion/automatizacion', async (req, res) => {
    const { activo } = req.body;
    automatizacionGlobal = Boolean(activo);
    
    console.log(`🚀 Automatización de correos ${automatizacionGlobal ? 'ACTIVADA' : 'DESACTIVADA'}`);

    // Si el usuario acaba de ACTIVAR el interruptor, enviamos el reporte de inmediato
    if (automatizacionGlobal) {
        try {
            const salidasPendientes = await prisma.salida.findMany({
                where: { estado: 'PENDIENTE' },
                include: {
                    detalles: {
                        include: { herramienta: true }
                    }
                }
            });

            if (salidasPendientes.length > 0) {
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

                await enviarNotificacionPendientes(process.env.ADMIN_EMAIL, listaFormateada);
                console.log(`✉️ Correo de prueba enviado por activación del toggle. Pendientes: ${listaFormateada.length}`);
            } else {
                console.log('✅ Se activó el toggle, pero no hay devoluciones pendientes.');
            }
        } catch (error) {
            console.error('❌ Error al enviar el correo al activar el toggle:', error);
        }
    }

    res.json({ success: true, activo: automatizacionGlobal });
});

export default router;