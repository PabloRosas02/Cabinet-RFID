import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt'; // <-- 1. IMPORTAMOS BCRYPT

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando la carga masiva de datos (10 Usuarios y 20 Herramientas)...\n');

  // =========================================
  // 1. CARGAR 10 USUARIOS
  // =========================================
  console.log('Sembrando 10 Usuarios...');
  const usuarios = [
    { numTrabajador: 1000, nombre: 'Admin Principal', depart: 'ADMINISTRACION', rol: 'ADMINISTRADOR', tarjetaRfid: 100001 },
    { numTrabajador: 1001, nombre: 'Supervisor Almacén', depart: 'INGENIERIA', rol: 'SUPERVISOR_ALMACEN', tarjetaRfid: 100002 },
    { numTrabajador: 1002, nombre: 'Almacenista Uno', depart: 'MANTENIMIENTO', rol: 'ALMACENISTA', tarjetaRfid: 100003 },
    { numTrabajador: 1003, nombre: 'Almacenista Dos', depart: 'INGENIERIA', rol: 'ALMACENISTA', tarjetaRfid: 100004 },
    { numTrabajador: 1004, nombre: 'Operador Alpha', depart: 'MANTENIMIENTO', rol: 'OPERADOR', tarjetaRfid: 100005 },
    { numTrabajador: 1005, nombre: 'Operador Beta', depart: 'INGENIERIA', rol: 'OPERADOR', tarjetaRfid: 100006 },
    { numTrabajador: 1006, nombre: 'Operador Gamma', depart: 'MANTENIMIENTO', rol: 'OPERADOR', tarjetaRfid: 100007 },
    { numTrabajador: 1007, nombre: 'Operador Delta', depart: 'ADMINISTRACION', rol: 'OPERADOR', tarjetaRfid: 100008 },
    { numTrabajador: 1008, nombre: 'Operador Epsilon', depart: 'INGENIERIA', rol: 'OPERADOR', tarjetaRfid: 100009 },
    { numTrabajador: 1009, nombre: 'Operador Zeta', depart: 'MANTENIMIENTO', rol: 'OPERADOR', tarjetaRfid: null } 
  ];

  for (const u of usuarios) {
    // 2. ENCRIPTAMOS LA CONTRASEÑA ANTES DE GUARDARLA
    const contrasenaPlana = `123456`;
    const contrasenaHasheada = await bcrypt.hash(contrasenaPlana, 10); 

    await prisma.usuario.upsert({
      where: { numTrabajador: u.numTrabajador },
      update: {
        nombre: u.nombre,
        contrasena: contrasenaHasheada, // <-- Usamos la encriptada
        depart: u.depart,
        rol: u.rol,
        tarjetaRfid: u.tarjetaRfid
      },
      create: {
        numTrabajador: u.numTrabajador,
        nombre: u.nombre,
        contrasena: contrasenaHasheada, // <-- Usamos la encriptada
        depart: u.depart,
        rol: u.rol,
        tarjetaRfid: u.tarjetaRfid
      },
    });
  }
  console.log('10 Usuarios creados/actualizados exitosamente.');

  // =========================================
  // 2. CARGAR 20 HERRAMIENTAS
  // =========================================
  console.log('\nSembrando 20 Herramientas...');
  const herramientas = [
    { codigo: 'HERR-001', nombre: 'Taladro Inalámbrico 20V', marca: 'DeWalt', cantidad: 5, tipo: 'Eléctrica', ubicacion: 'Estante A1' },
    { codigo: 'HERR-002', nombre: 'Multímetro Digital', marca: 'Fluke', cantidad: 3, tipo: 'Medición', ubicacion: 'Estante A2' },
    { codigo: 'HERR-003', nombre: 'Cautín 40W', marca: 'Weller', cantidad: 10, tipo: 'Soldadura', ubicacion: 'Estante B1' },
    { codigo: 'HERR-004', nombre: 'Osciloscopio 100MHz', marca: 'Tektronix', cantidad: 2, tipo: 'Medición', ubicacion: 'Estante A3' },
    { codigo: 'HERR-005', nombre: 'Fuente de Poder DC', marca: 'Korad', cantidad: 4, tipo: 'Electrónica', ubicacion: 'Estante B2' },
    { codigo: 'HERR-006', nombre: 'Juego de Desarmadores', marca: 'Truper', cantidad: 15, tipo: 'Manual', ubicacion: 'Estante C1' },
    { codigo: 'HERR-007', nombre: 'Pinzas de Corte Diagonal', marca: 'Klein Tools', cantidad: 8, tipo: 'Manual', ubicacion: 'Estante C2' },
    { codigo: 'HERR-008', nombre: 'Pinzas Pelacables', marca: 'Stanley', cantidad: 12, tipo: 'Manual', ubicacion: 'Estante C2' },
    { codigo: 'HERR-009', nombre: 'Esmeriladora 4-1/2"', marca: 'Makita', cantidad: 3, tipo: 'Eléctrica', ubicacion: 'Estante A4' },
    { codigo: 'HERR-010', nombre: 'Sierra Circular 7-1/4"', marca: 'Bosch', cantidad: 2, tipo: 'Eléctrica', ubicacion: 'Estante A4' },
    { codigo: 'HERR-011', nombre: 'Pistola de Calor', marca: 'Black+Decker', cantidad: 5, tipo: 'Eléctrica', ubicacion: 'Estante B3' },
    { codigo: 'HERR-012', nombre: 'Vernier Digital', marca: 'Mitutoyo', cantidad: 6, tipo: 'Medición', ubicacion: 'Estante A2' },
    { codigo: 'HERR-013', nombre: 'Llave Inglesa 10"', marca: 'Crescent', cantidad: 10, tipo: 'Manual', ubicacion: 'Estante D1' },
    { codigo: 'HERR-014', nombre: 'Juego de Llaves Allen', marca: 'Bondhus', cantidad: 20, tipo: 'Manual', ubicacion: 'Estante D2' },
    { codigo: 'HERR-015', nombre: 'Martillo de Uña 16 oz', marca: 'Truper', cantidad: 8, tipo: 'Manual', ubicacion: 'Estante D3' },
    { codigo: 'HERR-016', nombre: 'Cinta Métrica 5m', marca: 'Stanley', cantidad: 15, tipo: 'Medición', ubicacion: 'Estante D4' },
    { codigo: 'HERR-017', nombre: 'Nivel de Gota 24"', marca: 'Empire', cantidad: 4, tipo: 'Medición', ubicacion: 'Estante D4' },
    { codigo: 'HERR-018', nombre: 'Estación de Soldadura', marca: 'Hakko', cantidad: 3, tipo: 'Soldadura', ubicacion: 'Estante B1' },
    { codigo: 'HERR-019', nombre: 'Extractor de Soldadura', marca: 'Steren', cantidad: 10, tipo: 'Soldadura', ubicacion: 'Estante B1' },
    { codigo: 'HERR-020', nombre: 'Lámpara de Trabajo LED', marca: 'Milwaukee', cantidad: 6, tipo: 'Iluminación', ubicacion: 'Estante E1' }
  ];

  for (const h of herramientas) {
    await prisma.herramienta.upsert({
      where: { codigo: h.codigo },
      update: {
        nombre: h.nombre,
        marca: h.marca,
        tipo: h.tipo,
        ubicacion: h.ubicacion,
        cantidad: h.cantidad,
        cantidadDisponible: h.cantidad, 
        cantidadMinima: 2,              
        estado: 'ACTIVA' 
      },
      create: {
        codigo: h.codigo,
        nombre: h.nombre,
        marca: h.marca,
        tipo: h.tipo,
        ubicacion: h.ubicacion,
        cantidad: h.cantidad,
        cantidadDisponible: h.cantidad, 
        cantidadMinima: 2,              
        estado: 'ACTIVA'                
      },
    });
  }
  console.log('20 Herramientas creadas/actualizadas exitosamente.');

  console.log('\nBase de datos sembrada con éxito');
}

main()
  .catch((e) => {
    console.error('Error al cargar los datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });