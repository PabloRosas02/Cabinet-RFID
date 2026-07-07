const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    // 1. La contraseña en texto plano que el usuario escribiría
    const contrasenaOriginal = "MiClaveSegura123";

    // 2. Encriptamos la contraseña (el número 10 es el "costo" o nivel de seguridad)
    const contrasenaEncriptada = await bcrypt.hash(contrasenaOriginal, 10);

    // 3. Guardamos en la base de datos
    const nuevoUsuario = await prisma.usuario.create({
        data: {
            nombre: "Pablo Yair Rosas Ibarraran",
            correo: "pablo.rosas@correo.com", // Inventa un correo
            departamento: "INGENIERIA",       // Debe ser uno de los 3 que definimos
            contrasena: contrasenaEncriptada, // Guardamos la versión ilegible
            tarjetaRfid: 4043594,          // ¡PON AQUÍ TU NÚMERO DE TARJETA REAL!
        }
    });

    console.log("¡Usuario creado con éxito!");
    console.log(nuevoUsuario);
}

main()
    .catch((e) => {
        console.error("Error al crear usuario:", e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });