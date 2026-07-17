import { ref, onMounted } from 'vue';

export function useHerramientas() {
    const API_URL = 'http://localhost:3000/api/herramientas';

    // ESTADO
    const herramientas = ref([]);
    const cargando = ref(false);
    
    // CONTROL DEL MODAL
    const mostrarModal = ref(false);
    const herramientaActual = ref({});
    const esEdicion = ref(false);

    // OBTENER DATOS
    const cargarHerramientas = async () => {
        cargando.value = true;
        try {
            const respuesta = await fetch(API_URL);
            if (!respuesta.ok) throw new Error('Error al conectar con el servidor');
            
            const data = await respuesta.json();
            herramientas.value = data;
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

    // GUARDAR (Crear o Actualizar)
    const guardarHerramienta = async () => {
        try {
            const metodo = esEdicion.value ? 'PUT' : 'POST';
            const url = esEdicion.value ? `${API_URL}/${herramientaActual.value.id}` : API_URL;

            const respuesta = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(herramientaActual.value)
            });

            if (!respuesta.ok) {
                const errorData = await respuesta.json();
                throw new Error(errorData.error || 'Error al guardar la herramienta');
            }

            const herramientaGuardada = await respuesta.json();

            if (esEdicion.value) {
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
            alert(`Error: ${error.message}`);
        }
    };

    // ELIMINAR (Soft Delete)
    const eliminarHerramienta = async (herramienta) => {
        const confirmado = confirm(`¿Estás seguro de dar de baja la herramienta ${herramienta.codigo} - ${herramienta.nombre}?`);
        if (!confirmado) return;

        try {
            const respuesta = await fetch(`${API_URL}/${herramienta.id}`, {
                method: 'DELETE'
            });

            if (!respuesta.ok) throw new Error('Error al dar de baja');

            herramientas.value = herramientas.value.filter(h => h.id !== herramienta.id);
        } catch (error) {
            console.error(error);
            alert("Hubo un problema al intentar dar de baja la herramienta.");
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