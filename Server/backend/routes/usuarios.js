import express from 'express';
import { PrismaClient } from '@prisma/client';
// Importamos nuestras nuevas funciones modulares
import { encriptarContrasena, verificarContrasena } from '../utils/encriptacion.js';

const router = express.Router();
const prisma = new PrismaClient();

// 1. OBTENER TODOS LOS USUARIOS (GET)
router.get('/', async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany({
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
        // Agregamos "contrasena" a la extracción del body
        const { nombre, numTrabajador, depart, rol, tarjetaRfid, contrasena } = req.body;
        
        // Usamos la contraseña del formulario. Si por alguna razón está vacía, usamos el default.
        const contrasenaPlana = contrasena || `Crissair${numTrabajador}`;
        
        // Encriptamos
        const contrasenaHasheada = await encriptarContrasena(contrasenaPlana);
        
        const nuevoUsuario = await prisma.usuario.create({
            data: {
                nombre,
                numTrabajador,
                depart,
                rol,
                tarjetaRfid: tarjetaRfid || null,
                contrasena: contrasenaHasheada 
            }
        });
        
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
        const { nombre, numTrabajador, depart, rol, tarjetaRfid, contrasena } = req.body;

        let datosAActualizar = {
            nombre,
            numTrabajador,
            depart,
            rol,
            tarjetaRfid: tarjetaRfid || null
        };

        if (contrasena && contrasena.trim() !== '') {
            const contrasenaHasheada = await encriptarContrasena(contrasena);
            datosAActualizar.contrasena = contrasenaHasheada;
        }

        const usuarioActualizado = await prisma.usuario.update({
            where: { id: parseInt(id) },
            data: datosAActualizar
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
        // Protección de llave foránea: Si el usuario ya prestó/recibió herramientas, no se puede borrar
        if (error.code === 'P2003') {
            return res.status(400).json({ 
                error: 'No se puede eliminar: Este usuario tiene historial de pedidos asociado en el sistema.' 
            });
        }
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
});

// 5. INICIAR SESIÓN (POST /login)
router.post('/login', async (req, res) => {
    try {
        const { numTrabajador, contrasena } = req.body;
        
        const usuario = await prisma.usuario.findUnique({
            where: { numTrabajador: parseInt(numTrabajador, 10) }
        });

        if (!usuario) {
            return res.status(401).json({ error: 'El número de trabajador no existe en el sistema.' });
        }

        // Usamos nuestra utilidad para verificar
        const passwordValida = await verificarContrasena(contrasena, usuario.contrasena);

        if (!passwordValida) {
            return res.status(401).json({ error: 'La contraseña es incorrecta.' });
        }

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