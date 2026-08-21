import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { enviarNotificacionPendientes } from '../services/emailService.js';

const router = Router();

// Endpoint para consultar el estado (opcional, para mantener sincronizado el UI)
router.get('/configuracion/automatizacion', (req, res) => {
    res.json({ activo: true });
});

// Endpoint que se ejecuta al mover el switch
router.post('/configuracion/automatizacion', async (req, res) => {
    const { activo } = req.body;
    
    console.log(`🚀 Solicitud de toggle recibida. Estado solicitado: ${activo}`);

    // Si el usuario encendió el interruptor (activo === true)
    if (Boolean(activo)) {
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
                console.log(`✉️ Correo enviado exitosamente. Pendientes encontrados: ${listaFormateada.length}`);
            } else {
                console.log('✅ El interruptor se activó, pero no hay devoluciones pendientes en la base de datos.');
            }
        } catch (error) {
            console.error('❌ Error crítico al enviar el correo:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    res.json({ success: true, activo: Boolean(activo) });
});

export default router;