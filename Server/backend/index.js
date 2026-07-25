import express from 'express';
import cors from 'cors'; 
import path from 'path';                                  
import { fileURLToPath } from 'url';            
import usuariosRoutes from './routes/usuarios.js';
import herramientasRoutes from './routes/herramientas.js';
import pedidosRoutes from './routes/pedidos.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); 
app.use(express.json()); 

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/herramientas', herramientasRoutes);
app.use('/api/pedidos', pedidosRoutes);

app.listen(PORT, () => {
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});