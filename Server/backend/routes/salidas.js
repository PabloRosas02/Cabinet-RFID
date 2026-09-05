import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { verificarToken } from '../middlewares/auth.js';
import { enviarCodigoAutorizacionDano, enviarAlertaHerramientaBaja } from '../services/emailService.js';

const router = express.Router();
const prisma = new PrismaClient();

// =====================================================================
// Función auxiliar para obtener la Llave Primaria segura desde el Token
// =====================================================================
const obtenerUsuarioIdValido = async (req) => {
    const tokenData = req.user || req.usuario;
    if (!tokenData) return null;

    try {
        let usuarioReal = null;
        const posibleId = parseInt(tokenData.id || (typeof tokenData !== 'object' ? tokenData : null), 10);
        const posibleNumTrabajador = parseInt(tokenData.numTrabajador, 10);

        if (!isNaN(posibleNumTrabajador)) {
            usuarioReal = await prisma.usuario.findFirst({
                where: { numTrabajador: posibleNumTrabajador }
            });
        }

        if (!usuarioReal && !isNaN(posibleId)) {
            usuarioReal = await prisma.usuario.findFirst({
                where: {
                    OR: [
                        { id: posibleId },
                        { numTrabajador: posibleId }
                    ]
                }
            });
        }

        return usuarioReal ? usuarioReal.id : null;
    } catch (error) {
        console.error('Error al validar el usuario en la BD:', error);
        return null;
    }
};

// =====================================================================
// 1. POST /api/salidas -> Crear una nueva Salida (Soporta Desechables y CONSUMIDO)
// =====================================================================
router.post('/', verificarToken, async (req, res) => {
    const { 
        trabajadorNumero, 
        trabajadorNombre, 
        numeroOrden, 
        numeroMaquina, 
        herramientas,
        motivo,        
        motivoOtro    
    } = req.body;

    try {
        if (!trabajadorNumero || !trabajadorNombre) {
            return res.status(400).json({ error: 'El número y nombre del trabajador son obligatorios.' });
        }

        if (!herramientas || !Array.isArray(herramientas) || herramientas.length === 0) {
            return res.status(400).json({ error: 'Debes incluir al menos una herramienta en la salida.' });
        }

        const herramientasValidas = herramientas.filter(h => h.id && h.cantidadPrestada > 0);
        if (herramientasValidas.length === 0) {
            return res.status(400).json({ error: 'Debes seleccionar al menos una herramienta con cantidad mayor a 0.' });
        }

        const prestadorBdId = await obtenerUsuarioIdValido(req);
        if (!prestadorBdId) {
            return res.status(401).json({ error: 'Error de autenticación: No se pudo verificar la identidad del prestador.' });
        }

        const motivoGuardar = motivo ? motivo.trim() : 'NO ESPECIFICADO';
        const motivoOtroGuardar = (motivoGuardar.toLowerCase() === 'otro' && motivoOtro) 
            ? motivoOtro.trim() 
            : null;

        // Arreglo para almacenar alertas pendientes de envío post-transacción
        const alertasAEnviar = [];

        await prisma.$transaction(async (tx) => {
            const detallesParaCrear = [];
            let hayReutilizables = false;
            let hayDesechables = false;

            for (const h of herramientasValidas) {
                const herramientaDB = await tx.herramienta.findUnique({ where: { id: h.id } });
                
                if (!herramientaDB || herramientaDB.cantidadDisponible < h.cantidadPrestada) {
                    throw new Error(`Stock insuficiente para la herramienta "${herramientaDB?.nombre || 'ID: ' + h.id}". Disponible: ${herramientaDB?.cantidadDisponible || 0}`);
                }

                let herramientaActualizada;

                if (herramientaDB.esDesechable) {
                    hayDesechables = true;
                    detallesParaCrear.push({
                        herramientaId: h.id,
                        cantidadPrestada: h.cantidadPrestada,
                        cantidadRegresada: h.cantidadPrestada
                    });

                    // Descontar del inventario disponible y total
                    herramientaActualizada = await tx.herramienta.update({
                        where: { id: h.id },
                        data: { 
                            cantidadDisponible: { decrement: h.cantidadPrestada },
                            cantidad: { decrement: h.cantidadPrestada }
                        }
                    });
                } else {
                    hayReutilizables = true;
                    detallesParaCrear.push({
                        herramientaId: h.id,
                        cantidadPrestada: h.cantidadPrestada,
                        cantidadRegresada: 0
                    });

                    // Solo descontar del inventario disponible mientras está prestada
                    herramientaActualizada = await tx.herramienta.update({
                        where: { id: h.id },
                        data: { cantidadDisponible: { decrement: h.cantidadPrestada } }
                    });
                }

                // Evaluar si cayó en stock mínimo o menor (evaluando la cantidad disponible resultante)
                if (herramientaActualizada.cantidadDisponible <= herramientaActualizada.cantidadMinima) {
                    alertasAEnviar.push({
                        codigo: herramientaActualizada.codigo,
                        nombre: herramientaActualizada.nombre,
                        cantidad: herramientaActualizada.cantidadDisponible,
                        stockMinimo: herramientaActualizada.cantidadMinima
                    });
                }
            }

            const estadoInicial = (!hayReutilizables && hayDesechables) ? 'CONSUMIDO' : 'PENDIENTE';

            await tx.salida.create({
                data: {
                    trabajadorNumero: trabajadorNumero.toString(),
                    trabajadorNombre: trabajadorNombre.trim(),
                    prestadorId: prestadorBdId, 
                    numeroOrden: numeroOrden ? numeroOrden.toString().trim() : null,    
                    numeroMaquina: numeroMaquina ? numeroMaquina.toString().trim() : null,
                    motivo: motivoGuardar,          
                    motivoOtro: motivoOtroGuardar,
                    estado: estadoInicial,
                    detalles: {
                        create: detallesParaCrear
                    }
                }
            });
        });

        // Enviar correos de alerta fuera de la transacción de base de datos
        for (const alerta of alertasAEnviar) {
            try {
                await enviarAlertaHerramientaBaja(alerta);
            } catch (emailErr) {
                console.error(`Error al enviar correo de stock bajo para ${alerta.codigo}:`, emailErr);
            }
        }

        return res.status(201).json({ mensaje: 'Salida registrada con éxito' });
    } catch (error) {
        console.error('Error al crear salida:', error);
        return res.status(400).json({ error: error.message || 'Error al procesar la salida' });
    }
});

// =====================================================================
// 2. GET /api/salidas/pendientes -> Ver salidas activas (Excluye DEVUELTO y CONSUMIDO)
// =====================================================================
router.get('/pendientes', verificarToken, async (req, res) => {
    try {
        const usuario = req.user || req.usuario;
        const rol = usuario?.rol;
        const numTrabajador = usuario?.numTrabajador;

        const filtrosConsulta = {
            estado: {
                notIn: ['DEVUELTO', 'CONSUMIDO']
            }
        };

        if (rol === 'OPERADOR' && numTrabajador) {
            filtrosConsulta.trabajadorNumero = numTrabajador.toString();
        }

        const salidas = await prisma.salida.findMany({
            where: filtrosConsulta,
            include: {
                prestador: true, 
                receptor: true,  
                detalles: {
                    include: { herramienta: true }
                }
            },
            orderBy: { fechaSalida: 'desc' } 
        });

        const respuestaFormateada = salidas.map(salida => ({
            id: salida.id,
            trabajadorNumero: salida.trabajadorNumero,
            trabajadorNombre: salida.trabajadorNombre,
            numeroOrden: salida.numeroOrden,     
            numeroMaquina: salida.numeroMaquina,
            motivo: salida.motivo,             
            motivoOtro: salida.motivoOtro,    
            prestadorNombre: salida.prestador ? salida.prestador.nombre : 'Desconocido',
            receptorNombre: salida.receptor ? salida.receptor.nombre : null,
            fechaSalida: salida.fechaSalida,    
            fechaDevolucion: salida.fechaDevolucion,
            estado: salida.estado,
            herramientas: salida.detalles.map(detalle => ({
                detalleId: detalle.id,
                herramientaId: detalle.herramientaId,
                codigo: detalle.herramienta?.codigo || 'N/A',
                nombre: detalle.herramienta?.nombre || 'Herramienta eliminada',
                cantidadPrestada: detalle.cantidadPrestada,
                cantidadRegresada: detalle.cantidadRegresada,
                esDesechable: detalle.herramienta?.esDesechable || false
            }))
        }));

        return res.json(respuestaFormateada);
    } catch (error) {
        console.error('Error al obtener salidas pendientes:', error);
        return res.status(500).json({ error: 'Error interno del servidor al obtener devoluciones pendientes.' });
    }
});

// =====================================================================
// 3. PUT /api/salidas/:id/devolver -> Devolución (Maneja estado final DEVUELTO o CONSUMIDO)
// =====================================================================
router.put('/:id/devolver', verificarToken, async (req, res) => {
    const salidaId = parseInt(req.params.id, 10);
    if (isNaN(salidaId)) {
        return res.status(400).json({ error: 'ID de salida inválido.' });
    }

    let { herramientasDevueltas } = req.body; 

    try {
        const receptorBdId = await obtenerUsuarioIdValido(req);
        if (!receptorBdId) {
            return res.status(401).json({ error: 'Error de autenticación: No se pudo verificar tu identidad para procesar el retorno.' });
        }

        if (!herramientasDevueltas || !Array.isArray(herramientasDevueltas)) {
            return res.status(400).json({ error: 'Formato inválido. Se espera un arreglo de herramientas devueltas.' });
        }

        herramientasDevueltas = herramientasDevueltas.filter(item => item.detalleId && item.cantidad > 0);

        if (herramientasDevueltas.length === 0) {
            return res.status(400).json({ error: 'Debes registrar al menos una (1) herramienta para procesar la devolución.' });
        }

        await prisma.$transaction(async (tx) => {
            const salida = await tx.salida.findUnique({
                where: { id: salidaId },
                include: { 
                    detalles: {
                        include: { herramienta: true }
                    } 
                }
            });

            if (!salida || salida.estado === 'DEVUELTO' || salida.estado === 'CONSUMIDO') {
                throw new Error('La salida no existe o ya fue cerrada completamente.');
            }

            for (const item of herramientasDevueltas) {
                const detalle = salida.detalles.find(d => d.id === item.detalleId);
                if (!detalle) {
                    throw new Error(`Detalle ID ${item.detalleId} no encontrado en esta salida.`);
                }

                if (detalle.herramienta.esDesechable) {
                    throw new Error(`La herramienta "${detalle.herramienta.nombre}" es desechable y no requiere devolución.`);
                }

                if ((detalle.cantidadRegresada + item.cantidad) > detalle.cantidadPrestada) {
                    throw new Error(`La cantidad total devuelta excede el número de herramientas prestadas originalmente para el detalle ID ${item.detalleId}.`);
                }

                await tx.detalleSalida.update({
                    where: { id: detalle.id },
                    data: { cantidadRegresada: { increment: item.cantidad } }
                });

                await tx.devolucionParcial.create({
                    data: {
                        detalleId: detalle.id,
                        receptorId: receptorBdId, 
                        cantidadDevuelta: item.cantidad
                    }
                });

                await tx.herramienta.update({
                    where: { id: detalle.herramientaId },
                    data: { cantidadDisponible: { increment: item.cantidad } }
                });
            }

            const salidaActualizada = await tx.salida.findUnique({
                where: { id: salidaId },
                include: { 
                    detalles: {
                        include: { herramienta: true }
                    } 
                }
            });

            const todasDevueltas = salidaActualizada.detalles.every(
                d => d.cantidadRegresada >= d.cantidadPrestada
            );

            if (todasDevueltas) {
                const teniaDesechables = salidaActualizada.detalles.some(d => d.herramienta.esDesechable);
                const estadoFinal = teniaDesechables ? 'CONSUMIDO' : 'DEVUELTO';

                await tx.salida.update({
                    where: { id: salidaId },
                    data: { 
                        estado: estadoFinal, 
                        receptorId: receptorBdId, 
                        fechaDevolucion: new Date()
                    }
                });
            }
        });

        return res.json({ mensaje: 'Devolución procesada correctamente' });
    } catch (error) {
        console.error('Error al devolver salida:', error);
        return res.status(400).json({ error: error.message || 'Error al procesar la devolución' });
    }
});

// =====================================================================
// 4. GET /api/salidas/historial -> Traer historial para reportes 
// =====================================================================
router.get('/historial', verificarToken, async (req, res) => {
    try {
        const usuario = req.user || req.usuario;
        const rol = usuario?.rol;
        const numTrabajador = usuario?.numTrabajador;

        let filtrosConsulta = {};

        if (rol === 'OPERADOR' && numTrabajador) {
            filtrosConsulta = {
                trabajadorNumero: numTrabajador.toString() 
            };
        }

        const salidas = await prisma.salida.findMany({
            where: filtrosConsulta,
            include: {
                prestador: true,
                receptor: true,
                detalles: {
                    include: { 
                        herramienta: true,
                        devoluciones: {
                            include: { receptor: true }
                        }
                    }
                }
            },
            orderBy: { fechaSalida: 'desc' } 
        });

        const respuestaFormateada = salidas.map(salida => ({
            id: salida.id,
            trabajadorNumero: salida.trabajadorNumero,
            trabajadorNombre: salida.trabajadorNombre,
            numeroOrden: salida.numeroOrden,     
            numeroMaquina: salida.numeroMaquina, 
            motivo: salida.motivo,             
            motivoOtro: salida.motivoOtro,     
            prestadorNombre: salida.prestador ? salida.prestador.nombre : 'Desconocido',
            receptorNombre: salida.receptor ? salida.receptor.nombre : 'Pendiente / En curso',
            fechaSalida: salida.fechaSalida,    
            fechaDevolucion: salida.fechaDevolucion,
            estado: salida.estado,
            herramientas: salida.detalles.map(detalle => ({
                codigo: detalle.herramienta?.codigo || 'N/A',
                nombre: detalle.herramienta?.nombre || 'Herramienta eliminada',
                cantidadPrestada: detalle.cantidadPrestada,
                cantidadRegresada: detalle.cantidadRegresada,
                esDesechable: detalle.herramienta?.esDesechable || false,
                historialDevoluciones: detalle.devoluciones.map(dev => ({
                    receptorNombre: dev.receptor?.nombre || 'Desconocido',
                    cantidad: dev.cantidadDevuelta,
                    fecha: dev.fechaDevolucion
                }))
            }))
        }));

        return res.json(respuestaFormateada);
    } catch (error) {
        console.error('Error al obtener el historial:', error);
        return res.status(500).json({ error: 'Error al cargar el historial' });
    }
});

// =====================================================================
// 5. POST /api/salidas/solicitar-codigo-dano -> Enviar código al Admin
// =====================================================================
router.post('/solicitar-codigo-dano', verificarToken, async (req, res) => {
    try {
        const { administradorId, folio, herramientaNombre, trabajadorNombre, comentario } = req.body;

        if (!administradorId) {
            return res.status(400).json({ error: 'Debes seleccionar un administrador.' });
        }

        const adminIdParsed = parseInt(administradorId, 10);
        if (isNaN(adminIdParsed)) {
            return res.status(400).json({ error: 'Identificador de administrador inválido.' });
        }

        const admin = await prisma.usuario.findUnique({
            where: { id: adminIdParsed },
            select: { correo: true, nombre: true }
        });

        if (!admin || !admin.correo) {
            return res.status(400).json({ 
                error: 'El administrador seleccionado no tiene un correo registrado en el sistema.' 
            });
        }

        const codigoGenerado = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const hashCodigo = await bcrypt.hash(codigoGenerado, salt);

        await enviarCodigoAutorizacionDano(admin.correo, codigoGenerado, {
            folio: folio || 'N/A',
            trabajador: trabajadorNombre || 'No especificado',
            herramienta: herramientaNombre || 'No especificada',
            comentario: comentario || 'Sin comentario especificado'
        });

        return res.json({
            success: true,
            mensaje: `Código de autorización enviado exitosamente a ${admin.nombre}`,
            hashValidacion: hashCodigo 
        });

    } catch (error) {
        console.error('Error al solicitar código de daño:', error);
        return res.status(500).json({ error: 'Error interno al enviar el código de autorización.' });
    }
});

// =====================================================================
// 6. POST /api/salidas/verificar-codigo-dano -> Validar el PIN ingresado
// =====================================================================
router.post('/verificar-codigo-dano', verificarToken, async (req, res) => {
    try {
        const { administradorId, codigoAdmin, hashValidacion } = req.body;

        if (!administradorId || !codigoAdmin || !hashValidacion) {
            return res.status(400).json({ error: 'Faltan datos para la verificación (administrador, código o hash).' });
        }

        const esValido = await bcrypt.compare(codigoAdmin, hashValidacion);

        if (!esValido) {
            return res.status(400).json({ error: 'El código ingresado es incorrecto. Verifícalo e intenta de nuevo.' });
        }

        return res.status(200).json({ success: true, mensaje: 'Código verificado correctamente.' });

    } catch (error) {
        console.error('Error al verificar código de daño:', error);
        return res.status(500).json({ error: 'Error interno al verificar el código de autorización.' });
    }
});

export default router;