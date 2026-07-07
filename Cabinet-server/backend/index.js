const mqtt = require('mqtt');
const { PrismaClient } = require('@prisma/client');

// Inicializamos la conexión a PostgreSQL a través de Prisma
const prisma = new PrismaClient();

// Conexión al broker MQTT de Docker
const brokerUrl = 'mqtt://mosquitto:1883';
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
    console.log('Backend conectado con éxito al Broker Mosquitto');
    
    // Nos suscribimos al tópico donde el ESP32 publicará las lecturas
    client.subscribe('gabinete/rfid/lectura', (err) => {
        if (!err) {
            console.log('📡 Escuchando el tópico: gabinete/rfid/lectura');
        }
    });
});

// IMPORTANTE: Agregamos 'async' para poder buscar en la base de datos
client.on('message', async (topic, message) => {
    if (topic === 'gabinete/rfid/lectura') {
        const tarjetaId = message.toString().trim();
        console.log(`\nSolicitud de acceso recibida. Tarjeta: [${tarjetaId}]`);

        let respuesta = { acceso: false, mensaje: 'Acceso Denegado' };

        try {
            // Buscamos la tarjeta real en la base de datos PostgreSQL
            const usuario = await prisma.usuario.findUnique({
                where: { tarjetaRfid: tarjetaId }
            });

            // Si la tarjeta existe en la tabla de DBeaver...
            if (usuario) {
                // Verificamos si el usuario tiene permiso activo
                if (usuario.activo) {
                    respuesta = { acceso: true, mensaje: `Acceso Permitido. Hola ${usuario.nombre}` };
                    console.log(`Acceso Permitido para ${usuario.nombre} del depto: ${usuario.departamento || 'N/A'}`);
                } else {
                    respuesta = { acceso: false, mensaje: 'Usuario Inactivo' };
                    console.log(`Acceso Denegado: La cuenta de ${usuario.nombre} está inactiva.`);
                }
            } else {
                console.log(`Acceso Denegado: La tarjeta [${tarjetaId}] no está registrada en el sistema.`);
            }
        } catch (error) {
            console.error("Error crítico al consultar la base de datos:", error);
            respuesta = { acceso: false, mensaje: 'Error interno del servidor' };
        }

        // Publicar la respuesta de vuelta al ESP32
        client.publish('gabinete/rfid/respuesta', JSON.stringify(respuesta));
    }
});