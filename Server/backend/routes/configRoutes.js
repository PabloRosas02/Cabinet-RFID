import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { enviarNotificacionPendientes, enviarReporteSemanal, enviarAlertaStockMinimo } from '../services/emailService.js';
import { generarExcelEnMemoria } from '../utils/excelHelper.js';
import { verificarToken, verificarAdmin } from '../middlewares/auth.js';

const prisma = new PrismaClient();
const router = Router();

// Aplicar seguridad global al router mediante Token
router.use(verificarToken, verificarAdmin);

// =======================================================
// HELPER PARA OBTENER LOS DESTINATARIOS DESDE LA BD
// =======================================================
const obtenerDestinatariosDB = async (correoDestinoInput) => {
    if (correoDestinoInput && typeof correoDestinoInput === 'string' && correoDestinoInput.trim()) {
        const listaManual = correoDestinoInput
            .split(/[,;\s]+/)
            .map(c => c.trim())
            .filter(c => c.length > 0 && c.includes('@'));

        if (listaManual.length > 0) return listaManual;
    }

    const registrosBD = await prisma.destinatarioCorreo.findMany({
        where: { activo: true },
        select: { correo: true }
    });

    const correosBD = registrosBD.map(r => r.correo);

    if (correosBD.length === 0 && process.env.ADMIN_EMAIL) {
        return process.env.ADMIN_EMAIL.split(/[,;\s]+/).map(c => c.trim()).filter(Boolean);
    }

    return correosBD;
};

// HELPER EXHAUSTIVO PARA EXTRAER NÚMERO Y NOMBRE DE CUALQUIER USUARIO
const obtenerTextoUsuario = (usuarioObjeto, numeroDirecto, nombreDirecto, fallback = 'N/A') => {
    // 1. Extraer número dando prioridad a numTrabajador (campo real en Prisma)
    const numero = numeroDirecto 
        || usuarioObjeto?.numTrabajador 
        || usuarioObjeto?.numeroTrabajador 
        || usuarioObjeto?.numeroEmpleado 
        || usuarioObjeto?.numero 
        || usuarioObjeto?.codigo;

    // 2. Extraer el nombre desde el objeto o desde campos planos
    const nombre = usuarioObjeto?.nombre || nombreDirecto;

    // 3. Formatear salida según coincidencia
    if (numero && nombre) {
        return `${numero} - ${nombre}`;
    }
    if (nombre) {
        return nombre;
    }
    if (numero) {
        return String(numero);
    }

    return fallback;
};

// =======================================================
// RUTAS CRUD DE GESTIÓN DE DESTINATARIOS
// =======================================================

router.get('/configuracion/destinatarios', async (req, res) => {
    try {
        const lista = await prisma.destinatarioCorreo.findMany({ 
            orderBy: { id: 'desc' } 
        });
        res.json(lista);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/configuracion/destinatarios', async (req, res) => {
    try {
        const { correo, nombre } = req.body;
        if (!correo || !correo.includes('@')) {
            return res.status(400).json({ success: false, error: 'Correo electrónico inválido.' });
        }

        const nuevo = await prisma.destinatarioCorreo.create({
            data: { 
                correo: correo.trim(), 
                nombre: nombre?.trim() || null 
            }
        });
        res.json({ success: true, destinatario: nuevo });
    } catch (error) {
        res.status(400).json({ success: false, error: 'El correo ya existe en el sistema o es inválido.' });
    }
});

router.put('/configuracion/destinatarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { correo, nombre, activo } = req.body;

        const actualizado = await prisma.destinatarioCorreo.update({
            where: { id: Number(id) },
            data: { 
                correo: correo?.trim(), 
                nombre: nombre?.trim(), 
                activo: typeof activo === 'boolean' ? activo : undefined 
            }
        });
        res.json({ success: true, destinatario: actualizado });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.delete('/configuracion/destinatarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.destinatarioCorreo.delete({ 
            where: { id: Number(id) } 
        });
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// =======================================================
// RUTAS DE AUTOMATIZACIÓN Y ENVÍO DE REPORTES
// =======================================================

router.get('/configuracion/automatizacion', (req, res) => {
    res.json({ activo: true });
});

router.post('/configuracion/automatizacion', async (req, res) => {
    const { activo, correoDestino } = req.body || {};
    
    try {
        const destinatarios = await obtenerDestinatariosDB(correoDestino);
        console.log(`Solicitud de toggle recibida. Estado: ${activo}. Destinatarios:`, destinatarios);

        if (Boolean(activo)) {
            if (!destinatarios || destinatarios.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'No hay destinatarios activos en la base de datos para enviar el correo.' 
                });
            }

            const salidasPendientes = await prisma.salida.findMany({
                where: { 
                    estado: 'PENDIENTE'
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

            if (salidasPendientes.length > 0) {
                const listaFormateada = [];

                salidasPendientes.forEach(s => {
                    let motivoFinal = s.motivo || 'N/A';
                    if (s.motivo === 'Otro' && s.motivoOtro) {
                        motivoFinal = `Otro: ${s.motivoOtro}`;
                    }

                    let fechaSalidaFormateada = 'N/A';
                    if (s.fechaSalida) {
                        try {
                            fechaSalidaFormateada = new Date(s.fechaSalida).toLocaleString('es-MX', { 
                                timeZone: 'America/Tijuana',
                                hour12: true,
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit'
                            });
                        } catch (e) {
                            fechaSalidaFormateada = String(s.fechaSalida);
                        }
                    }

                    let totalPrestado = 0;
                    let totalDevuelto = 0;

                    const herramientasFormateadas = s.detalles.map(d => {
                        const nombreHerr = d.herramienta?.nombre || 'Desconocida';
                        const cantPrestada = d.cantidadPrestada || 1;
                        const cantRegresada = d.cantidadRegresada || 0;

                        totalPrestado += cantPrestada;
                        totalDevuelto += cantRegresada;

                        let textoHerramienta = `${cantPrestada}x ${nombreHerr}`;
                        if (cantRegresada > 0) {
                            textoHerramienta += ` (Regresó ${cantRegresada})`;
                        }
                        return textoHerramienta;
                    }).join(' | ');

                    const prestadorTexto = obtenerTextoUsuario(
                        s.prestador, 
                        s.prestadorNumero || s.prestadorTrabajadorNumero, 
                        s.prestadorNombre, 
                        'Admin Principal'
                    );

                    const solicitoTexto = obtenerTextoUsuario(
                        null, 
                        s.trabajadorNumero, 
                        s.trabajadorNombre, 
                        'N/A'
                    );

                    listaFormateada.push({
                        'Folio': `#${s.id}`,
                        'Orden': s.numeroOrden || 'N/A',
                        'Máquina': s.numeroMaquina || 'N/A',
                        'Prestó (Almacenista)': prestadorTexto,
                        'Solicitó (Empleado)': solicitoTexto,
                        'Motivo de Salida': motivoFinal,
                        'Fecha de Salida': fechaSalidaFormateada,
                        'Cantidad Prestada': totalPrestado,
                        'Cantidad Devuelta': totalDevuelto,
                        'Herramientas': herramientasFormateadas
                    });
                });

                if (listaFormateada.length > 0) {
                    const excelBuffer = await generarExcelEnMemoria(listaFormateada);
                    await enviarNotificacionPendientes(destinatarios, excelBuffer);
                    console.log(`Correo de pendientes enviado exitosamente a:`, destinatarios);
                } else {
                    console.log('No hay registros de salidas para generar el reporte.');
                }
            } else {
                console.log('El interruptor se activó, pero no hay devoluciones pendientes.');
            }
        }

        return res.json({ 
            success: true, 
            activo: Boolean(activo), 
            destinatario: Array.isArray(destinatarios) ? destinatarios.join(', ') : destinatarios 
        });

    } catch (error) {
        console.error('Error crítico al enviar el correo de pendientes:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// REPORTE SEMANAL DEL HISTORIAL
router.post('/reportes/historial-semanal', async (req, res) => {
    try {
        const { correoDestino } = req.body || {};
        const destinatarios = await obtenerDestinatariosDB(correoDestino);

        const haceUnaSemana = new Date();
        haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);

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

        const listaFormateada = historialSemanal.map(salida => {
            const resumenHerramientas = salida.detalles.map(d => {
                const nombre = d.herramienta?.nombre || 'Desconocida';
                const cantidad = d.cantidadPrestada || 1;
                const regresada = d.cantidadRegresada ? ` (Regresó ${d.cantidadRegresada})` : '';
                return `${cantidad}x ${nombre}${regresada}`;
            }).join(' | ');

            let motivoFinal = salida.motivo || 'N/A';
            if (salida.motivo === 'Otro' && salida.motivoOtro) {
                motivoFinal = `Otro: ${salida.motivoOtro}`;
            }

            const prestadorTexto = obtenerTextoUsuario(
                salida.prestador, 
                salida.prestadorNumero || salida.prestadorTrabajadorNumero, 
                salida.prestadorNombre, 
                'Admin Principal'
            );

            const receptorTexto = salida.estado === 'DEVUELTO' 
                ? obtenerTextoUsuario(
                    salida.receptor, 
                    salida.receptorNumero || salida.receptorTrabajadorNumero, 
                    salida.receptorNombre, 
                    'Admin Principal'
                ) 
                : 'Pendiente / En curso';

            const solicitoTexto = obtenerTextoUsuario(
                null, 
                salida.trabajadorNumero, 
                salida.trabajadorNombre, 
                'N/A'
            );

            return {
                'Folio': `#${salida.id}`,
                'Orden': salida.numeroOrden || 'N/A',
                'Máquina': salida.numeroMaquina || 'N/A',
                'Prestó (Almacenista)': prestadorTexto,
                'Recibió / Devolución': receptorTexto,
                'Solicitó (Empleado)': solicitoTexto,
                'Motivo de Salida': motivoFinal, 
                'Fecha de Salida': formatFecha(salida.fechaSalida),
                'Fecha Devolución': formatFecha(salida.fechaDevolucion),
                'Herramientas': resumenHerramientas,
                'Estado': salida.estado === 'PENDIENTE' ? 'PENDIENTE' : 'DEVUELTO'
            };
        });

        const excelBuffer = await generarExcelEnMemoria(listaFormateada);
        await enviarReporteSemanal(destinatarios, excelBuffer);

        console.log(`Reporte semanal enviado a:`, destinatarios);
        res.json({ 
            success: true, 
            registros: listaFormateada.length, 
            destinatario: Array.isArray(destinatarios) ? destinatarios.join(', ') : destinatarios 
        });

    } catch (error) {
        console.error('Error al enviar reporte semanal:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ALERTA DE STOCK MÍNIMO
router.post('/reportes/alertas-stock', async (req, res) => {
    try {
        const { correoDestino } = req.body || {};
        const destinatarios = await obtenerDestinatariosDB(correoDestino);

        const herramientas = await prisma.herramienta.findMany({
            where: {
                estado: {
                    not: 'DADA_DE_BAJA' 
                }
            }
        });

        const bajoStock = herramientas.filter(h => h.cantidadDisponible <= h.cantidadMinima);

        if (bajoStock.length === 0) {
            return res.json({ success: true, mensaje: 'No hay herramientas en stock mínimo actualmente.' });
        }

        const listaFormateada = bajoStock.map(h => ({
            'Código': h.codigo || 'N/A',
            'Nombre': h.nombre || 'N/A',
            'Tipo / Categoría': h.tipo || 'N/A',
            'Marca': h.marca || 'N/A',
            'Ubicación': h.ubicacion || 'N/A',
            '¿Es Consumible?': h.esDesechable ? 'SÍ (CONSUMIBLE)' : 'NO',
            'Stock Mínimo': h.cantidadMinima ?? 0,
            'Stock Máximo': h.cantidadMaxima ?? 'N/A',
            'Stock Físico': h.cantidadDisponible ?? 0,
            'Descripción': h.descripcion || 'Sin descripción'
        }));

        const excelBuffer = await generarExcelEnMemoria(listaFormateada);
        await enviarAlertaStockMinimo(destinatarios, excelBuffer);

        console.log(`Alerta de stock enviada a:`, destinatarios);
        res.json({ 
            success: true, 
            registros: listaFormateada.length, 
            destinatario: Array.isArray(destinatarios) ? destinatarios.join(', ') : destinatarios 
        });

    } catch (error) {
        console.error('Error crítico al enviar alerta de stock:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;