// PARTE SUPERIOR: Usamos 'import' en lugar de 'require'
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET: Obtener todas las herramientas activas
router.get('/', async (req, res) => {
    try {
        const herramientas = await prisma.herramienta.findMany({
            where: { estado: { not: 'DADA_DE_BAJA' } },
            orderBy: { id: 'asc' }
        });
        res.json(herramientas);
    } catch (error) {
        console.error("Error al obtener herramientas:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// POST: Crear una nueva herramienta
router.post('/', async (req, res) => {
    try {
        // AGREGAMOS 'marca' y 'descripcion' AQUÍ
        const { codigo, nombre, tipo, ubicacion, marca, descripcion, cantidadMinima, cantidadDisponible, imagen } = req.body;
        
        const nuevaHerramienta = await prisma.herramienta.create({
            data: {
                codigo,
                nombre,
                tipo,
                ubicacion,
                marca,         // Y LOS PASAMOS A PRISMA
                descripcion,   // Y LOS PASAMOS A PRISMA
                imagen, 
                cantidadMinima: parseInt(cantidadMinima),
                cantidadDisponible: parseInt(cantidadDisponible),
                cantidad: parseInt(cantidadDisponible)
            }
        });
        
        res.status(201).json(nuevaHerramienta);
    } catch (error) {
        // VALIDACIÓN DE CÓDIGO DUPLICADO
        if (error.code === 'P2002' && error.meta?.target?.includes('codigo')) {
            return res.status(400).json({ error: "El código ingresado ya existe. Por favor, utiliza un código diferente." });
        }
        
        console.error("Error al crear herramienta:", error);
        res.status(500).json({ error: "Error al guardar en la base de datos." });
    }
});

// PUT: Actualizar una herramienta existente
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // AGREGAMOS 'marca' y 'descripcion' AQUÍ TAMBIÉN
        const { codigo, nombre, tipo, ubicacion, marca, descripcion, cantidadMinima, cantidadDisponible, imagen } = req.body;

        const herramientaActualizada = await prisma.herramienta.update({
            where: { id: parseInt(id) },
            data: {
                codigo,
                nombre,
                tipo,
                ubicacion,
                marca,         // Y LOS PASAMOS A PRISMA
                descripcion,   // Y LOS PASAMOS A PRISMA
                imagen,
                cantidadMinima: parseInt(cantidadMinima),
                cantidadDisponible: parseInt(cantidadDisponible)
            }
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

// DELETE: "Soft Delete" (Baja lógica)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await prisma.herramienta.update({
            where: { id: parseInt(id) },
            data: { estado: 'DADA_DE_BAJA' }
        });

        res.json({ message: "Herramienta dada de baja exitosamente." });
    } catch (error) {
        console.error("Error al dar de baja:", error);
        res.status(500).json({ error: "Error al eliminar la herramienta." });
    }
});

// PARTE INFERIOR: Exportamos con la sintaxis de ES Modules
export default router;