import { Router } from 'express';

const router = Router();

// Estado global en memoria para el switch
let automatizacionGlobal = false;

router.get('/configuracion/automatizacion', (req, res) => {
    res.json({ activo: automatizacionGlobal });
});

router.post('/configuracion/automatizacion', (req, res) => {
    const { activo } = req.body;
    automatizacionGlobal = Boolean(activo);
    console.log(`🚀 Automatización de correos ${automatizacionGlobal ? 'ACTIVADA' : 'DESACTIVADA'}`);
    res.json({ success: true, activo: automatizacionGlobal });
});

// Exportamos una función auxiliar para leer el estado desde el Cron de Vercel
export const obtenerEstadoGlobal = () => automatizacionGlobal;

export default router;