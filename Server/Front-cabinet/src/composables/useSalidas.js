import { ref } from 'vue';
import { SalidasService } from '@/services/salidasService';
import { useToast } from 'primevue/usetoast';

export function useSalidas() {
    const toast = useToast();

    // ESTADO
    const salidasPendientes = ref([]);
    const historialSalidas = ref([]);
    const cargando = ref(false);
    
    // CONTROL DEL MODAL Y FORMULARIO
    const mostrarModalSalida = ref(false);
    const salidaActual = ref({});
    
    // OPCIONES DE MOTIVOS (Para usar en un Dropdown de PrimeVue)
    const opcionesMotivo = ref([
        { label: 'Fin de vida útil', value: 'fin de vida util' },
        { label: 'Daño por operador', value: 'daño por operador' },
        { label: 'Extravío', value: 'extravio' },
        { label: 'Set up', value: 'set up' },
        { label: 'Mala calidad de la herramienta', value: 'mala calidad de la herramienta' },
        { label: 'Otro', value: 'otro' }
    ]);

    // CARGAR DATOS
    const cargarPendientes = async () => {
        cargando.value = true;
        try {
            salidasPendientes.value = await SalidasService.obtenerPendientes();
        } catch (error) {
            console.error("Error al cargar salidas pendientes:", error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las salidas pendientes.', life: 4000 });
        } finally {
            cargando.value = false;
        }
    };

    const cargarHistorial = async () => {
        cargando.value = true;
        try {
            historialSalidas.value = await SalidasService.obtenerHistorial();
        } catch (error) {
            console.error("Error al cargar historial:", error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial.', life: 4000 });
        } finally {
            cargando.value = false;
        }
    };

    // PREPARAR FORMULARIO DE NUEVA SALIDA
    const prepararNuevaSalida = () => {
        salidaActual.value = { 
            trabajadorNumero: '', 
            trabajadorNombre: '', 
            numeroOrden: '',
            numeroMaquina: '',
            motivo: '',      // <-- Aquí guardaremos el valor seleccionado del Dropdown
            motivoOtro: '',  // <-- Solo se usará si motivo === 'otro'
            herramientas: [] // Array con las herramientas seleccionadas (carrito)
        };
        mostrarModalSalida.value = true;
    };

    // REGISTRAR SALIDA EN EL BACKEND
    const registrarSalida = async () => {
        try {
            // Validación básica en frontend
            if (!salidaActual.value.herramientas.length) {
                toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Agrega al menos una herramienta.', life: 3000 });
                return;
            }
            if (!salidaActual.value.motivo) {
                toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Debes seleccionar un motivo.', life: 3000 });
                return;
            }
            if (salidaActual.value.motivo === 'otro' && !salidaActual.value.motivoOtro.trim()) {
                toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Debes especificar el motivo.', life: 3000 });
                return;
            }

            const payload = { ...salidaActual.value };
            
            // Limpiar "motivoOtro" si el motivo principal no es "otro"
            if (payload.motivo !== 'otro') {
                payload.motivoOtro = null;
            }

            await SalidasService.crearSalida(payload);
            
            mostrarModalSalida.value = false;
            toast.add({ severity: 'success', summary: '¡Éxito!', detail: 'Salida registrada correctamente.', life: 3000 });
            
            // Recargar la tabla de pendientes para reflejar el cambio
            await cargarPendientes();
            
        } catch (error) {
            console.error("Fallo al registrar salida:", error);
            const mensajeError = error.response?.data?.error || error.message || "Error al contactar al servidor.";
            toast.add({ severity: 'error', summary: 'No se pudo registrar', detail: mensajeError, life: 5000 });
        }
    };

    return {
        salidasPendientes,
        historialSalidas,
        cargando,
        mostrarModalSalida,
        salidaActual,
        opcionesMotivo,
        cargarPendientes,
        cargarHistorial,
        prepararNuevaSalida,
        registrarSalida
    };
}