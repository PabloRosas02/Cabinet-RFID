import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verificarToken } from '../middlewares/auth.js';

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
        if (usuarioReal) return usuarioReal.id;
        return null; 
    } catch (error) {
        console.error("Error al validar el usuario en la BD:", error);
        return null;
    }
};

// =====================================================================
// 1. POST /api/salidas -> Crear una nueva Salida (Antes Pedido) 
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
        const prestadorBdId = await obtenerUsuarioIdValido(req);
        if (!prestadorBdId) {
            return res.status(401).json({ error: 'Error de autenticación: No se pudo verificar la identidad del prestador.' });
        }

        if (!herramientas || !Array.isArray(herramientas) || herramientas.length === 0) {
            return res.status(400).json({ error: 'Debes incluir al menos una herramienta en la salida.' });
        }

        // Sanitización básica para el motivo
        const motivoGuardar = motivo ? motivo.trim() : 'NO ESPECIFICADO';
        // Si el motivo es "otro" (ignorando mayúsculas), guardamos el texto libre, de lo contrario null
        const motivoOtroGuardar = (motivoGuardar.toLowerCase() === 'otro' && motivoOtro) 
            ? motivoOtro.trim() 
            : null;

        await prisma.$transaction(async (tx) => {
            const salida = await tx.salida.create({
                data: {
                    trabajadorNumero: trabajadorNumero.toString(),
                    trabajadorNombre,
                    prestadorId: prestadorBdId, 
                    numeroOrden: numeroOrden || null,    
                    numeroMaquina: numeroMaquina || null,
                    motivo: motivoGuardar,          
                    motivoOtro: motivoOtroGuardar,   
                    detalles: {
                        create: herramientas
                            .filter(h => h.cantidadPrestada > 0) 
                            .map((h) => ({
                                herramientaId: h.id,
                                cantidadPrestada: h.cantidadPrestada,
                                cantidadRegresada: 0 
                            }))
                    }
                }
            });

            for (const h of herramientas) {
                if (h.cantidadPrestada <= 0) continue;

                const herramientaDB = await tx.herramienta.findUnique({ where: { id: h.id } });
                
                if (!herramientaDB || herramientaDB.cantidadDisponible < h.cantidadPrestada) {
                    throw new Error(`Stock insuficiente para la herramienta con código ID: ${h.id}. Disponible: ${herramientaDB?.cantidadDisponible || 0}`);
                }

                await tx.herramienta.update({
                    where: { id: h.id },
                    data: { cantidadDisponible: { decrement: h.cantidadPrestada } }
                });
            }
        });

        res.status(201).json({ mensaje: 'Salida registrada con éxito' });
    } catch (error) {
        console.error('Error al crear salida:', error);
        res.status(400).json({ error: error.message || 'Error al procesar la salida' });
    }
});

// =====================================================================
// 2. GET /api/salidas/pendientes
// =====================================================================
router.get('/pendientes', verificarToken, async (req, res) => {
    try {
        const usuario = req.user || req.usuario;
        const rol = usuario?.rol;
        const numTrabajador = usuario?.numTrabajador;

        let filtrosConsulta = {
            estado: {
                not: 'DEVUELTO'
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
                nombre: detalle.herramienta?.nombre || 'Herramienta no disponible / Eliminada',
                cantidadPrestada: detalle.cantidadPrestada,
                cantidadRegresada: detalle.cantidadRegresada
            }))
        }));

        res.json(respuestaFormateada);
    } catch (error) {
        console.error('Error al obtener salidas pendientes:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener devoluciones pendientes.' });
    }
});

// =====================================================================
// 3. PUT /api/salidas/:id/devolver -> Procesar Devolución 
// =====================================================================
router.put('/:id/devolver', verificarToken, async (req, res) => {
    const salidaId = parseInt(req.params.id);
    let { herramientasDevueltas } = req.body; 

    try {
        const receptorBdId = await obtenerUsuarioIdValido(req);
        if (!receptorBdId) {
            return res.status(401).json({ error: 'Error de autenticación: No se pudo verificar tu identidad para procesar el retorno.' });
        }

        herramientasDevueltas = herramientasDevueltas.filter(item => item.cantidad > 0);

        if (herramientasDevueltas.length === 0) {
            return res.status(400).json({ error: 'Debes registrar al menos una (1) herramienta para procesar la devolución.' });
        }

        await prisma.$transaction(async (tx) => {
            const salida = await tx.salida.findUnique({
                where: { id: salidaId },
                include: { detalles: true }
            });

            if (!salida || salida.estado === 'DEVUELTO') {
                throw new Error('La salida no existe o ya fue cerrada previamente.');
            }

            for (const item of herramientasDevueltas) {
                const detalle = salida.detalles.find(d => d.id === item.detalleId);
                if (!detalle) throw new Error(`Detalle ID ${item.detalleId} no encontrado en esta salida`);

                if ((detalle.cantidadRegresada + item.cantidad) > detalle.cantidadPrestada) {
                    throw new Error(`La cantidad total devuelta excede el número de herramientas que se prestaron originalmente.`);
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
                include: { detalles: true }
            });

            const todasDevueltas = salidaActualizada.detalles.every(
                d => d.cantidadRegresada >= d.cantidadPrestada
            );

            await tx.salida.update({
                where: { id: salidaId },
                data: { 
                    estado: todasDevueltas ? 'DEVUELTO' : salida.estado, 
                    receptorId: receptorBdId, 
                    ...(todasDevueltas ? { fechaDevolucion: new Date() } : {}) 
                }
            });
        });

        res.json({ mensaje: 'Devolución procesada correctamente' });
    } catch (error) {
        console.error('Error al devolver salida:', error);
        res.status(400).json({ error: error.message || 'Error al procesar la devolución' });
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
                historialDevoluciones: detalle.devoluciones.map(dev => ({
                    receptorNombre: dev.receptor?.nombre || 'Desconocido',
                    cantidad: dev.cantidadDevuelta,
                    fecha: dev.fechaDevolucion
                }))
            }))
        }));

        res.json(respuestaFormateada);
    } catch (error) {
        console.error('Error al obtener el historial:', error);
        res.status(500).json({ error: 'Error al cargar el historial' });
    }
});

export default router;