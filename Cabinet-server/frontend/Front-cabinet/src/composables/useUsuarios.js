import { ref, onMounted } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';

export function useUsuarios() {
    // URL de tu backend (ajusta el puerto si es necesario)
    const API_URL = 'http://localhost:3000/api/usuarios';

    // 1. ESTADO
    const usuarios = ref([]);
    const cargando = ref(false); // Para mostrar un spinner si la red es lenta
    
    const filtros = ref({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });

    const mostrarModal = ref(false);
    const usuarioActual = ref({});
    const esEdicion = ref(false);

    // 2. ACCIONES (Llamadas HTTP)

    // Obtener datos al cargar la página
    const cargarUsuarios = async () => {
        cargando.value = true;
        try {
            const respuesta = await fetch(API_URL);
            if (!respuesta.ok) throw new Error('Error de red');
            const data = await respuesta.json();
            usuarios.value = data;
        } catch (error) {
            console.error("Error al cargar usuarios:", error);
            alert("No se pudo conectar con la base de datos.");
        } finally {
            cargando.value = false;
        }
    };

    // Preparar UI
    const prepararNuevoUsuario = () => {
        usuarioActual.value = { nombre: '', numTrabajador: null, depart: null, rol: null, tarjetaRfid: null };
        esEdicion.value = false;
        mostrarModal.value = true;
    };

    const prepararEdicion = (usuario) => {
        usuarioActual.value = { ...usuario };
        esEdicion.value = true;
        mostrarModal.value = true;
    };

    // Guardar (Crear o Actualizar)
    const guardarUsuario = async () => {
        try {
            const metodo = esEdicion.value ? 'PUT' : 'POST';
            const url = esEdicion.value ? `${API_URL}/${usuarioActual.value.id}` : API_URL;

            const respuesta = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(usuarioActual.value)
            });

            if (!respuesta.ok) {
                const errorData = await respuesta.json();
                throw new Error(errorData.error || 'Error al guardar');
            }

            const usuarioGuardado = await respuesta.json();

            // Actualizar la tabla localmente para no hacer otra petición GET innecesaria
            if (esEdicion.value) {
                const index = usuarios.value.findIndex(u => u.id === usuarioActual.value.id);
                if (index !== -1) {
                    usuarios.value.splice(index, 1, usuarioGuardado);
                }
            } else {
                usuarios.value = [...usuarios.value, usuarioGuardado];
            }

            mostrarModal.value = false;
        } catch (error) {
            console.error(error);
            alert(`Error: ${error.message}`);
        }
    };

    // Eliminar
    const eliminarUsuario = async (usuario) => {
        const confirmado = confirm(`¿Estás seguro de dar de baja al trabajador ${usuario.numTrabajador}?`);
        if (!confirmado) return;

        try {
            const respuesta = await fetch(`${API_URL}/${usuario.id}`, {
                method: 'DELETE'
            });

            if (!respuesta.ok) throw new Error('Error al eliminar');

            // Quitar de la tabla localmente
            usuarios.value = usuarios.value.filter(u => u.id !== usuario.id);
        } catch (error) {
            console.error(error);
            alert("Hubo un problema al intentar eliminar el usuario.");
        }
    };

    // 3. CICLO DE VIDA
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