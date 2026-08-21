import { Router } from 'express';
import { cambiarEstadoAutomatizacion, obtenerEstadoAutomatizacion } from '../jobs/cronPendientes.js';

const router = Router();

router.get('/configuracion/automatizacion', (req, res) => {
    res.json({ activo: obtenerEstadoAutomatizacion() });
});

router.post('/configuracion/automatizacion', (req, res) => {
    const { activo } = req.body;
    const nuevoEstado = cambiarEstadoAutomatizacion(Boolean(activo));
    res.json({ success: true, activo: nuevoEstado });
});

export default router;