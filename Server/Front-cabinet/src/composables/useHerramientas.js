import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast'; 
import { HerramientasService } from '@/services/herramientasService'; 
import { comprimirImagenWebP } from '@/utils/imageHelper'; // <-- 1. Importamos nuestro ayudante

export function useHerramientas() {
    const toast = useToast(); 

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
            herramientas.value = await HerramientasService.obtenerTodas();
        } catch (error) {
            console.error("Error al cargar herramientas:", error);
            toast.add({ severity: 'error', summary: 'Error de Conexión', detail: 'No se pudo cargar el inventario.', life: 4000 });
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

    // PROCESAR FOTOGRAFÍA 
    const procesarImagen = async (evento) => {
        const archivo = evento.target.files[0];
        if (!archivo) return;

        try {
            // Le pasamos el archivo al helper 
            herramientaActual.value.imagen = await comprimirImagenWebP(archivo);
        } catch (mensajeError) {
            // Si el helper rechaza la imagen (por peso o formato), mostramos el error aquí
            toast.add({ severity: 'error', summary: 'Error de Imagen', detail: mensajeError, life: 5000 });
            evento.target.value = ''; 
        }
    };

    // GUARDAR (Crear o Actualizar usando el Servicio)
    const guardarHerramienta = async () => {
        try {
            const esActEdicion = esEdicion.value;
            let herramientaGuardada;

            if (esActEdicion) {
                herramientaGuardada = await HerramientasService.actualizar(herramientaActual.value.id, herramientaActual.value);
            } else {
                herramientaGuardada = await HerramientasService.crear(herramientaActual.value);
            }

            if (esActEdicion) {
                const index = herramientas.value.findIndex(h => h.id === herramientaActual.value.id);
                if (index !== -1) {
                    herramientas.value.splice(index, 1, herramientaGuardada);
                }
                toast.add({ severity: 'success', summary: 'Herramienta Actualizada', detail: `La herramienta ${herramientaGuardada.codigo} fue modificada con éxito.`, life: 3000 });
            } else {
                herramientas.value = [...herramientas.value, herramientaGuardada];
                toast.add({ severity: 'success', summary: 'Herramienta Creada', detail: `La herramienta ${herramientaGuardada.codigo} se registró exitosamente.`, life: 3000 });
            }

            mostrarModal.value = false;
        } catch (error) {
            console.error(error);
            const mensajeError = error.response?.data?.error || error.message;
            toast.add({ severity: 'error', summary: 'Error al guardar', detail: mensajeError, life: 4000 });
        }
    };

    // ELIMINAR (Soft Delete usando el Servicio)
    const eliminarHerramienta = async (herramienta) => {
        const confirmado = confirm(`¿Estás seguro de dar de baja la herramienta ${herramienta.codigo} - ${herramienta.nombre}?`);
        if (!confirmado) return;

        try {
            await HerramientasService.eliminar(herramienta.id);
            herramientas.value = herramientas.value.filter(h => h.id !== herramienta.id);
            toast.add({ severity: 'success', summary: 'Baja Exitosa', detail: `La herramienta ${herramienta.codigo} fue dada de baja.`, life: 3000 });

        } catch (error) {
            console.error(error);
            const mensajeError = error.response?.data?.error || error.message;
            toast.add({ severity: 'error', summary: 'Error al dar de baja', detail: mensajeError, life: 4000 });
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