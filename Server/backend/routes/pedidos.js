import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verificarToken } from '../middlewares/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// =====================================================================
// 1. POST /api/pedidos -> Crear un nuevo pedido (Préstamo) 
// =====================================================================
router.post('/', verificarToken, async (req, res) => {
    const { trabajadorNumero, trabajadorNombre, prestadorId, herramientas } = req.body;

    try {
        if (!prestadorId) {
            return res.status(400).json({ error: 'No se especificó el ID del prestador.' });
        }

        await prisma.$transaction(async (tx) => {
            await tx.pedido.create({
                data: {
                    trabajadorNumero: trabajadorNumero.toString(),
                    trabajadorNombre,
                    prestadorId: parseInt(prestadorId, 10), 
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

        res.status(201).json({ mensaje: 'Pedido registrado con éxito' });
    } catch (error) {
        console.error('Error al crear pedido:', error);
        res.status(400).json({ error: error.message || 'Error al procesar el pedido' });
    }
});

// =====================================================================
// 2. GET /api/pedidos/pendientes (BLINDADO CONTRA ERROR 500)
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

        // Si es OPERADOR, por seguridad, solo ve sus propios préstamos pendientes.
        if (rol === 'OPERADOR' && numTrabajador) {
            filtrosConsulta.trabajadorNumero = numTrabajador.toString();
        }

        const pedidos = await prisma.pedido.findMany({
            where: filtrosConsulta,
            include: {
                prestador: true, 
                receptor: true,  
                detalles: {
                    include: { herramienta: true }
                }
            },
            orderBy: { fechaPedido: 'desc' }
        });

        const respuestaFormateada = pedidos.map(pedido => ({
            id: pedido.id,
            trabajadorNumero: pedido.trabajadorNumero,
            trabajadorNombre: pedido.trabajadorNombre,
            prestadorNombre: pedido.prestador ? pedido.prestador.nombre : 'Desconocido',
            receptorNombre: pedido.receptor ? pedido.receptor.nombre : null,
            fechaPedido: pedido.fechaPedido,
            fechaDevolucion: pedido.fechaDevolucion,
            estado: pedido.estado,
            herramientas: pedido.detalles.map(detalle => ({
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
        console.error('Error al obtener pedidos pendientes:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener devoluciones pendientes.' });
    }
});

// =====================================================================
// 3. PUT /api/pedidos/:id/devolver -> Procesar Devolución 
// =====================================================================
router.put('/:id/devolver', verificarToken, async (req, res) => {
    const pedidoId = parseInt(req.params.id);
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
            const pedido = await tx.pedido.findUnique({
                where: { id: pedidoId },
                include: { detalles: true }
            });

            if (!pedido || pedido.estado === 'DEVUELTO') {
                throw new Error('El pedido no existe o ya fue cerrado');
            }

            for (const item of herramientasDevueltas) {
                const detalle = pedido.detalles.find(d => d.id === item.detalleId);
                if (!detalle) throw new Error(`Detalle ID ${item.detalleId} no encontrado en este pedido`);

                if ((detalle.cantidadRegresada + item.cantidad) > detalle.cantidadPrestada) {
                    throw new Error(`La cantidad total devuelta excede lo prestado.`);
                }

                await tx.detallePedido.update({
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

            const pedidoActualizado = await tx.pedido.findUnique({
                where: { id: pedidoId },
                include: { detalles: true }
            });

            const todasDevueltas = pedidoActualizado.detalles.every(
                d => d.cantidadRegresada >= d.cantidadPrestada
            );

            await tx.pedido.update({
                where: { id: pedidoId },
                data: { 
                    estado: todasDevueltas ? 'DEVUELTO' : pedido.estado, 
                    receptorId: parseInt(receptorId, 10),
                    fechaDevolucion: new Date() 
                }
            });
        });

        res.json({ mensaje: 'Devolución procesada correctamente' });
    } catch (error) {
        console.error('Error al devolver pedido:', error);
        res.status(400).json({ error: error.message || 'Error al procesar la devolución' });
    }
});

// =====================================================================
// 4. GET /api/pedidos/historial -> Traer historial para reportes 
// =====================================================================
router.get('/historial', verificarToken, async (req, res) => {
    try {
        const usuario = req.user || req.usuario;
        const rol = usuario?.rol;
        const numTrabajador = usuario?.numTrabajador;

        let filtrosConsulta = {};

        // Los operadores solo ven los pedidos que ellos mismos solicitaron.
        if (rol === 'OPERADOR' && numTrabajador) {
            filtrosConsulta = {
                trabajadorNumero: numTrabajador.toString() 
            };
        }

        const pedidos = await prisma.pedido.findMany({
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
            orderBy: { fechaPedido: 'desc' }
        });

        const respuestaFormateada = pedidos.map(pedido => ({
            id: pedido.id,
            trabajadorNumero: pedido.trabajadorNumero,
            trabajadorNombre: pedido.trabajadorNombre,
            prestadorNombre: pedido.prestador ? pedido.prestador.nombre : 'Desconocido',
            receptorNombre: pedido.receptor ? pedido.receptor.nombre : 'Pendiente / En curso',
            fechaPedido: pedido.fechaPedido,
            fechaDevolucion: pedido.fechaDevolucion,
            estado: pedido.estado,
            herramientas: pedido.detalles.map(detalle => ({
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