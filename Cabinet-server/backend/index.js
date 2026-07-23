import express from 'express';
import cors from 'cors'; 
import path from 'path';                          
import { fileURLToPath } from 'url';                
import rutasUsuarios from './routes/usuarios.js'; 
import rutasHerramientas from './routes/herramientas.js'; 
import rutasPedidos from './routes/pedidos.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); 
app.use(express.json()); 

app.use('/api/usuarios', rutasUsuarios);
app.use('/api/herramientas', rutasHerramientas); 
app.use('/api/pedidos', rutasPedidos);

app.listen(PORT, () => {
    console.log(`Servidor Backend y Frontend corriendo en http://localhost:${PORT}`);
});