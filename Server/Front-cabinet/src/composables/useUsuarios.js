import { ref, onMounted } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';

export function useUsuarios() {
    const API_URL = '/api/usuarios';
    const toast = useToast();

    const usuarios = ref([]);
    const cargando = ref(false); 
    
    const filtros = ref({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });

    const mostrarModal = ref(false);
    const usuarioActual = ref({});
    const esEdicion = ref(false);

    // Obtener datos al cargar la página
    const cargarUsuarios = async () => {
        cargando.value = true;
        try {
            const respuesta = await axios.get(API_URL);
            usuarios.value = respuesta.data;
        } catch (error) {
            console.error("Error al cargar usuarios:", error);
            toast.add({ severity: 'error', summary: 'Error de conexión', detail: 'No se pudo conectar con la base de datos o sesión expirada.', life: 4000 });
        } finally {
            cargando.value = false;
        }
    };

    // Preparar UI
    const prepararNuevoUsuario = () => {
        usuarioActual.value = { 
            nombre: '', 
            numTrabajador: null, 
            contrasena: '',
            depart: null, 
            rol: null, 
            tarjetaRfid: null 
        };
        esEdicion.value = false;
        mostrarModal.value = true;
    };

    const prepararEdicion = (usuario) => {
        usuarioActual.value = { ...usuario, contrasena: '' };
        esEdicion.value = true;
        mostrarModal.value = true;
    };

    // Guardar (Crear o Actualizar con Axios)
    const guardarUsuario = async () => {
        try {
            const esActEdicion = esEdicion.value;
            const url = esActEdicion ? `${API_URL}/${usuarioActual.value.id}` : API_URL;

            let respuesta;
            if (esActEdicion) {
                respuesta = await axios.put(url, usuarioActual.value);
            } else {
                respuesta = await axios.post(url, usuarioActual.value);
            }

            const usuarioGuardado = respuesta.data;

            // Actualizar la tabla localmente y mostrar Toast
            if (esActEdicion) {
                const index = usuarios.value.findIndex(u => u.id === usuarioActual.value.id);
                if (index !== -1) {
                    usuarios.value.splice(index, 1, usuarioGuardado);
                }
                toast.add({ severity: 'success', summary: 'Usuario Actualizado', detail: `El empleado ${usuarioGuardado.nombre} ha sido modificado.`, life: 3000 });
            } else {
                usuarios.value = [...usuarios.value, usuarioGuardado];
                toast.add({ severity: 'success', summary: 'Usuario Creado', detail: `El empleado ${usuarioGuardado.nombre} fue registrado exitosamente.`, life: 3000 });
            }

            mostrarModal.value = false;
        } catch (error) {
            console.error(error);
            const mensajeError = error.response?.data?.error || error.message;
            toast.add({ severity: 'error', summary: 'Error al guardar', detail: mensajeError, life: 4000 });
        }
    };

    // Eliminar con Axios
    const eliminarUsuario = async (usuario) => {
        const confirmado = confirm(`¿Estás seguro de dar de baja al trabajador ${usuario.numTrabajador}?`);
        if (!confirmado) return;

        try {
            await axios.delete(`${API_URL}/${usuario.id}`);

            // Quitar de la tabla localmente
            usuarios.value = usuarios.value.filter(u => u.id !== usuario.id);
            
            toast.add({ severity: 'success', summary: 'Baja Exitosa', detail: `El trabajador ${usuario.numTrabajador} fue dado de baja.`, life: 3000 });
        } catch (error) {
            console.error(error);
            const mensajeError = error.response?.data?.error || error.message;
            toast.add({ severity: 'error', summary: 'Error al eliminar', detail: mensajeError, life: 4000 });
        }
    };

    // Se ejecuta automáticamente en cuanto el componente Vue se monta en pantalla
    onMounted(() => {
        cargarUsuarios();
    });

    return {
        usuarios,
        cargando,
        filtros,
        mostrarModal,
        usuarioActual,
        esEdicion,
        prepararNuevoUsuario,
        prepararEdicion,
        guardarUsuario,
        eliminarUsuario
    };
}