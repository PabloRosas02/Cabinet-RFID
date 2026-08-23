import { ref } from 'vue';
import { HerramientasService } from '@/services/herramientasService'; 
import { comprimirImagenWebP } from '@/utils/imageHelper';
import { useToast } from 'primevue/usetoast';

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
            toast.removeAllGroups();
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las herramientas.', life: 4000 });
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
            herramientaActual.value.imagen = await comprimirImagenWebP(archivo);
        } catch (mensajeError) {
            evento.target.value = ''; 
            toast.removeAllGroups();
            toast.add({ severity: 'error', summary: 'Error de imagen', detail: mensajeError, life: 4000 });
        }
    };

    // GUARDAR (Crear o Actualizar usando el Servicio)
    const guardarHerramienta = async () => {
        try {
            const esActEdicion = esEdicion.value;
            let herramientaGuardada;

            const payload = { ...herramientaActual.value };
            payload.cantidadMinima = parseInt(payload.cantidadMinima || payload.stockMinimo, 10) || 0;
            payload.cantidadDisponible = parseInt(payload.cantidadDisponible || payload.stockFisico, 10) || 0;
            payload.cantidad = payload.cantidadDisponible; // Sincronizamos el total con el disponible

            if (esActEdicion) {
                herramientaGuardada = await HerramientasService.actualizar(payload.id, payload);
            } else {
                herramientaGuardada = await HerramientasService.crear(payload);
            }

            if (esActEdicion) {
                const index = herramientas.value.findIndex(h => h.id === herramientaActual.value.id);
                if (index !== -1) {
                    const nuevaLista = [...herramientas.value];
                    nuevaLista[index] = { 
                        ...nuevaLista[index], 
                        ...payload, 
                        ...(herramientaGuardada || {}) 
                    };
                    herramientas.value = nuevaLista;
                }
            } else {
                herramientas.value = [...herramientas.value, herramientaGuardada || payload];
            }

            mostrarModal.value = false;
            
            const mensajeExito = esActEdicion 
                ? `Herramienta "${herramientaGuardada?.nombre || payload.nombre}" actualizada exitosamente.` 
                : `Herramienta "${herramientaGuardada?.nombre || payload.nombre}" registrada con éxito.`;
            
            toast.removeAllGroups();
            toast.add({ severity: 'success', summary: '¡Éxito!', detail: mensajeExito, life: 3000 });

            return herramientaGuardada;
        } catch (error) {
            console.error("Fallo al guardar herramienta:", error);
            const mensajeError = error.response?.data?.error || error.message || "Error desconocido al contactar al servidor.";
            
            toast.removeAllGroups();
            toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: mensajeError, life: 5000 });
            throw error;
        }
    };

    // ELIMINAR (Soft Delete con Toast dinámico y recepción del motivo)
    const eliminarHerramienta = async (herramienta, datosBaja) => {
        // La confirmación ya se hizo en el Modal de la vista, así que procedemos directo
        try {
            // Se envía el id y el objeto con los motivos al servicio
            await HerramientasService.eliminar(herramienta.id, datosBaja);
            
            herramientas.value = herramientas.value.filter(h => h.id !== herramienta.id);
            
            toast.removeAllGroups();
            toast.add({ 
                severity: 'warn', 
                summary: 'Herramienta dada de baja', 
                detail: `[${herramienta.codigo}] ${herramienta.nombre}`, 
                life: 4000 
            });
            
            return true;
        } catch (error) {
            console.error("Error al eliminar:", error);
            const mensajeError = error.response?.data?.error || error.message || "Error desconocido";
            
            toast.removeAllGroups();
            toast.add({ severity: 'error', summary: 'No se pudo eliminar', detail: mensajeError, life: 4000 });
            return false;
        }
    };

    return {
        herramientas,
        cargando,
        mostrarModal,
        herramientaActual,
        esEdicion,
        cargarHerramientas,
        prepararNuevaHerramienta,
        prepararEdicion,
        procesarImagen,
        guardarHerramienta,
        eliminarHerramienta 
    };
}