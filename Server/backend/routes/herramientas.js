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
// 1. GET /api/herramientas -> Obtener herramientas (CON PAGINACIÓN, BÚSQUEDA Y ORDENAMIENTO)
// =====================================================================
router.get('/', verificarToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        const sortField = req.query.sortField || 'id';
        const sortOrder = req.query.sortOrder === 'DESC' ? 'desc' : 'asc';

        const skip = (page - 1) * limit;

        let filtrosConsulta = { estado: { not: 'DADA_DE_BAJA' } };

        if (search && search.trim() !== '') {
            const searchClean = search.trim();

            filtrosConsulta.OR = [
                { codigo: { contains: searchClean, mode: 'insensitive' } },
                { nombre: { contains: searchClean, mode: 'insensitive' } },
                { marca: { contains: searchClean, mode: 'insensitive' } },
                { ubicacion: { contains: searchClean, mode: 'insensitive' } },
                { tipo: { contains: searchClean, mode: 'insensitive' } }
            ];
        }

        // Construir objeto de orden dinámico para Prisma
        const orderBy = {};
        orderBy[sortField] = sortOrder;

        const [total, herramientas] = await prisma.$transaction([
            prisma.herramienta.count({ where: filtrosConsulta }),
            prisma.herramienta.findMany({
                where: filtrosConsulta,
                skip,
                take: limit,
                orderBy: orderBy 
            })
        ]);

        res.json({ 
            data: herramientas, 
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) } 
        });
    } catch (error) {
        console.error("Error al obtener herramientas:", error);
        res.status(500).json({ error: "Error interno del servidor al obtener herramientas." });
    }
});

// =====================================================================
// 1.5 GET /api/herramientas/bitacora -> Historial (CON PAGINACIÓN Y FILTROS)
// =====================================================================
router.get('/bitacora', verificarToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        // 1. Normalizar parámetros recibidos desde el Frontend (soporta 'busqueda' o 'search')
        const search = req.query.busqueda || req.query.search || '';
        const accion = req.query.accion;
        const tiempo = req.query.tiempo;
        const skip = (page - 1) * limit;

        let dondeCondiciones = [];

        // 2. Filtro de búsqueda por texto 
        if (search) {
            // Normalizamos el texto ingresado
            const searchTrimmed = search.trim();

            dondeCondiciones.push({
                OR: [
                    { herramienta: { nombre: { contains: searchTrimmed } } },
                    { herramienta: { codigo: { contains: searchTrimmed } } },
                    { usuario: { nombre: { contains: searchTrimmed } } },
                    { detalle: { contains: searchTrimmed } }
                ]
            });
        }

        // 3. Filtro por tipo de acción (CREACION, MODIFICACION, ELIMINACION)
        if (accion && accion !== 'Todas') {
            dondeCondiciones.push({ accion: accion });
        }

        // 4. Filtro por rango de tiempo
        if (tiempo && tiempo !== 'Todos') {
            const ahora = new Date();
            let fechaInicio;

            if (tiempo === 'Hoy') {
                fechaInicio = new Date(ahora.setHours(0, 0, 0, 0));
            } else if (tiempo === 'Esta Semana') {
                const diaSemana = ahora.getDay();
                fechaInicio = new Date(ahora.setDate(ahora.getDate() - diaSemana));
                fechaInicio.setHours(0, 0, 0, 0);
            } else if (tiempo === 'Este Mes') {
                fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
            } else if (tiempo === 'Este Año') {
                fechaInicio = new Date(ahora.getFullYear(), 0, 1);
            }

            if (fechaInicio) {
                dondeCondiciones.push({ fecha: { gte: fechaInicio } });
            }
        }

        const filtrosConsulta = dondeCondiciones.length > 0 ? { AND: dondeCondiciones } : {};

        // 5. Ejecución sincrónica de conteo total e historial paginado
        const [total, historial] = await prisma.$transaction([
            prisma.historialHerramienta.count({ where: filtrosConsulta }),
            prisma.historialHerramienta.findMany({
                where: filtrosConsulta,
                skip,
                take: limit,
                include: {
                    herramienta: true, 
                    usuario: true      
                },
                orderBy: { fecha: 'desc' } 
            })
        ]);

        res.json({ 
            data: historial, 
            meta: { 
                total, 
                page, 
                limit, 
                totalPages: Math.ceil(total / limit) 
            } 
        });
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
            descripcion, cantidadMinima, cantidadMaxima, cantidadDisponible, cantidad, imagen, esDesechable
        } = req.body;

        const usuarioBdId = await obtenerUsuarioIdValido(req);
        if (!usuarioBdId) {
            return res.status(401).json({ error: "Error de autenticación. Usuario no encontrado en la BD." });
        }

        const sanitizarTexto = (val) => (val === null || val === undefined) ? '' : String(val).trim();

        const cantMinimaNum = parseInt(cantidadMinima, 10) || 0;
        const cantMaximaNum = parseInt(cantidadMaxima, 10) || 0; 
        const esDesechableBool = esDesechable === true || esDesechable === 'true';

        let cantDisp = parseInt(cantidadDisponible, 10);
        let cantTot = parseInt(cantidad, 10);

        if (isNaN(cantDisp)) cantDisp = 0;
        if (isNaN(cantTot)) cantTot = 0;

        const stockInicial = (cantidadDisponible !== undefined) ? cantDisp : cantTot;

        if (cantMaximaNum > 0 && stockInicial > cantMaximaNum) {
            return res.status(400).json({ error: `Error: El stock inicial (${stockInicial}) supera el límite máximo permitido (${cantMaximaNum}).` });
        }

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
                    cantidadMaxima: cantMaximaNum,
                    cantidadDisponible: stockInicial,
                    cantidad: stockInicial,
                    esDesechable: esDesechableBool,
                    estado: 'ACTIVA' 
                }
            });

            await tx.historialHerramienta.create({
                data: {
                    accion: 'CREACION',
                    herramientaId: herramienta.id,
                    usuarioId: usuarioBdId,
                    detalle: `Registro inicial. Stock: ${stockInicial} | Desechable: ${esDesechableBool ? 'Sí' : 'No'}`
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
            descripcion, cantidadMinima, cantidadMaxima, cantidad, cantidadDisponible, imagen, esDesechable 
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

            if (esDesechable !== undefined) {
                dataToUpdate.esDesechable = esDesechable === true || esDesechable === 'true';
            }

            const valorMinimo = cantidadMinima ?? herramientaVieja.cantidadMinima;
            if (valorMinimo !== undefined && valorMinimo !== null && valorMinimo !== '') {
                dataToUpdate.cantidadMinima = parseInt(valorMinimo, 10) || 0;
            }

            const valorMaximo = cantidadMaxima ?? herramientaVieja.cantidadMaxima;
            if (valorMaximo !== undefined && valorMaximo !== null && valorMaximo !== '') {
                dataToUpdate.cantidadMaxima = parseInt(valorMaximo, 10) || 0;
            }

            const nuevaDispRecibida = parseInt(cantidadDisponible, 10);
            const nuevaCantRecibida = parseInt(cantidad, 10);

            const unidadesPrestadas = herramientaVieja.cantidad - herramientaVieja.cantidadDisponible;

            let nuevaCantidadTotal = herramientaVieja.cantidad;
            let nuevaCantidadDisponible = herramientaVieja.cantidadDisponible;

            if (!isNaN(nuevaDispRecibida)) {
                nuevaCantidadDisponible = nuevaDispRecibida;
                nuevaCantidadTotal = nuevaCantidadDisponible + unidadesPrestadas; 
            } else if (!isNaN(nuevaCantRecibida)) {
                nuevaCantidadTotal = nuevaCantRecibida;
                nuevaCantidadDisponible = nuevaCantidadTotal - unidadesPrestadas;
            }

            if (nuevaCantidadDisponible < 0) {
                throw new Error(`VALIDATION_ERROR: Error matemático. El stock disponible resultante sería menor a 0.`);
            }

            const maxFinal = dataToUpdate.cantidadMaxima ?? herramientaVieja.cantidadMaxima;
            if (maxFinal > 0 && nuevaCantidadTotal > maxFinal) {
                throw new Error(`VALIDATION_ERROR: Al sumar las ${unidadesPrestadas} unidad(es) prestada(s), el total general (${nuevaCantidadTotal}) superaría la cantidad máxima (${maxFinal}).`);
            }

            dataToUpdate.cantidad = nuevaCantidadTotal;
            dataToUpdate.cantidadDisponible = nuevaCantidadDisponible;

            let detallesCambio = [];
            const camposAComparar = [
                { key: 'codigo', label: 'Código' },
                { key: 'nombre', label: 'Nombre' },
                { key: 'tipo', label: 'Categoría' },
                { key: 'ubicacion', label: 'Ubicación' },
                { key: 'marca', label: 'Marca' },
                { key: 'esDesechable', label: 'Desechable' },
                { key: 'cantidadMinima', label: 'Stock Mínimo' },
                { key: 'cantidadMaxima', label: 'Stock Máximo' }, 
                { key: 'cantidadDisponible', label: 'Stock Físico' } 
            ];

            camposAComparar.forEach(campo => {
                if (dataToUpdate[campo.key] !== undefined) {
                    let valorViejo = herramientaVieja[campo.key];
                    let valorNuevo = dataToUpdate[campo.key];

                    if (typeof valorViejo === 'boolean') {
                        valorViejo = valorViejo ? 'Sí' : 'No';
                        valorNuevo = valorNuevo ? 'Sí' : 'No';
                    } else {
                        valorViejo = sanitizarTexto(valorViejo);
                        valorNuevo = sanitizarTexto(valorNuevo);
                    }

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

            if (detallesCambio.length > 0) {
                await tx.historialHerramienta.create({
                    data: {
                        accion: 'MODIFICACION',
                        herramientaId: herramienta.id,
                        usuarioId: usuarioBdId,
                        detalle: textoHistorial
                    }
                });
            }

            return herramienta;
        });

        res.json(herramientaActualizada);
    } catch (error) {
        if (error.message && error.message.includes('VALIDATION_ERROR')) {
            return res.status(400).json({ error: error.message.replace('VALIDATION_ERROR: ', '') });
        }
        if (error.code === 'P2002' && error.meta?.target?.includes('codigo')) {
            return res.status(400).json({ error: "El código ingresado ya pertenece a otra herramienta." });
        }
        console.error("Error al actualizar herramienta:", error);
        res.status(500).json({ error: "Error BD: " + (error.message ? error.message.substring(0, 150) : "Fallo desconocido.") });
    }
});

// =====================================================================
// 4. DELETE /api/herramientas/:id -> Baja lógica con motivo y desglose
// =====================================================================
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo, motivoOtro } = req.body; 

        const usuarioBdId = await obtenerUsuarioIdValido(req);
        if (!usuarioBdId) {
            return res.status(401).json({ error: "Error de autenticación. Usuario no encontrado en BD." });
        }

        if (!motivo) {
            return res.status(400).json({ error: "Debe seleccionar un motivo de baja." });
        }

        let detalleMotivo = `Motivo de baja: ${motivo}`;
        if (motivo.toLowerCase() === 'otro') {
            if (!motivoOtro || motivoOtro.trim() === '') {
                return res.status(400).json({ error: "Debe especificar el motivo en el campo 'Otro'." });
            }
            detalleMotivo += ` (${motivoOtro.trim()})`;
        }

        const herramientaId = parseInt(id, 10);

        const herramienta = await prisma.herramienta.findUnique({
            where: { id: herramientaId }
        });

        if (!herramienta) {
            return res.status(404).json({ error: "Herramienta no encontrada." });
        }

        if (herramienta.cantidad > herramienta.cantidadDisponible) {
            return res.status(400).json({ 
                error: `No se puede dar de baja. La herramienta tiene ${herramienta.cantidad - herramienta.cantidadDisponible} unidad(es) prestada(s).` 
            });
        }

        const salidaPendiente = await prisma.detalleSalida.findFirst({
            where: {
                herramientaId: herramientaId,
                salida: {
                    estado: 'PENDIENTE'
                }
            }
        });

        if (salidaPendiente) {
            return res.status(400).json({ 
                error: "No se puede dar de baja. Existen registros de salidas pendientes de devolución para esta herramienta." 
            });
        }

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
                    detalle: detalleMotivo 
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
    let errores = []; 

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
                    const maxPermitido = herramientaExistente.cantidadMaxima;

                    if (maxPermitido > 0 && (cantVieja + cantidadAAgregar) > maxPermitido) {
                        errores.push(`Código ${item.codigo}: Superaría el límite máximo de ${maxPermitido}. Se omitió.`);
                        continue;
                    }

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
                    const cantidadMaxima = parseInt(item.cantidadMaxima, 10) || 0;

                    if (cantidadMaxima > 0 && cantidadAAgregar > cantidadMaxima) {
                        errores.push(`Código ${item.codigo}: Stock inicial ${cantidadAAgregar} supera su límite máximo de ${cantidadMaxima}. Se omitió.`);
                        continue;
                    }
                    
                    const esDesechableBool = item.esDesechable === true || item.esDesechable === 'true' || item.esDesechable === 'Sí';

                    const nuevaHerramienta = await tx.herramienta.create({
                        data: {
                            codigo: item.codigo,
                            nombre: item.nombre,
                            descripcion: item.descripcion || '',
                            marca: item.marca || '',
                            cantidad: cantidadAAgregar,
                            cantidadDisponible: cantidadAAgregar,
                            cantidadMinima: cantidadMinima,
                            cantidadMaxima: cantidadMaxima, 
                            tipo: item.tipo || null,
                            ubicacion: item.ubicacion || null,
                            esDesechable: esDesechableBool, 
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
            mensaje: 'Importación finalizada.',
            creados,
            actualizados,
            advertencias: errores.length > 0 ? errores : undefined
        });

    } catch (error) {
        console.error('Error en importación masiva:', error);
        res.status(500).json({ error: 'Ocurrió un error al procesar el archivo. Revisa el formato de los datos.' });
    }
});

export default router;