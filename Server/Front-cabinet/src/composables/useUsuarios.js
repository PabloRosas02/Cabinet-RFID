import { ref, onMounted, computed } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';

export function useUsuarios() {
    const API_URL = '/api/usuarios';
    const toast = useToast();

    const usuarios = ref([]);
    const metaPaginacion = ref({});
    const cargando = ref(false); 
    
    const filtros = ref({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });

    const mostrarModal = ref(false);
    const usuarioActual = ref({});
    const esEdicion = ref(false);

    // Filtrar administradores para los selectores de autorización
    const administradores = computed(() => 
        Array.isArray(usuarios.value) ? usuarios.value.filter(u => u.rol === 'ADMINISTRADOR') : []
    );

    // Obtener datos al cargar la página (Soporta la nueva estructura paginada { data, meta })
    // En useUsuarios.js
    const cargarUsuarios = async () => {
        cargando.value = true;
        try {
            // Solicitamos un límite alto al backend
            const respuesta = await axios.get(API_URL, {
                params: { limit: 100 } 
            });
            
            if (respuesta.data && Array.isArray(respuesta.data.data)) {
                usuarios.value = respuesta.data.data;
                metaPaginacion.value = respuesta.data.meta || {};
            }
        } catch (error) {
            console.error("Error al cargar usuarios:", error);
        } finally {
            cargando.value = false;
        }
    };

    // Preparar UI (Incluye los nuevos campos: correo y telefono)
    const prepararNuevoUsuario = () => {
        usuarioActual.value = { 
            nombre: '', 
            numTrabajador: null, 
            correo: '',
            telefono: '',
            contrasena: '',
            depart: null, 
            rol: null, 
            tarjetaRfid: null 
        };
        esEdicion.value = false;
        mostrarModal.value = true;
    };

    const prepararEdicion = (usuario) => {
        usuarioActual.value = { 
            ...usuario, 
            correo: usuario.correo || '',
            telefono: usuario.telefono || '',
            contrasena: '' 
        };
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
                toast.add({ 
                    severity: 'success', 
                    summary: 'Usuario Actualizado', 
                    detail: `El empleado ${usuarioGuardado.nombre} ha sido modificado.`, 
                    life: 3000 
                });
            } else {
                usuarios.value = [usuarioGuardado, ...usuarios.value];
                toast.add({ 
                    severity: 'success', 
                    summary: 'Usuario Creado', 
                    detail: `El empleado ${usuarioGuardado.nombre} fue registrado exitosamente.`, 
                    life: 3000 
                });
            }

            mostrarModal.value = false;
        } catch (error) {
            console.error(error);
            const mensajeError = error.response?.data?.error || error.message;
            toast.add({ 
                severity: 'error', 
                summary: 'Error al guardar', 
                detail: mensajeError, 
                life: 4000 
            });
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
            
            toast.add({ 
                severity: 'success', 
                summary: 'Baja Exitosa', 
                detail: `El trabajador ${usuario.numTrabajador} fue dado de baja.`, 
                life: 3000 
            });
        } catch (error) {
            console.error(error);
            const mensajeError = error.response?.data?.error || error.message;
            toast.add({ 
                severity: 'error', 
                summary: 'Error al eliminar', 
                detail: mensajeError, 
                life: 4000 
            });
        }
    };

    onMounted(() => {
        cargarUsuarios();
    });

    return {
        usuarios,
        metaPaginacion,
        administradores, 
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