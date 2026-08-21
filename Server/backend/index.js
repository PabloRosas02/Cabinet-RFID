import express from 'express';
import cors from 'cors'; 
import path from 'path';                                   
import { fileURLToPath } from 'url';          
import usuariosRoutes from './routes/usuarios.js';
import herramientasRoutes from './routes/herramientas.js';
import salidasRoutes from './routes/salidas.js';
import configRoutes from './routes/configRoutes.js';
import { configurarCronNotificaciones } from './jobs/cronPendientes.js'; 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/herramientas', herramientasRoutes);
app.use('/api/salidas', salidasRoutes);
app.use('/api', configRoutes);

configurarCronNotificaciones();

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
    });
}

export default app;