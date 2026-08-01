import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verificarToken } from '../middlewares/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// =====================================================================
// Función auxiliar robusta para obtener la Llave Primaria del usuario
// =====================================================================
const obtenerUsuarioIdValido = async (req) => {
    const tokenData = req.user || req.usuario;
    if (!tokenData) return null;

    try {
        let usuarioReal = null;

        const posibleId = parseInt(tokenData.id || (typeof tokenData !== 'object' ? tokenData : null), 10);
        const posibleNumTrabajador = parseInt(tokenData.numTrabajador, 10);

        // BÚSQUEDA 1: Por número de trabajador explícito
        if (!isNaN(posibleNumTrabajador)) {
            usuarioReal = await prisma.usuario.findFirst({
                where: { numTrabajador: posibleNumTrabajador }
            });
        }

        // BÚSQUEDA 2: Si no funcionó, buscamos por ID o por numTrabajador en el campo 'id'
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

        // Devolvemos el ID de la base de datos real para evitar errores de Foreign Key
        if (usuarioReal) return usuarioReal.id;

        console.error(`Token recibido pero no se encontró usuario con número/id: ${posibleId}`);
        return null; 
    } catch (error) {
        console.error("Error al validar el usuario en la BD:", error);
        return null;
    }
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

        const usuarioBdId = await obtenerUsuarioIdValido(req);
        if (!usuarioBdId) {
            return res.status(401).json({ error: "Error de autenticación. Usuario no encontrado en la BD." });
        }

        const sanitizarTexto = (val) => (val === null || val === undefined) ? '' : String(val).trim();

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
                    tipo: sanitizarTexto(tipo),
                    ubicacion: sanitizarTexto(ubicacion),
                    marca: sanitizarTexto(marca),
                    descripcion: sanitizarTexto(descripcion),
                    imagen: imagen || null,
                    cantidadMinima: cantMinimaNum,
                    cantidadDisponible: stockInicial,
                    cantidad: stockInicial,
                    estado: 'ACTIVA' 
                }
            });

            await tx.historialHerramienta.create({
                data: {
                    accion: 'CREACION',
                    herramientaId: herramienta.id,
                    usuarioId: usuarioBdId,
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

        const usuarioBdId = await obtenerUsuarioIdValido(req);
        if (!usuarioBdId) {
            return res.status(401).json({ error: "Error de autenticación. Usuario no encontrado en la BD." });
        }

        const herramientaId = parseInt(id, 10);

        const herramientaActualizada = await prisma.$transaction(async (tx) => {
            const herramientaVieja = await tx.herramienta.findUnique({ where: { id: herramientaId } });
            if (!herramientaVieja) throw new Error("Herramienta no encontrada.");

            const sanitizarTexto = (val) => (val === null || val === undefined) ? '' : String(val).trim();

            const dataToUpdate = {
                codigo: codigo || herramientaVieja.codigo, 
                nombre: nombre || herramientaVieja.nombre, 
                tipo: sanitizarTexto(tipo), 
                ubicacion: sanitizarTexto(ubicacion),
                marca: sanitizarTexto(marca), 
                descripcion: sanitizarTexto(descripcion)
            };

            if (imagen !== undefined) {
                dataToUpdate.imagen = imagen || null;
            }

            const valorMinimo = cantidadMinima ?? herramientaVieja.cantidadMinima;
            if (valorMinimo !== undefined && valorMinimo !== null && valorMinimo !== '') {
                dataToUpdate.cantidadMinima = parseInt(valorMinimo, 10) || 0;
            }

            const nuevaDispRecibida = parseInt(cantidadDisponible, 10);
            const nuevaCantRecibida = parseInt(cantidad, 10);

            if (cantidadDisponible !== undefined && cantidadDisponible !== null && cantidadDisponible !== '' && !isNaN(nuevaDispRecibida)) {
                if (nuevaDispRecibida !== herramientaVieja.cantidadDisponible) {
                    const diferencia = nuevaDispRecibida - herramientaVieja.cantidadDisponible;
                    dataToUpdate.cantidadDisponible = nuevaDispRecibida;
                    dataToUpdate.cantidad = herramientaVieja.cantidad + diferencia;
                }
            } 
            else if (cantidad !== undefined && cantidad !== null && cantidad !== '' && !isNaN(nuevaCantRecibida)) {
                if (nuevaCantRecibida !== herramientaVieja.cantidad) {
                    const diferencia = nuevaCantRecibida - herramientaVieja.cantidad;
                    dataToUpdate.cantidad = nuevaCantRecibida;
                    dataToUpdate.cantidadDisponible = herramientaVieja.cantidadDisponible + diferencia;
                }
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

            camposAComparar.forEach(campo => {
                if (dataToUpdate[campo.key] !== undefined) {
                    const valorViejo = sanitizarTexto(herramientaVieja[campo.key]);
                    const valorNuevo = sanitizarTexto(dataToUpdate[campo.key]);
                    if (valorViejo !== valorNuevo && valorNuevo !== '') {
                        detallesCambio.push(`${campo.label}: ${valorViejo} ➔ ${valorNuevo}`);
                    }
                }
            });

            let textoHistorial = detallesCambio.length > 0 ? detallesCambio.join(' | ') : 'Actualización de datos generales.';
            if (textoHistorial.length > 220) {
                textoHistorial = textoHistorial.substring(0, 220) + '...';
            }

            const herramienta = await tx.herramienta.update({
                where: { id: herramientaId },
                data: dataToUpdate
            });

            await tx.historialHerramienta.create({
                data: {
                    accion: 'MODIFICACION',
                    herramientaId: herramienta.id,
                    usuarioId: usuarioBdId,
                    detalle: textoHistorial
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
        res.status(500).json({ error: "Error BD: " + (error.message ? error.message.substring(0, 150) : "Fallo desconocido al actualizar.") });
    }
});

// =====================================================================
// 4. DELETE /api/herramientas/:id -> Baja lógica
// =====================================================================
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioBdId = await obtenerUsuarioIdValido(req);
        
        if (!usuarioBdId) {
            return res.status(401).json({ error: "Error de autenticación. Usuario no encontrado en BD." });
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
                    usuarioId: usuarioBdId,
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
    const usuarioBdId = await obtenerUsuarioIdValido(req);

    if (!usuarioBdId) {
        return res.status(401).json({ error: "Error de autenticación. Usuario no encontrado en BD." });
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
                            usuarioId: usuarioBdId,
                            detalle: `Stock Físico (Total): ${cantVieja} ➔ ${cantVieja + cantidadAAgregar} | Disponible: ${dispVieja} ➔ ${dispVieja + cantidadAAgregar}` 
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
                            usuarioId: usuarioBdId,
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