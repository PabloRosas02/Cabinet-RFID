import express from 'express';
import cors from 'cors'; // MUY IMPORTANTE: Instalar con 'npm install cors' en tu backend
import rutasUsuarios from './routes/usuarios.js'; // Importamos las rutas que acabas de crear

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middlewares globales
app.use(cors()); // Permite que tu frontend en Vue se comunique con este backend
app.use(express.json()); // Permite recibir datos en formato JSON desde el frontend

// 2. Definición de Rutas API
// Esto significa que todas las rutas dentro de usuarios.js tendrán el prefijo /api/usuarios
app.use('/api/usuarios', rutasUsuarios);

// 3. Ruta de prueba o raíz
app.get('/', (req, res) => {
    res.send('API del Sistema de Gabinete funcionando correctamente.');
});

// 4. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});