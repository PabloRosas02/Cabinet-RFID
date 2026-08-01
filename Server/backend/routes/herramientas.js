import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verificarToken } from '../middlewares/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Función auxiliar robusta para extraer el ID desde req.user
const obtenerUsuarioId = (req) => {
    const payload = req.user || req.usuario;
    if (!payload) return null;
    
    // Si el payload es un objeto, intentamos extraer su ID principal
    if (typeof payload === 'object') {
        return payload.id || payload.userId || payload.numTrabajador;
    }
    return payload; // Si es un string/número directo
};

// =====================================================================
// 1. GET /api/herramientas -> Obtener herramientas 
// =====================================================================
router.get('/', verificarToken, async (req, res) => {
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
// 1.5 GET /api/herramientas/bitacora -> Historial 
// =====================================================================
router.get('/bitacora', verificarToken, async (req, res) => {
    try {
        const historial = await prisma.historialHerramienta.findMany({
            include: {
                herramienta: true, 
                usuario: true      
            },
            orderBy: { fecha: 'desc' } 
        });
        res.json(historial);
    } catch (error) {
        console.error("Error al obtener bitácora de herramientas:", error);
        res.status(500).json({ error: "Error al obtener el historial de movimientos." });
    }
});

// =====================================================================
// 2. POST /api/herramientas -> Crear herramienta
// =====================================================================
router.post('/', verificarToken, async (req, res) => {
    try {
        const { 
            codigo, nombre, tipo, ubicacion, marca, 
            descripcion, cantidadMinima, cantidadDisponible, cantidad, imagen
        } = req.body;

        const usuarioId = obtenerUsuarioId(req);
        if (!usuarioId) {
            return res.status(401).json({ error: "Error de autenticación. No se detectó el ID del usuario." });
        }
        
        const parsedUsuarioId = parseInt(usuarioId, 10);
        if (isNaN(parsedUsuarioId)) {
            return res.status(400).json({ error: "El token de usuario es inválido." });
        }

        const cantMinimaNum = parseInt(cantidadMinima, 10) || 0;

        let cantDisp = parseInt(cantidadDisponible, 10);
        let cantTot = parseInt(cantidad, 10);
        
        if (isNaN(cantDisp)) cantDisp = 0;
        if (isNaN(cantTot)) cantTot = 0;
        
        const stockInicial = (cantidadDisponible !== undefined) ? cantDisp : cantTot;

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
                    cantidadDisponible: stockInicial,
                    cantidad: stockInicial,
                    actualizadoEn: new Date() 
                }
            });

            await tx.historialHerramienta.create({
                data: {
                    accion: 'CREACION',
                    herramientaId: herramienta.id,
                    usuarioId: parsedUsuarioId,
                    detalle: `Registro inicial de la herramienta. Stock inicial: ${stockInicial}`
                }
            });

            return herramienta;
        });

        res.status(201).json(nuevaHerramienta);
    } catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('codigo')) {
            return res.status(400).json({ error: "El código ingresado ya existe. Por favor, utiliza un código diferente." });
        }
        if (error.code === 'P2000') {
            return res.status(400).json({ error: "La imagen es demasiado grande para la base de datos." });
        }
        console.error("Error al crear herramienta:", error);
        res.status(500).json({ error: "Error al guardar la herramienta en la base de datos." });
    }
});

// =====================================================================
// 3. PUT /api/herramientas/:id -> Actualizar herramienta y rastrear cambios
// =====================================================================
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            codigo, nombre, tipo, ubicacion, marca, 
            descripcion, cantidadMinima, cantidad, cantidadDisponible, imagen 
        } = req.body;

        const usuarioId = obtenerUsuarioId(req);
        if (!usuarioId) {
            return res.status(401).json({ error: "Error de autenticación. No se detectó el ID del usuario." });
        }
        
        const parsedUsuarioId = parseInt(usuarioId, 10);
        if (isNaN(parsedUsuarioId)) {
            return res.status(400).json({ error: "El token de usuario es inválido." });
        }

        const herramientaId = parseInt(id, 10);

        const herramientaActualizada = await prisma.$transaction(async (tx) => {
            const herramientaVieja = await tx.herramienta.findUnique({ where: { id: herramientaId } });
            if (!herramientaVieja) throw new Error("Herramienta no encontrada.");

            const dataToUpdate = {
                codigo, nombre, 
                tipo: tipo || null, 
                ubicacion: ubicacion || null,
                marca: marca || null, 
                descripcion: descripcion || null,
                cantidadMinima: cantidadMinima !== undefined ? parseInt(cantidadMinima, 10) : herramientaVieja.cantidadMinima
            };

            if (imagen !== undefined) {
                dataToUpdate.imagen = imagen || null;
            }

            const nuevaDispRecibida = parseInt(cantidadDisponible, 10);
            const nuevaCantRecibida = parseInt(cantidad, 10);

            if (cantidadDisponible !== undefined && !isNaN(nuevaDispRecibida) && nuevaDispRecibida !== herramientaVieja.cantidadDisponible) {
                const diferencia = nuevaDispRecibida - herramientaVieja.cantidadDisponible;
                dataToUpdate.cantidadDisponible = nuevaDispRecibida;
                dataToUpdate.cantidad = herramientaVieja.cantidad + diferencia;
            } 
            else if (cantidad !== undefined && !isNaN(nuevaCantRecibida) && nuevaCantRecibida !== herramientaVieja.cantidad) {
                const diferencia = nuevaCantRecibida - herramientaVieja.cantidad;
                dataToUpdate.cantidad = nuevaCantRecibida;
                dataToUpdate.cantidadDisponible = herramientaVieja.cantidadDisponible + diferencia;
            }

            let detallesCambio = [];
            const camposAComparar = [
                { key: 'codigo', label: 'Código' },
                { key: 'nombre', label: 'Nombre' },
                { key: 'tipo', label: 'Tipo / Categoría' },
                { key: 'ubicacion', label: 'Ubicación' },
                { key: 'marca', label: 'Marca' },
                { key: 'cantidadMinima', label: 'Stock Mínimo' },
                { key: 'cantidadDisponible', label: 'Stock Físico' } 
            ];

            const normalizar = (val) => (val === null || val === undefined || val === '') ? 'N/A' : String(val).trim();

            camposAComparar.forEach(campo => {
                if (dataToUpdate[campo.key] !== undefined) {
                    const valorViejo = normalizar(herramientaVieja[campo.key]);
                    const valorNuevo = normalizar(dataToUpdate[campo.key]);
                    if (valorViejo !== valorNuevo) {
                        detallesCambio.push(`${campo.label}: ${valorViejo} ➔ ${valorNuevo}`);
                    }
                }
            });

            const herramienta = await tx.herramienta.update({
                where: { id: herramientaId },
                data: dataToUpdate
            });

            await tx.historialHerramienta.create({
                data: {
                    accion: 'MODIFICACION',
                    herramientaId: herramienta.id,
                    usuarioId: parsedUsuarioId,
                    detalle: detallesCambio.length > 0 ? detallesCambio.join('\n') : 'Actualización de datos generales.' 
                }
            });

            return herramienta;
        });

        res.json(herramientaActualizada);
    } catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('codigo')) {
            return res.status(400).json({ error: "El código ingresado ya pertenece a otra herramienta." });
        }
        console.error("Error al actualizar herramienta:", error);
        res.status(500).json({ error: "Error interno al actualizar la herramienta." });
    }
});

// =====================================================================
// 4. DELETE /api/herramientas/:id -> Baja lógica
// =====================================================================
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = obtenerUsuarioId(req);
        
        if (!usuarioId) {
            return res.status(401).json({ error: "Error de autenticación." });
        }
        
        const parsedUsuarioId = parseInt(usuarioId, 10);
        if (isNaN(parsedUsuarioId)) {
            return res.status(400).json({ error: "El token de usuario es inválido." });
        }

        const herramientaId = parseInt(id, 10);

        await prisma.$transaction(async (tx) => {
            await tx.herramienta.update({
                where: { id: herramientaId },
                data: { estado: 'DADA_DE_BAJA' }
            });

            await tx.historialHerramienta.create({
                data: {
                    accion: 'ELIMINACION',
                    herramientaId: herramientaId,
                    usuarioId: parsedUsuarioId,
                    detalle: 'Baja lógica del inventario.' 
                }
            });
        });

        res.json({ message: "Herramienta dada de baja exitosamente." });
    } catch (error) {
        console.error("Error al dar de baja la herramienta:", error);
        res.status(500).json({ error: "Error al eliminar la herramienta." });
    }
});

// =====================================================================
// 5. POST /api/herramientas/importar -> Importación Masiva
// =====================================================================
router.post('/importar', verificarToken, async (req, res) => {
    const { herramientas } = req.body;
    const usuarioId = obtenerUsuarioId(req);

    if (!usuarioId) {
        return res.status(401).json({ error: "Error de autenticación." });
    }
    
    const parsedUsuarioId = parseInt(usuarioId, 10);
    if (isNaN(parsedUsuarioId)) {
        return res.status(400).json({ error: "El token de usuario es inválido." });
    }

    if (!herramientas || !Array.isArray(herramientas) || herramientas.length === 0) {
        return res.status(400).json({ error: 'No se enviaron datos válidos para importar.' });
    }

    let creados = 0;
    let actualizados = 0;

    try {
        await prisma.$transaction(async (tx) => {
            for (const item of herramientas) {
                const cantidadAAgregar = parseInt(item.cantidad, 10) || 0;
                
                if (cantidadAAgregar <= 0) continue;

                const herramientaExistente = await tx.herramienta.findUnique({
                    where: { codigo: item.codigo }
                });

                if (herramientaExistente) {
                    const cantVieja = herramientaExistente.cantidad;
                    const dispVieja = herramientaExistente.cantidadDisponible;

                    await tx.herramienta.update({
                        where: { codigo: item.codigo },
                        data: {
                            cantidad: { increment: cantidadAAgregar },
                            cantidadDisponible: { increment: cantidadAAgregar }
                        }
                    });
                    
                    await tx.historialHerramienta.create({
                        data: {
                            accion: 'MODIFICACION',
                            herramientaId: herramientaExistente.id,
                            usuarioId: parsedUsuarioId,
                            detalle: `Stock Físico (Total): ${cantVieja} ➔ ${cantVieja + cantidadAAgregar}\nStock Disponible: ${dispVieja} ➔ ${dispVieja + cantidadAAgregar}` 
                        }
                    });
                    
                    actualizados++;
                } else {
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

                    await tx.historialHerramienta.create({
                        data: {
                            accion: 'CREACION',
                            herramientaId: nuevaHerramienta.id,
                            usuarioId: parsedUsuarioId,
                            detalle: `Registro mediante Importación Masiva. Stock Físico inicial: ${cantidadAAgregar}` 
                        }
                    });
                    
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