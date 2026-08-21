import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verificarToken } from '../middlewares/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// =====================================================================
// 1. POST /api/salidas -> Crear una nueva Salida (Antes Pedido) 
// =====================================================================
router.post('/', verificarToken, async (req, res) => {
    const { trabajadorNumero, trabajadorNombre, prestadorId, numeroOrden, numeroMaquina, herramientas } = req.body;

    try {
        if (!prestadorId) {
            return res.status(400).json({ error: 'No se especificó el ID del prestador.' });
        }

        await prisma.$transaction(async (tx) => {
            await tx.salida.create({
                data: {
                    trabajadorNumero: trabajadorNumero.toString(),
                    trabajadorNombre,
                    prestadorId: parseInt(prestadorId, 10), 
                    numeroOrden: numeroOrden || null,    
                    numeroMaquina: numeroMaquina || null,
                    detalles: {
                        create: herramientas.map((h) => ({
                            herramientaId: h.id,
                            cantidadPrestada: h.cantidadPrestada,
                            cantidadRegresada: 0 
                        }))
                    }
                }
            });

            for (const h of herramientas) {
                const herramientaDB = await tx.herramienta.findUnique({ where: { id: h.id } });
                
                if (!herramientaDB || herramientaDB.cantidadDisponible < h.cantidadPrestada) {
                    throw new Error(`Stock insuficiente para la herramienta: ${h.id}`);
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
    let { herramientasDevueltas, receptorId } = req.body; 

    try {
        if (!receptorId) {
            return res.status(400).json({ error: 'No se especificó el ID del receptor de la devolución.' });
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
                throw new Error('La salida no existe o ya fue cerrada');
            }

            for (const item of herramientasDevueltas) {
                const detalle = salida.detalles.find(d => d.id === item.detalleId);
                if (!detalle) throw new Error(`Detalle ID ${item.detalleId} no encontrado en esta salida`);

                if ((detalle.cantidadRegresada + item.cantidad) > detalle.cantidadPrestada) {
                    throw new Error(`La cantidad total devuelta excede lo prestado.`);
                }

                await tx.detalleSalida.update({
                    where: { id: detalle.id },
                    data: { cantidadRegresada: { increment: item.cantidad } }
                });

                await tx.devolucionParcial.create({
                    data: {
                        detalleId: detalle.id,
                        receptorId: parseInt(receptorId, 10),
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
                    receptorId: parseInt(receptorId, 10),
                    fechaDevolucion: new Date() 
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

        // CAMBIO: prisma.pedido.findMany -> prisma.salida.findMany
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