import { ref, onMounted } from 'vue';
import axios from 'axios'; // 👈 Importamos axios para usar el interceptor global con el Token

export function useHerramientas() {
    const API_URL = '/api/herramientas';

    // ESTADO
    const herramientas = ref([]);
    const cargando = ref(false);
    
    // CONTROL DEL MODAL
    const mostrarModal = ref(false);
    const herramientaActual = ref({});
    const esEdicion = ref(false);

    const cargarHerramientas = async () => {
        cargando.value = true;
        try {
            const respuesta = await axios.get(API_URL);
            herramientas.value = respuesta.data;
        } catch (error) {
            console.error("Error al cargar herramientas:", error);
            alert("No se pudo cargar el inventario."); 
        } finally {
            cargando.value = false;
        }
    };

    // PREPARAR FORMULARIOS
    const prepararNuevaHerramienta = () => {
        herramientaActual.value = { 
            codigo: '', 
            nombre: '', 
            descripcion: '',
            marca: '',
            tipo: '', 
            ubicacion: '',
            cantidad: 1,
            cantidadDisponible: 1,
            cantidadMinima: 1,
            imagen: null
        };
        esEdicion.value = false;
        mostrarModal.value = true;
    };

    const prepararEdicion = (herramienta) => {
        herramientaActual.value = { ...herramienta };
        esEdicion.value = true;
        mostrarModal.value = true;
    };

    // PROCESAR FOTOGRAFÍA (Base64)
    const procesarImagen = (evento) => {
        const archivo = evento.target.files[0];
        if (archivo) {
            const lector = new FileReader();
            lector.onload = (e) => {
                herramientaActual.value.imagen = e.target.result; 
            };
            lector.readAsDataURL(archivo);
        }
    };

    // GUARDAR (Crear o Actualizar con Axios)
    const guardarHerramienta = async () => {
        try {
            const esActEdicion = esEdicion.value;
            const url = esActEdicion ? `${API_URL}/${herramientaActual.value.id}` : API_URL;

            let respuesta;
            if (esActEdicion) {
                respuesta = await axios.put(url, herramientaActual.value);
            } else {
                respuesta = await axios.post(url, herramientaActual.value);
            }

            const herramientaGuardada = respuesta.data;

            if (esActEdicion) {
                const index = herramientas.value.findIndex(h => h.id === herramientaActual.value.id);
                if (index !== -1) {
                    herramientas.value.splice(index, 1, herramientaGuardada);
                }
            } else {
                herramientas.value = [...herramientas.value, herramientaGuardada];
            }

            mostrarModal.value = false;
        } catch (error) {
            console.error(error);
            const mensajeError = error.response?.data?.error || error.message;
            alert(`Error: ${mensajeError}`);
        }
    };

    // ELIMINAR (Soft Delete con Axios)
    const eliminarHerramienta = async (herramienta) => {
        const confirmado = confirm(`¿Estás seguro de dar de baja la herramienta ${herramienta.codigo} - ${herramienta.nombre}?`);
        if (!confirmado) return;

        try {
            // El token viaja automáticamente, el backend sabrá qué usuario realizó la baja
            await axios.delete(`${API_URL}/${herramienta.id}`);

            // Actualizamos la lista local eliminando la herramienta dada de baja
            herramientas.value = herramientas.value.filter(h => h.id !== herramienta.id);
            
        } catch (error) {
            console.error(error);
            const mensajeError = error.response?.data?.error || error.message;
            alert(`Hubo un problema al intentar dar de baja la herramienta: ${mensajeError}`);
        }
    };

    onMounted(() => {
        cargarHerramientas();
    });

    return {
        herramientas,
        cargando,
        mostrarModal,
        herramientaActual,
        esEdicion,
        prepararNuevaHerramienta,
        prepararEdicion,
        procesarImagen,
        guardarHerramienta,
        eliminarHerramienta 
    };
}