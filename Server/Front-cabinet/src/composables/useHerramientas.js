import { ref } from 'vue';
import { HerramientasService } from '@/services/herramientasService'; 
import { comprimirImagenWebP } from '@/utils/imageHelper';
import { useToast } from 'primevue/usetoast';

export function useHerramientas() {
    const toast = useToast();

    // ESTADO
    const herramientas = ref([]);
    const cargando = ref(false);
    const totalRegistros = ref(0);
    const paginaActual = ref(1);
    
    // CONTROL DEL MODAL
    const mostrarModal = ref(false);
    const herramientaActual = ref({});
    const esEdicion = ref(false);

    // CARGAR HERRAMIENTAS (Soporta paginación y búsqueda backend)
    const cargarHerramientas = async (params = {}) => {
        cargando.value = true;
        try {
            const respuesta = await HerramientasService.obtenerTodas(params);
            
            // Extraer la carga util sin importar si el service retorna res o res.data
            const payload = respuesta?.data?.data !== undefined ? respuesta.data : respuesta;
            
            if (payload && Array.isArray(payload.data)) {
                herramientas.value = payload.data;
                totalRegistros.value = payload.meta?.total 
                    ?? payload.total 
                    ?? payload.totalRecords 
                    ?? payload.data.length;
                    
                paginaActual.value = payload.meta?.page ?? payload.page ?? 1;
            } else if (Array.isArray(payload)) {
                herramientas.value = payload;
                totalRegistros.value = payload.length;
            }
        } catch (error) {
            console.error("Error al cargar herramientas:", error);
            toast.removeAllGroups();
            toast.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: error.response?.data?.error || 'No se pudieron cargar las herramientas.', 
                life: 4000 
            });
        } finally {
            cargando.value = false;
        }
    };

    // IMPORTACIÓN MASIVA DESDE ARCHIVO
    const importarHerramientas = async (herramientasArray) => {
        cargando.value = true;
        try {
            const respuesta = await HerramientasService.importar(herramientasArray);
            
            toast.removeAllGroups();
            toast.add({ 
                severity: 'success', 
                summary: '¡Importación Exitosa!', 
                detail: `Creados: ${respuesta.creados} | Actualizados: ${respuesta.actualizados}`, 
                life: 4000 
            });

            if (respuesta.advertencias && respuesta.advertencias.length > 0) {
                respuesta.advertencias.forEach(adv => {
                    toast.add({ severity: 'warn', summary: 'Omitido', detail: adv, life: 5000 });
                });
            }

            // Recargar la lista actual
            await cargarHerramientas({ page: paginaActual.value });
            return respuesta;
        } catch (error) {
            console.error("Error al importar herramientas:", error);
            const mensajeError = error.response?.data?.error || error.message || "Error al procesar la importación.";
            
            toast.removeAllGroups();
            toast.add({ severity: 'error', summary: 'Error de Importación', detail: mensajeError, life: 5000 });
            throw error;
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
            cantidadMinima: 0,
            cantidadMaxima: 0,
            esDesechable: false,
            imagen: null
        };
        esEdicion.value = false;
        mostrarModal.value = true;
    };

    const prepararEdicion = (herramientaSeleccionada) => {
        const hActual = herramientas.value.find(h => h.id === herramientaSeleccionada.id) || herramientaSeleccionada;

        herramientaActual.value = { 
            ...hActual,
            cantidadMinima: hActual.cantidadMinima ?? hActual.stockMinimo ?? 0,
            cantidadMaxima: hActual.cantidadMaxima ?? hActual.stockMaximo ?? 0,
            cantidadDisponible: hActual.cantidadDisponible ?? hActual.stockFisico ?? 0,
            cantidad: hActual.cantidad ?? hActual.stockTotal ?? 0,
            esDesechable: Boolean(hActual.esDesechable)
        };
        
        esEdicion.value = true;
        mostrarModal.value = true;
    };

    // PROCESAR FOTOGRAFÍA 
    const procesarImagen = async (evento) => {
        const archivo = evento.target?.files?.[0] || evento;
        if (!archivo || !(archivo instanceof File)) return;

        try {
            herramientaActual.value.imagen = await comprimirImagenWebP(archivo);
        } catch (mensajeError) {
            if (evento.target) evento.target.value = ''; 
            toast.removeAllGroups();
            toast.add({ severity: 'error', summary: 'Error de imagen', detail: mensajeError, life: 4000 });
        }
    };

    // GUARDAR (Crear o Actualizar)
    const guardarHerramienta = async () => {
        try {
            const esActEdicion = esEdicion.value;
            let herramientaGuardada;

            const payload = { 
                ...herramientaActual.value,
                cantidadMinima: parseInt(herramientaActual.value.cantidadMinima ?? 0, 10),
                cantidadMaxima: parseInt(herramientaActual.value.cantidadMaxima ?? 0, 10),
                cantidadDisponible: parseInt(herramientaActual.value.cantidadDisponible ?? 0, 10),
                esDesechable: Boolean(herramientaActual.value.esDesechable)
            };
            
            if (!esActEdicion) {
                payload.cantidad = payload.cantidadDisponible; 
            }

            if (esActEdicion) {
                herramientaGuardada = await HerramientasService.actualizar(payload.id, payload);
            } else {
                herramientaGuardada = await HerramientasService.crear(payload);
            }

            mostrarModal.value = false;
            
            const mensajeExito = esActEdicion 
                ? `Herramienta "${herramientaGuardada?.nombre || payload.nombre}" actualizada exitosamente.` 
                : `Herramienta "${herramientaGuardada?.nombre || payload.nombre}" registrada con éxito.`;
            
            toast.removeAllGroups();
            toast.add({ severity: 'success', summary: '¡Éxito!', detail: mensajeExito, life: 3000 });

            // Recargamos el listado para reflejar los cambios exactos del backend
            await cargarHerramientas({ page: paginaActual.value });

            return herramientaGuardada;
        } catch (error) {
            console.error("Fallo al guardar herramienta:", error);
            const mensajeError = error.response?.data?.error || error.message || "Error desconocido al contactar al servidor.";
            
            toast.removeAllGroups();
            toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: mensajeError, life: 5000 });
            throw error;
        }
    };

    // ELIMINAR (Soft Delete)
    const eliminarHerramienta = async (herramienta, datosBaja) => {
        try {
            await HerramientasService.eliminar(herramienta.id, datosBaja);
            
            toast.removeAllGroups();
            toast.add({ 
                severity: 'warn', 
                summary: 'Herramienta dada de baja', 
                detail: `[${herramienta.codigo}] ${herramienta.nombre}`, 
                life: 4000 
            });
            
            await cargarHerramientas({ page: paginaActual.value });
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
        totalRegistros,
        paginaActual,
        mostrarModal,
        herramientaActual,
        esEdicion,
        cargarHerramientas,
        prepararNuevaHerramienta,
        prepararEdicion,
        procesarImagen,
        guardarHerramienta,
        eliminarHerramienta,
        importarHerramientas
    };
}