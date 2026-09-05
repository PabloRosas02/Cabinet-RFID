import express from 'express';
import { PrismaClient } from '@prisma/client';
import { encriptarContrasena, verificarContrasena } from '../utils/encriptacion.js';
import jwt from 'jsonwebtoken';
import { verificarToken, generateToken } from '../middlewares/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// =====================================================================
// 1. OBTENER TODOS LOS USUARIOS (GET)
// =====================================================================
router.get('/', verificarToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search ? req.query.search.trim() : '';
    const skip = (page - 1) * limit;

    let filtrosConsulta = {};

    if (search) {
      const orConditions = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { correo: { contains: search, mode: 'insensitive' } }
      ];

      // Verificamos si la búsqueda coincide con algún valor del Enum Departamento
      const deptoCoincidencia = Object.values(['INGENIERIA', 'MANTENIMIENTO', 'ADMINISTRACION'])
        .find(d => d.includes(search.toUpperCase()));
      if (deptoCoincidencia) {
        orConditions.push({ depart: deptoCoincidencia });
      }

      // Verificamos si la búsqueda coincide con algún valor del Enum RolUsuario
      const rolCoincidencia = Object.values(['ADMINISTRADOR', 'SUPERVISOR_ALMACEN', 'ALMACENISTA', 'OPERADOR'])
        .find(r => r.includes(search.toUpperCase()));
      if (rolCoincidencia) {
        orConditions.push({ rol: rolCoincidencia });
      }

      // Si el término introducido es numérico, buscamos por numTrabajador
      const searchNum = parseInt(search, 10);
      if (!isNaN(searchNum)) {
        orConditions.push({ numTrabajador: searchNum });
      }

      filtrosConsulta.OR = orConditions;
    }

    const [total, usuarios] = await prisma.$transaction([
      prisma.usuario.count({ where: filtrosConsulta }),
      prisma.usuario.findMany({
        where: filtrosConsulta,
        skip,
        take: limit,
        select: {
          id: true,
          nombre: true,
          numTrabajador: true,
          depart: true,
          rol: true,
          tarjetaRfid: true,
          correo: true,    
          telefono: true,   
          creadoEn: true
        },
        orderBy: { id: 'asc' }
      })
    ]);

    res.json({
      data: usuarios,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

// =====================================================================
// 1.5 OBTENER SOLO ADMINISTRADORES 
// =====================================================================
router.get('/administradores', verificarToken, async (req, res) => {
  try {
    const administradores = await prisma.usuario.findMany({
      where: { rol: 'ADMINISTRADOR' }, 
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true
      },
      orderBy: { nombre: 'asc' }
    });
    res.json(administradores);
  } catch (error) {
    console.error("Error al obtener administradores:", error);
    res.status(500).json({ error: 'Error al obtener administradores' });
  }
});

// =====================================================================
// 2. CREAR UN NUEVO USUARIO (POST)
// =====================================================================
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre, numTrabajador, depart, rol, tarjetaRfid, contrasena, correo, telefono } = req.body;

    const numTrabajadorInt = parseInt(numTrabajador, 10);
    if (isNaN(numTrabajadorInt)) {
      return res.status(400).json({ error: 'El número de trabajador debe ser un número entero válido.' });
    }

    const rfidInt = tarjetaRfid ? parseInt(tarjetaRfid, 10) : null;
    const contrasenaPlana = contrasena || `Crissair${numTrabajadorInt}`;
    const contrasenaHasheada = await encriptarContrasena(contrasenaPlana);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        numTrabajador: numTrabajadorInt,
        depart: depart ? depart.toUpperCase() : 'INGENIERIA',
        rol: rol ? rol.toUpperCase() : 'OPERADOR',
        tarjetaRfid: !isNaN(rfidInt) ? rfidInt : null,
        correo: correo || null,      
        telefono: telefono || null,   
        contrasena: contrasenaHasheada
      }
    });

    delete nuevoUsuario.contrasena;
    res.status(201).json(nuevoUsuario);
  } catch (error) {
    console.error("Error al crear usuario:", error);
    if (error.code === 'P2002') {
      const target = error.meta?.target || [];
      if (target.includes('numTrabajador')) {
        return res.status(400).json({ error: 'El No. de Trabajador ya se encuentra registrado.' });
      }
      if (target.includes('correo')) {
        return res.status(400).json({ error: 'El correo electrónico ya pertenece a otro usuario.' });
      }
      if (target.includes('tarjetaRfid')) {
        return res.status(400).json({ error: 'La tarjeta RFID ya está asignada a otro usuario.' });
      }
    }
    res.status(500).json({ error: 'Error al crear el usuario.' });
  }
});

// =====================================================================
// 3. ACTUALIZAR UN USUARIO (PUT) 
// =====================================================================
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, numTrabajador, depart, rol, tarjetaRfid, contrasena, correo, telefono } = req.body;

    const numTrabajadorInt = parseInt(numTrabajador, 10);
    const rfidInt = tarjetaRfid ? parseInt(tarjetaRfid, 10) : null;

    let datosAActualizar = {
      nombre,
      numTrabajador: !isNaN(numTrabajadorInt) ? numTrabajadorInt : undefined,
      depart: depart ? depart.toUpperCase() : undefined,
      rol: rol ? rol.toUpperCase() : undefined,
      tarjetaRfid: !isNaN(rfidInt) ? rfidInt : null,
      correo: correo || null,      
      telefono: telefono || null    
    };

    if (contrasena && contrasena.trim() !== '') {
      const contrasenaHasheada = await encriptarContrasena(contrasena);
      datosAActualizar.contrasena = contrasenaHasheada;
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: parseInt(id, 10) },
      data: datosAActualizar
    });

    delete usuarioActualizado.contrasena;
    res.json(usuarioActualizado);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El número de trabajador, correo o RFID ya está en uso por otro usuario.' });
    }
    res.status(500).json({ error: 'Error al actualizar el usuario.' });
  }
});

// =====================================================================
// 4. ELIMINAR UN USUARIO (DELETE)
// =====================================================================
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.usuario.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'No se puede eliminar: Este usuario tiene historial de salidas asociado en el sistema.'
      });
    }
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
});

// =====================================================================
// 5. INICIAR SESIÓN CON JWT (POST /login)
// =====================================================================
router.post('/login', async (req, res) => {
  try {
    const { numTrabajador, contrasena } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { numTrabajador: parseInt(numTrabajador, 10) }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'El número de trabajador no existe en el sistema.' });
    }

    const passwordValida = await verificarContrasena(contrasena, usuario.contrasena);

    if (!passwordValida) {
      return res.status(401).json({ error: 'La contraseña es incorrecta.' });
    }

    const payload = {
      id: usuario.id,
      numTrabajador: usuario.numTrabajador,
      nombre: usuario.nombre,
      rol: usuario.rol
    };

    const token = generateToken(payload, '8h');

    const { contrasena: _, ...usuarioSinPassword } = usuario;

    res.status(200).json({
      message: 'Login exitoso',
      token: token,
      usuario: usuarioSinPassword
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: 'Error interno del servidor al intentar iniciar sesión.' });
  }
});

// =====================================================================
// 6. BUSCAR USUARIOS PARA AUTOCOMPLETADO (GET /buscar)
// =====================================================================
router.get('/buscar', verificarToken, async (req, res) => {
  try {
    const q = req.query.q ? req.query.q.trim() : '';

    if (!q) {
      const usuarios = await prisma.usuario.findMany({
        take: 10,
        select: {
          id: true,
          nombre: true,
          numTrabajador: true,
          depart: true,
          tarjetaRfid: true,
          correo: true,
          telefono: true
        },
        orderBy: { nombre: 'asc' }
      });
      return res.json(usuarios);
    }

    const searchTerm = `%${q}%`;
    const usuarios = await prisma.$queryRaw`
      SELECT id, nombre, "numTrabajador", depart, "tarjetaRfid", correo, telefono 
      FROM "Usuario" 
      WHERE nombre ILIKE ${searchTerm} 
         OR CAST("numTrabajador" AS TEXT) LIKE ${searchTerm}
      LIMIT 10
    `;

    res.json(usuarios);
  } catch (error) {
    console.error("Error al buscar usuarios para autocompletado:", error);
    res.status(500).json({ error: 'Error al buscar usuarios' });
  }
});

export default router;