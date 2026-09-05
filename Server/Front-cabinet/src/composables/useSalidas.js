import { ref } from 'vue';
import { SalidasService } from '@/services/salidasService';
import { useToast } from 'primevue/usetoast';

export function useSalidas() {
    const toast = useToast();

    // ESTADO
    const salidasPendientes = ref([]);
    const historialSalidas = ref([]);
    const cargando = ref(false);
    
    // CONTROL DE MODALES Y FORMULARIOS
    const mostrarModalSalida = ref(false);
    const mostrarModalDevolucion = ref(false);
    const salidaActual = ref({});
    const hashAutorizacion = ref(null); 
    
    // OPCIONES DE MOTIVOS 
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
            motivo: '',      
            motivoOtro: '',  
            herramientas: [] 
        };
        mostrarModalSalida.value = true;
    };

    // REGISTRAR SALIDA EN EL BACKEND
    const registrarSalida = async () => {
        try {
            if (!salidaActual.value.herramientas.length) {
                toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Agrega al menos una herramienta.', life: 3000 });
                return;
            }
            if (!salidaActual.value.motivo) {
                toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Debes seleccionar un motivo.', life: 3000 });
                return;
            }

            const motivoNormalizado = String(salidaActual.value.motivo).trim().toLowerCase();
            const esOtro = ['otro', 'other'].includes(motivoNormalizado);

            if (esOtro && (!salidaActual.value.motivoOtro || !salidaActual.value.motivoOtro.trim())) {
                toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Debes especificar el motivo.', life: 3000 });
                return;
            }

            const usuarioSesion = JSON.parse(localStorage.getItem('usuario')) || JSON.parse(localStorage.getItem('usuarioActivo'));

            if (!usuarioSesion || !usuarioSesion.id) {
                toast.add({ severity: 'error', summary: 'Error de sesión', detail: 'No se encontró la sesión del usuario para registrar el préstamo.', life: 4000 });
                return;
            }

            const payload = { 
                ...salidaActual.value,
                motivo: esOtro ? 'Otro' : salidaActual.value.motivo,
                motivoOtro: esOtro ? salidaActual.value.motivoOtro.trim() : null,
                prestadorId: usuarioSesion.id 
            };

            await SalidasService.crearSalida(payload);
            
            mostrarModalSalida.value = false;

            toast.removeAllGroups();
            toast.add({ severity: 'success', summary: '¡Éxito!', detail: 'Salida registrada correctamente.', life: 3000 });
            
            // Recarga ambas listas para reflejar tanto préstamos pendientes como salidas consumidas
            await Promise.all([
                cargarPendientes(),
                cargarHistorial()
            ]);
            
        } catch (error) {
            console.error("Fallo al registrar salida:", error);
            const mensajeError = error.response?.data?.error || error.message || "Error al contactar al servidor.";
            
            toast.removeAllGroups();
            toast.add({ severity: 'error', summary: 'No se pudo registrar', detail: mensajeError, life: 5000 });
        }
    };

    // PROCESAR DEVOLUCIÓN
    const registrarDevolucion = async (salidaId, herramientasDevueltas) => {
        try {
            await SalidasService.devolver(salidaId, { herramientasDevueltas });
            
            toast.add({ severity: 'success', summary: '¡Éxito!', detail: 'Devolución procesada correctamente.', life: 3000 });
            mostrarModalDevolucion.value = false;
            
            await Promise.all([
                cargarPendientes(),
                cargarHistorial()
            ]);

        } catch (error) {
            console.error("Fallo al registrar devolución:", error);
            const mensajeError = error.response?.data?.error || error.message || "Error al procesar la devolución.";
            toast.add({ severity: 'error', summary: 'Error', detail: mensajeError, life: 5000 });
            throw error; 
        }
    };

    // SOLICITAR CÓDIGO DE AUTORIZACIÓN PARA DAÑOS
    const solicitarCodigoDano = async (datosSolicitud) => {
        try {
            const respuesta = await SalidasService.solicitarCodigoDano(datosSolicitud);
            
            hashAutorizacion.value = respuesta.hashValidacion;
            
            toast.add({ severity: 'info', summary: 'Código Enviado', detail: respuesta.mensaje, life: 5000 });
            return respuesta;

        } catch (error) {
            console.error("Error al solicitar código:", error);
            const mensajeError = error.response?.data?.error || error.message || "Error al solicitar autorización.";
            toast.add({ severity: 'error', summary: 'Error', detail: mensajeError, life: 5000 });
            throw error;
        }
    };

    return {
        salidasPendientes,
        historialSalidas,
        cargando,
        mostrarModalSalida,
        mostrarModalDevolucion,
        salidaActual,
        hashAutorizacion,
        opcionesMotivo,
        cargarPendientes,
        cargarHistorial,
        prepararNuevaSalida,
        registrarSalida,
        registrarDevolucion,
        solicitarCodigoDano
    };
}