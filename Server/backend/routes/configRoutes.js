import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { enviarNotificacionPendientes } from '../services/emailService.js';
import { generarExcelEnMemoria } from '../utils/excelHelper.js';

const prisma = new PrismaClient();
const router = Router();

router.get('/configuracion/automatizacion', (req, res) => {
    res.json({ activo: true });
});

router.post('/configuracion/automatizacion', async (req, res) => {
    const { activo } = req.body;
    
    console.log(`Solicitud de toggle recibida. Estado solicitado: ${activo}`);

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
                        'Folio': `#${s.id}`,
                        'Trabajador': s.trabajadorNombre,
                        'Herramienta': d.herramienta?.nombre || 'Desconocida',
                        'Número de Orden': s.numeroOrden || 'N/A',
                        'Número de Máquina': s.numeroMaquina || 'N/A',
                        'Fecha de Salida': new Date(s.fechaSalida).toLocaleString('es-MX', { 
                            timeZone: 'America/Tijuana',
                            hour12: true,
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit'
                        })
                    }))
                );

                // 1. Generamos el buffer con la misma lógica del frontend
                const excelBuffer = await generarExcelEnMemoria(listaFormateada);

                // 2. Enviamos el correo (Asegúrate que tu emailService soporte buffers como attachment)
                await enviarNotificacionPendientes(process.env.ADMIN_EMAIL, excelBuffer);
                
                console.log(`Correo enviado exitosamente. Archivo Excel generado con ${listaFormateada.length} pendientes.`);
            } else {
                console.log('El interruptor se activó, pero no hay devoluciones pendientes en la base de datos.');
            }
        } catch (error) {
            console.error('Error crítico al enviar el correo:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    res.json({ success: true, activo: Boolean(activo) });
});

export default router;