const mqtt = require('mqtt');

// Conexión al broker usando el nombre del servicio en Docker
const brokerUrl = 'mqtt://mosquitto:1883';
const client = mqtt.connect(brokerUrl);

// Simulación de base de datos de tarjetas permitidas
const TARJETAS_PERMITIDAS = ['4039779', '4078791', '4501521'];

client.on('connect', () => {
    console.log('Backend conectado con éxito al Broker Mosquitto');
    
    // Nos suscribimos al tópico donde el ESP32 publicará las lecturas
    client.subscribe('gabinete/rfid/lectura', (err) => {
        if (!err) {
            console.log('Escuchando el tópico: gabinete/rfid/lectura');
        }
    });
});

client.on('message', (topic, message) => {
    if (topic === 'gabinete/rfid/lectura') {
        const tarjetaId = message.toString().trim();
        console.log(`\nTarjeta recibida: [${tarjetaId}]`);

        let respuesta = { acceso: false, mensaje: 'Acceso Denegado' };

        // Validar la tarjeta
        if (TARJETAS_PERMITIDAS.includes(tarjetaId)) {
            respuesta = { acceso: true, mensaje: 'Acceso Permitido' };
            console.log(`${respuesta.mensaje} para la tarjeta ${tarjetaId}`);
        } else {
            console.log(`${respuesta.mensaje} para la tarjeta ${tarjetaId}`);
        }

        // Publicar la respuesta de vuelta al ESP32
        // Usamos un tópico que incluya idealmente el ID de la tarjeta o del gabinete
        client.publish('gabinete/rfid/respuesta', JSON.stringify(respuesta));
    }
});