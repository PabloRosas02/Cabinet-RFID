import axios from 'axios';

const API_URL = '/api/herramientas';

export const HerramientasService = {
    
    // 1. Obtener herramientas activas (Soporta paginación: page, limit y búsqueda: search)
    obtenerTodas: async (params = {}) => {
        const respuesta = await axios.get(API_URL, { params });
        return respuesta.data;
    },

    // 1.5 Obtener la bitácora de movimientos (Soporta paginación y búsqueda)
    obtenerBitacora: async (params = {}) => {
        const respuesta = await axios.get(`${API_URL}/bitacora`, { params });
        return respuesta.data;
    },

    // 2. Crear una nueva herramienta
    crear: async (herramientaData) => {
        const respuesta = await axios.post(API_URL, herramientaData);
        return respuesta.data;
    },

    // 3. Actualizar una herramienta existente
    actualizar: async (id, herramientaData) => {
        const respuesta = await axios.put(`${API_URL}/${id}`, herramientaData);
        return respuesta.data;
    },

    // 4. Dar de baja lógica a una herramienta enviando motivo y motivoOtro
    eliminar: async (id, datosBaja) => {
        const respuesta = await axios.delete(`${API_URL}/${id}`, {
            data: datosBaja
        });
        return respuesta.data;
    },

    // 5. Importación masiva de herramientas
    importar: async (herramientasArray) => {
        const respuesta = await axios.post(`${API_URL}/importar`, { 
            herramientas: herramientasArray 
        });
        return respuesta.data;
    }
};