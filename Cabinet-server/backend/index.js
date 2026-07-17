import express from 'express';
import cors from 'cors'; 
import rutasUsuarios from './routes/usuarios.js'; 
import rutasHerramientas from './routes/herramientas.js'; 
import rutasPedidos from './routes/pedidos.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middlewares globales
app.use(cors()); 
app.use(express.json()); 

// 2. Definición de Rutas API
app.use('/api/usuarios', rutasUsuarios);
app.use('/api/herramientas', rutasHerramientas); 
app.use('/api/pedidos', rutasPedidos);

// 3. Ruta de prueba o raíz
app.get('/', (req, res) => {
    res.send('API del Sistema de Gabinete funcionando correctamente.');
});

// 4. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});