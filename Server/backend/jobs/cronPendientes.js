import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { enviarNotificacionPendientes } from '../services/emailService.js';

let automatizacionActiva = false;
let tareaCron = null;

export const configurarCronNotificaciones = () => {
    // Se ejecuta cada 1 minuto exacto para pruebas
    tareaCron = cron.schedule('*/15 * * * * *', async () => {
        if (!automatizacionActiva) return;

        console.log('⏰ [Prueba] Revisando devoluciones pendientes con Prisma...');
        
        try {
            // Consultamos usando el enum exacto de tu schema: EstadoSalida.PENDIENTE
            const salidasPendientes = await prisma.salida.findMany({
                where: { estado: 'PENDIENTE' },
                include: {
                    detalles: {
                        include: {
                            herramienta: true
                        }
                    }
                }
            });

            let listaFormateada = [];
            salidasPendientes.forEach(s => {
                s.detalles.forEach(d => {
                    listaFormateada.push({
                        folio: s.id,
                        trabajadorNombre: s.trabajadorNombre,
                        herramientaNombre: d.herramienta?.nombre || 'Herramienta',
                        numeroOrden: s.numeroOrden || 'N/A',
                        numeroMaquina: s.numeroMaquina || 'N/A',
                        fechaSalida: new Date(s.fechaSalida).toLocaleString('es-MX', { 
                        timeZone: 'America/Tijuana',
                        hour12: true 
                    })
                    });
                });
            });

            if (listaFormateada.length > 0) {
                await enviarNotificacionPendientes(process.env.ADMIN_EMAIL, listaFormateada);
                console.log(`✉️ Correo enviado con éxito. Pendientes encontrados: ${listaFormateada.length}`);
            } else {
                console.log('✅ No hay devoluciones pendientes en este momento.');
            }
        } catch (error) {
            console.error('❌ Error al ejecutar el cron de pendientes con Prisma:', error);
        }
    }, {
        scheduled: false // Inicia detenido por defecto
    });
};

export const cambiarEstadoAutomatizacion = (activar) => {
    automatizacionActiva = activar;
    if (activar) {
        tareaCron.start();
        console.log('🚀 Automatización de correos ACTIVADA (Cada 1 minuto)');
    } else {
        tareaCron.stop();
        console.log('🛑 Automatización de correos DESACTIVADA');
    }
    return automatizacionActiva;
};

export const obtenerEstadoAutomatizacion = () => automatizacionActiva;