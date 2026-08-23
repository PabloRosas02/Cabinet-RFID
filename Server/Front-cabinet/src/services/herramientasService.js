import axios from 'axios';

const API_URL = '/api/herramientas';

export const HerramientasService = {
    
    // 1. Obtener todas las herramientas activas
    obtenerTodas: async () => {
        const respuesta = await axios.get(API_URL);
        return respuesta.data;
    },

    // 1.5 Obtener el historial de movimientos (Bitácora)
    obtenerBitacora: async () => {
        const respuesta = await axios.get(`${API_URL}/bitacora`);
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

    // 4. Dar de baja lógica a una herramienta (ahora incluye motivo)
    eliminar: async (id, datosBaja) => {
        // Axios requiere que el cuerpo de una petición DELETE vaya dentro de la propiedad "data"
        const respuesta = await axios.delete(`${API_URL}/${id}`, {
            data: datosBaja
        });
        return respuesta.data;
    },

    // 5. Importación masiva desde Excel/CSV
    importar: async (herramientasArray) => {
        // Tu backend espera un objeto con la propiedad "herramientas"
        const respuesta = await axios.post(`${API_URL}/importar`, { 
            herramientas: herramientasArray 
        });
        return respuesta.data;
    }
};