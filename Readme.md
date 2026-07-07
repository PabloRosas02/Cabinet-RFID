# Sistema de Control de Gabinete RFID (Cabinet)

**Autor:** Pablo Yair Rosas Ibarraran

Este proyecto es un sistema integral de control de acceso e inventario para un gabinete de herramientas. Utiliza un microcontrolador ESP32 con un lector RFID para el acceso físico, comunicándose vía MQTT con un servidor backend en Node.js, y un panel de administración web desarrollado en Vue.js.

---

## Tecnologías Utilizadas

### Hardware
* **Microcontrolador:** ESP32
* **Lector:** Módulo RFID 
* **Protocolo de comunicación:** MQTT (sobre WiFi)

### Backend (Servidor y Base de Datos)
* **Entorno:** Node.js
* **Base de Datos:** PostgreSQL (Contenerizado con Docker)
* **Broker MQTT:** Eclipse Mosquitto (Contenerizado con Docker)
* **ORM:** Prisma
* **Seguridad:** `bcrypt` para encriptación de contraseñas

### Frontend (Panel Web)
* **Framework:** Vue.js 3 (Composition API)
* **Enrutamiento:** Vue Router (SPA)
* **Manejo de Estado:** Pinia
* **Librería de Componentes:** PrimeVue (Tema Aura)

---

## Arquitectura del Sistema

1. El **ESP32** lee una tarjeta RFID y publica el ID en el tópico MQTT `gabinete/rfid/lectura`.
2. El **Backend (Node.js)** está suscrito a ese tópico. Al recibir un ID, consulta a **PostgreSQL** a través de **Prisma**.
3. Si el usuario está registrado, se publica una respuesta de acceso en el tópico `gabinete/rfid/respuesta`.
4. El **Frontend (Vue.js)** interactúa con el Backend a través de una API REST (por implementar) para gestionar el inventario de herramientas, el registro de préstamos y la administración de usuarios.

---

## Instalación y Despliegue

### 1. Requisitos Previos
* [Docker](https://www.docker.com/) y Docker Compose instalados.
* [Node.js](https://nodejs.org/) (v18 o superior).
* DBeaver (visualización de la DB).

### 2. Levantar la Infraestructura (Base de datos y Broker MQTT)
En la raíz del proyecto, ejecuta:
```bash
docker compose up -d