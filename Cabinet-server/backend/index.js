import express from 'express';
import cors from 'cors'; 
import path from 'path';                          
import { fileURLToPath } from 'url';                
import rutasUsuarios from './routes/usuarios.js'; 
import rutasHerramientas from './routes/herramientas.js'; 
import rutasPedidos from './routes/pedidos.js';

// Configuración especial para obtener la ruta de tu servidor con "type": "module"
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middlewares globales
app.use(cors()); 
app.use(express.json()); 

// 2. Definición de Rutas API (Las peticiones de datos pasan primero por aquí)
app.use('/api/usuarios', rutasUsuarios);
app.use('/api/herramientas', rutasHerramientas); 
app.use('/api/pedidos', rutasPedidos);

// ======================================================================
// 3. INTEGRACIÓN DEL FRONTEND (Reemplaza a tu antigua ruta de texto)
// ======================================================================
// A) Le decimos a Express que los archivos de diseño están en la carpeta 'dist'
app.use(express.static(path.join(__dirname, 'dist')));

// B) Catch-all: Si alguien entra a una ruta que no es de la API, le mostramos el diseño de Vue
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
// ======================================================================

// 4. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor Backend y Frontend corriendo en http://localhost:${PORT}`);
});