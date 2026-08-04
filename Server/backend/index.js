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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/herramientas', herramientasRoutes);
app.use('/api/pedidos', pedidosRoutes);

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
    });
}

export default app;