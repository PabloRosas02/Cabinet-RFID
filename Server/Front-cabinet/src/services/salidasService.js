import axios from 'axios';

const API_URL = '/api/salidas';

export const SalidasService = {
    
    // 1. Crear una nueva salida (incluye herramientas y motivo)
    crearSalida: async (salidaData) => {
        const respuesta = await axios.post(API_URL, salidaData);
        return respuesta.data;
    },

    // 2. Obtener las salidas que aún tienen herramientas pendientes de devolver
    obtenerPendientes: async () => {
        const respuesta = await axios.get(`${API_URL}/pendientes`);
        return respuesta.data;
    },

    // 3. Procesar una devolución (total o parcial)
    devolver: async (id, devolucionData) => {
        // devolucionData debe contener { herramientasDevueltas: [...] }
        const respuesta = await axios.put(`${API_URL}/${id}/devolver`, devolucionData);
        return respuesta.data;
    },

    // 4. Obtener el historial completo para reportes y auditoría
    obtenerHistorial: async () => {
        const respuesta = await axios.get(`${API_URL}/historial`);
        return respuesta.data;
    },

    // 5. Solicitar código de autorización al administrador por daño o pérdida
    solicitarCodigoDano: async (datosSolicitud) => {
        // datosSolicitud debe contener { administradorId, folio, herramientaNombre, trabajadorNombre, comentario }
        const respuesta = await axios.post(`${API_URL}/solicitar-codigo-dano`, datosSolicitud);
        return respuesta.data;
    }
};