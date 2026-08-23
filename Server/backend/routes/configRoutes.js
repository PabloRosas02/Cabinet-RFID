import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { enviarNotificacionPendientes, enviarReporteSemanal, enviarAlertaStockMinimo } from '../services/emailService.js';
import { generarExcelEnMemoria } from '../utils/excelHelper.js';

const prisma = new PrismaClient();
const router = Router();

// =======================================================
// RUTAS DE AUTOMATIZACIÓN (DEVOLUCIONES PENDIENTES)
// =======================================================

router.get('/configuracion/automatizacion', (req, res) => {
    res.json({ activo: true });
});

router.post('/configuracion/automatizacion', async (req, res) => {
    // 1. Recibir el correo destino opcional (además del estado activo)
    const { activo, correoDestino } = req.body;
    
    // Si mandan un correo, lo usamos. Si no, usamos el del .env
    const destinatario = correoDestino || process.env.ADMIN_EMAIL;
    
    console.log(`Solicitud de toggle recibida. Estado solicitado: ${activo}. Destinatario: ${destinatario}`);

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

                const excelBuffer = await generarExcelEnMemoria(listaFormateada);
                // 2. Enviar el correo a la variable 'destinatario'
                await enviarNotificacionPendientes(destinatario, excelBuffer);
                
                console.log(`Correo de pendientes enviado a ${destinatario}. Archivo Excel generado con ${listaFormateada.length} pendientes.`);
            } else {
                console.log('El interruptor se activó, pero no hay devoluciones pendientes en la base de datos.');
            }
        } catch (error) {
            console.error('Error crítico al enviar el correo de pendientes:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    res.json({ success: true, activo: Boolean(activo), destinatario });
});


// =======================================================
// REPORTE SEMANAL DEL HISTORIAL
// =======================================================

router.post('/reportes/historial-semanal', async (req, res) => {
    try {
        // 1. Recibir el correo opcional desde el frontend
        const { correoDestino } = req.body;
        
        // Si mandan un correo, lo usamos. Si no, usamos el del .env
        const destinatario = correoDestino || process.env.ADMIN_EMAIL;

        // Calcular la fecha límite (hace 7 días exactos)
        const haceUnaSemana = new Date();
        haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);

        // Traer los registros de Prisma (últimos 7 días)
        const historialSemanal = await prisma.salida.findMany({
            where: {
                fechaSalida: {
                    gte: haceUnaSemana
                }
            },
            include: {
                detalles: {
                    include: { herramienta: true } 
                },
                prestador: true,
                receptor: true
            },
            orderBy: {
                fechaSalida: 'desc'
            }
        });

        if (historialSemanal.length === 0) {
            console.log('Solicitud de reporte semanal: No hubo movimientos esta semana.');
            return res.json({ success: true, mensaje: 'No hubo movimientos esta semana.' });
        }

        // Función para estandarizar las fechas en el Excel
        const formatFecha = (fecha) => {
            if (!fecha) return 'Pendiente';
            return new Date(fecha).toLocaleString('es-MX', { 
                timeZone: 'America/Tijuana',
                hour12: true,
                year: 'numeric', 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit'
            });
        };

        // Formatear la información para las columnas del Excel (Estilo Historial)
        const listaFormateada = historialSemanal.map(salida => {
            // Unimos todas las herramientas prestadas en esa salida
            const resumenHerramientas = salida.detalles.map(d => {
                const nombre = d.herramienta?.nombre || 'Desconocida';
                const cantidad = d.cantidadPrestada || 1;
                const regresada = d.cantidadRegresada ? ` (Regresó ${d.cantidadRegresada})` : '';
                return `${cantidad}x ${nombre}${regresada}`;
            }).join(' | ');

            // Lógica para formatear el Motivo de Salida
            let motivoFinal = salida.motivo || 'N/A';
            if (salida.motivo === 'Otro' && salida.motivoOtro) {
                motivoFinal = `Otro: ${salida.motivoOtro}`;
            }

            return {
                'Folio': `#${salida.id}`,
                'Orden': salida.numeroOrden || 'N/A',
                'Máquina': salida.numeroMaquina || 'N/A',
                'Prestó (Almacenista)': salida.prestador?.nombre || 'Admin Principal',
                'Recibió / Devolución': salida.receptor?.nombre || 'Pendiente / En curso',
                'Solicitó (Empleado)': `${salida.trabajadorNumero || ''} - ${salida.trabajadorNombre || 'N/A'}`.trim(),
                'Motivo de Salida': motivoFinal, 
                'Fecha de Salida': formatFecha(salida.fechaSalida),
                'Fecha Devolución': formatFecha(salida.fechaDevolucion),
                'Herramientas': resumenHerramientas,
                'Estado': salida.estado === 'PENDIENTE' ? 'PENDIENTE' : 'DEVUELTO'
            };
        });

        // Generar el Excel y enviarlo por correo
        const excelBuffer = await generarExcelEnMemoria(listaFormateada);
        
        // 2. Enviar el correo a la variable 'destinatario'
        await enviarReporteSemanal(destinatario, excelBuffer);

        console.log(`Reporte semanal enviado a ${destinatario} con ${listaFormateada.length} registros.`);
        res.json({ success: true, registros: listaFormateada.length, destinatario });

    } catch (error) {
        console.error('Error al enviar reporte semanal:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =======================================================
// ALERTA DE STOCK MÍNIMO (INVENTARIO)
// =======================================================

router.post('/reportes/alertas-stock', async (req, res) => {
    try {
        // 1. Recibir el correo opcional desde el frontend
        const { correoDestino } = req.body;
        
        // Si mandan un correo, lo usamos. Si no, usamos el del .env
        const destinatario = correoDestino || process.env.ADMIN_EMAIL;

        // Traer herramientas activas o en mantenimiento (ignoramos las dadas de baja)
        const herramientas = await prisma.herramienta.findMany({
            where: {
                estado: {
                    not: 'DADA_DE_BAJA' 
                }
            }
        });

        // Filtrar únicamente las que estén en estado crítico
        const bajoStock = herramientas.filter(h => h.cantidadDisponible <= h.cantidadMinima);

        if (bajoStock.length === 0) {
            console.log('Solicitud de alerta de stock: Todo el inventario está sano.');
            return res.json({ success: true, mensaje: 'No hay herramientas en stock mínimo actualmente.' });
        }

        // Formatear la información para tu helper de Excel (incluyendo Marca y Descripción)
        const listaFormateada = bajoStock.map(h => ({
            'Código': h.codigo || 'N/A',
            'Nombre': h.nombre || 'N/A',
            'Tipo / Categoría': h.tipo || 'N/A',
            'Marca': h.marca || 'N/A',
            'Ubicación': h.ubicacion || 'N/A',
            'Stock Mínimo': h.cantidadMinima,
            'Stock Físico': h.cantidadDisponible,
            'Descripción': h.descripcion || 'Sin descripción'
        }));

        // Generar el Excel en memoria con el formato actualizado
        const excelBuffer = await generarExcelEnMemoria(listaFormateada);
        
        // 2. Enviar el correo a la variable 'destinatario'
        await enviarAlertaStockMinimo(destinatario, excelBuffer);

        console.log(`Alerta de stock enviada a ${destinatario}. ${listaFormateada.length} herramientas críticas.`);
        res.json({ success: true, registros: listaFormateada.length, destinatario });

    } catch (error) {
        console.error('Error crítico al enviar alerta de stock:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;