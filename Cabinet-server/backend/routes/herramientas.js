import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// =====================================================================
// 1. GET /api/herramientas -> Obtener todas las herramientas activas
// =====================================================================
router.get('/', async (req, res) => {
    try {
        const herramientas = await prisma.herramienta.findMany({
            where: { estado: { not: 'DADA_DE_BAJA' } },
            orderBy: { id: 'asc' }
        });
        res.json(herramientas);
    } catch (error) {
        console.error("Error al obtener herramientas:", error);
        res.status(500).json({ error: "Error interno del servidor al obtener herramientas." });
    }
});

// =====================================================================
// 1.5 GET /api/herramientas/bitacora -> Historial de creación/edición/baja
// =====================================================================
router.get('/bitacora', async (req, res) => {
    try {
        const historial = await prisma.historialHerramienta.findMany({
            include: {
                herramienta: true, // Trae los datos de la herramienta
                usuario: true      // Trae los datos del usuario que hizo la acción
            },
            orderBy: { fecha: 'desc' } // Ordenado del más reciente al más antiguo
        });
        res.json(historial);
    } catch (error) {
        console.error("Error al obtener bitácora de herramientas:", error);
        res.status(500).json({ error: "Error al obtener el historial de movimientos." });
    }
});

// =====================================================================
// 2. POST /api/herramientas -> Crear una nueva herramienta
// =====================================================================
router.post('/', async (req, res) => {
    try {
        const { 
            codigo, 
            nombre, 
            tipo, 
            ubicacion, 
            marca, 
            descripcion, 
            cantidadMinima, 
            cantidadDisponible, 
            cantidad,
            imagen,
            usuarioId // ID del usuario que crea (para la bitácora)
        } = req.body;

        const cantDisponibleNum = parseInt(cantidadDisponible, 10) || 0;
        const cantTotalNum = parseInt(cantidad, 10) || cantDisponibleNum;
        const cantMinimaNum = parseInt(cantidadMinima, 10) || 0;

        // Ejecutamos la creación y el historial en una misma transacción
        const nuevaHerramienta = await prisma.$transaction(async (tx) => {
            const herramienta = await tx.herramienta.create({
                data: {
                    codigo,
                    nombre,
                    tipo: tipo || null,
                    ubicacion: ubicacion || null,
                    marca: marca || null,
                    descripcion: descripcion || null,
                    imagen: imagen || null,
                    cantidadMinima: cantMinimaNum,
                    cantidadDisponible: cantDisponibleNum,
                    cantidad: cantTotalNum
                }
            });

            // Si se envió el usuario que realizó la acción, registramos en la bitácora
            if (usuarioId) {
                await tx.historialHerramienta.create({
                    data: {
                        accion: 'CREACION',
                        herramientaId: herramienta.id,
                        usuarioId: parseInt(usuarioId, 10)
                    }
                });
            }

            return herramienta;
        });

        res.status(201).json(nuevaHerramienta);
    } catch (error) {
        // VALIDACIÓN DE CÓDIGO DUPLICADO
        if (error.code === 'P2002' && error.meta?.target?.includes('codigo')) {
            return res.status(400).json({ error: "El código ingresado ya existe. Por favor, utiliza un código diferente." });
        }

        console.error("Error al crear herramienta:", error);
        res.status(500).json({ error: "Error al guardar la herramienta en la base de datos." });
    }
});

// =====================================================================
// 3. PUT /api/herramientas/:id -> Actualizar una herramienta existente
// =====================================================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            codigo, 
            nombre, 
            tipo, 
            ubicacion, 
            marca, 
            descripcion, 
            cantidadMinima, 
            cantidadDisponible, 
            cantidad,
            imagen,
            usuarioId // ID del usuario que edita (para la bitácora)
        } = req.body;

        const herramientaId = parseInt(id, 10);
        const cantDisponibleNum = parseInt(cantidadDisponible, 10) || 0;
        const cantMinimaNum = parseInt(cantidadMinima, 10) || 0;

        const herramientaActualizada = await prisma.$transaction(async (tx) => {
            // Preparamos objeto de datos a actualizar
            const dataToUpdate = {
                codigo,
                nombre,
                tipo: tipo || null,
                ubicacion: ubicacion || null,
                marca: marca || null,
                descripcion: descripcion || null,
                imagen: imagen || null,
                cantidadMinima: cantMinimaNum,
                cantidadDisponible: cantDisponibleNum
            };

            // Si también se especifica la cantidad total, la actualizamos
            if (cantidad !== undefined) {
                dataToUpdate.cantidad = parseInt(cantidad, 10) || 0;
            }

            const herramienta = await tx.herramienta.update({
                where: { id: herramientaId },
                data: dataToUpdate
            });

            // Registrar en la bitácora si se proporciona el usuario
            if (usuarioId) {
                await tx.historialHerramienta.create({
                    data: {
                        accion: 'MODIFICACION',
                        herramientaId: herramienta.id,
                        usuarioId: parseInt(usuarioId, 10)
                    }
                });
            }

            return herramienta;
        });

        res.json(herramientaActualizada);
    } catch (error) {
        // VALIDACIÓN DE CÓDIGO DUPLICADO EN EDICIÓN
        if (error.code === 'P2002' && error.meta?.target?.includes('codigo')) {
            return res.status(400).json({ error: "El código ingresado ya pertenece a otra herramienta." });
        }

        console.error("Error al actualizar herramienta:", error);
        res.status(500).json({ error: "Error al actualizar la herramienta." });
    }
});

// =====================================================================
// 4. DELETE /api/herramientas/:id -> Soft Delete (Baja lógica)
// =====================================================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // SOLUCIÓN: Buscamos el usuarioId en el query o en el body
        const usuarioId = req.query.usuarioId || req.body.usuarioId; 
        const herramientaId = parseInt(id, 10);

        await prisma.$transaction(async (tx) => {
            await tx.herramienta.update({
                where: { id: herramientaId },
                data: { estado: 'DADA_DE_BAJA' }
            });

            if (usuarioId) {
                await tx.historialHerramienta.create({
                    data: {
                        accion: 'ELIMINACION',
                        herramientaId: herramientaId,
                        usuarioId: parseInt(usuarioId, 10)
                    }
                });
            }
        });

        res.json({ message: "Herramienta dada de baja exitosamente." });
    } catch (error) {
        console.error("Error al dar de baja la herramienta:", error);
        res.status(500).json({ error: "Error al eliminar la herramienta." });
    }
});

// =====================================================================
// 5. POST /api/herramientas/importar -> Importación Masiva desde CSV/Excel
// =====================================================================
router.post('/importar', async (req, res) => {
    const { herramientas, usuarioId } = req.body;

    if (!herramientas || !Array.isArray(herramientas) || herramientas.length === 0) {
        return res.status(400).json({ error: 'No se enviaron datos válidos para importar.' });
    }

    let creados = 0;
    let actualizados = 0;

    try {
        // Usamos una transacción para asegurar la integridad de la base de datos
        await prisma.$transaction(async (tx) => {
            for (const item of herramientas) {
                const cantidadAAgregar = parseInt(item.cantidad, 10) || 0;
                
                // Ignorar filas con cantidad 0 o inválida para evitar registros vacíos
                if (cantidadAAgregar <= 0) continue;

                // 1. Buscamos si la herramienta ya existe por su código
                const herramientaExistente = await tx.herramienta.findUnique({
                    where: { codigo: item.codigo }
                });

                if (herramientaExistente) {
                    // SI EXISTE: Le sumamos el stock nuevo
                    await tx.herramienta.update({
                        where: { codigo: item.codigo },
                        data: {
                            cantidad: { increment: cantidadAAgregar },
                            cantidadDisponible: { increment: cantidadAAgregar }
                        }
                    });
                    
                    // Registrar en HistorialHerramienta que se actualizó el stock
                    if (usuarioId) {
                        await tx.historialHerramienta.create({
                            data: {
                                accion: 'MODIFICACION',
                                herramientaId: herramientaExistente.id,
                                usuarioId: parseInt(usuarioId, 10)
                            }
                        });
                    }
                    actualizados++;
                } else {
                    // SI NO EXISTE: La creamos desde cero
                    const cantidadMinima = parseInt(item.cantidadMinima, 10) || 0;
                    
                    const nuevaHerramienta = await tx.herramienta.create({
                        data: {
                            codigo: item.codigo,
                            nombre: item.nombre,
                            descripcion: item.descripcion || '',
                            marca: item.marca || '',
                            cantidad: cantidadAAgregar,
                            cantidadDisponible: cantidadAAgregar,
                            cantidadMinima: cantidadMinima,
                            tipo: item.tipo || null,
                            ubicacion: item.ubicacion || null,
                            estado: 'ACTIVA'
                        }
                    });

                    // Registrar en HistorialHerramienta la creación
                    if (usuarioId) {
                        await tx.historialHerramienta.create({
                            data: {
                                accion: 'CREACION',
                                herramientaId: nuevaHerramienta.id,
                                usuarioId: parseInt(usuarioId, 10)
                            }
                        });
                    }
                    creados++;
                }
            }
        });

        res.status(200).json({ 
            mensaje: 'Importación finalizada con éxito.',
            creados,
            actualizados
        });

    } catch (error) {
        console.error('Error en importación masiva:', error);
        res.status(500).json({ error: 'Ocurrió un error al procesar el archivo. Revisa el formato de los datos.' });
    }
});

export default router;