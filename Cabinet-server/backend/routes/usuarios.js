import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 1. OBTENER TODOS LOS USUARIOS (GET)
router.get('/', async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany({
            // No enviamos la contraseña al frontend por seguridad
            select: {
                id: true,
                nombre: true,
                numTrabajador: true,
                depart: true,
                rol: true,
                tarjetaRfid: true,
                creadoEn: true
            },
            orderBy: { id: 'asc' }
        });
        res.json(usuarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
});

// 2. CREAR UN NUEVO USUARIO (POST)
router.post('/', async (req, res) => {
    try {
        const { nombre, numTrabajador, depart, rol, tarjetaRfid } = req.body;
        
        const nuevoUsuario = await prisma.usuario.create({
            data: {
                nombre,
                numTrabajador,
                depart: depart,
                rol,
                tarjetaRfid: tarjetaRfid || null,
                // TODO: En producción, usar bcrypt para hashear la contraseña. 
                // Por ahora asignamos una por defecto basada en el número de trabajador.
                contrasena: `Crissair${numTrabajador}` 
            }
        });
        
        // Removemos la contraseña de la respuesta
        delete nuevoUsuario.contrasena;
        res.status(201).json(nuevoUsuario);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el usuario. Verifica que el No. Trabajador o RFID no estén duplicados.' });
    }
});

// 3. ACTUALIZAR UN USUARIO (PUT)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, numTrabajador, depart, rol, tarjetaRfid } = req.body;

        const usuarioActualizado = await prisma.usuario.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                numTrabajador,
                depart,
                rol,
                tarjetaRfid: tarjetaRfid || null
            }
        });

        delete usuarioActualizado.contrasena;
        res.json(usuarioActualizado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el usuario' });
    }
});

// 4. ELIMINAR UN USUARIO (DELETE)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.usuario.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
});

// 5. INICIAR SESIÓN (POST /login)
router.post('/login', async (req, res) => {
    try {
        const { numTrabajador, contrasena } = req.body;
        
        // 1. Buscar si el trabajador existe
        const usuario = await prisma.usuario.findUnique({
            where: { numTrabajador: parseInt(numTrabajador, 10) }
        });

        // 2. Si no existe, rechazamos
        if (!usuario) {
            return res.status(401).json({ error: 'El número de trabajador no existe en el sistema.' });
        }

        // 3. Verificar contraseña (ajusta esto si en el futuro usas bcrypt)
        if (usuario.contrasena !== contrasena) {
            return res.status(401).json({ error: 'La contraseña es incorrecta.' });
        }

        // 4. Si todo es correcto, quitamos la contraseña por seguridad y enviamos éxito
        const { contrasena: _, ...usuarioSinPassword } = usuario;
        
        res.status(200).json({ 
            message: 'Login exitoso', 
            usuario: usuarioSinPassword 
        });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: 'Error interno del servidor al intentar iniciar sesión.' });
    }
});

export default router;