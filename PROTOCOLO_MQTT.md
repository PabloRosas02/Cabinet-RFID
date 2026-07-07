# Protocolo de Comunicación MQTT (Cabinet)

Este documento describe la arquitectura de mensajería utilizada para la comunicación bidireccional entre el hardware (ESP32) y el cerebro del sistema (Backend Node.js).

## Configuración del Broker
* **Servidor:** Eclipse Mosquitto (Ejecutándose en Docker)
* **Host:** `localhost` (para pruebas locales) / `mosquitto` (entre contenedores)
* **Puerto:** `1883`
* **Autenticación:** Sin credenciales (por defecto en entorno de desarrollo)

---

## Tópicos de Comunicación

### 1. Solicitud de Acceso (Lectura RFID)
* **Tópico:** `gabinete/rfid/lectura`
* **Publica:** ESP32
* **Suscribe:** Backend (Node.js)
* **Descripción:** Se dispara cada vez que una tarjeta RFID es detectada por el lector físico del gabinete.
* **Formato del Payload (Mensaje):** `String` (Texto plano)

**Ejemplo de Payload enviado por el ESP32:**
```text
4039779