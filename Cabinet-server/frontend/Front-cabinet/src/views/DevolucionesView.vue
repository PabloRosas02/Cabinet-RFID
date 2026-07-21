<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Message from 'primevue/message';

// IMPORTAMOS LOS COMPONENTES
import TablaPedidos from '@/components/devoluciones/TablaPedidos.vue';
import ModalDevolucion from '@/components/devoluciones/ModalDevolucion.vue';

// ESTADOS REACTIVOS
const pedidosPendientes = ref([]);
const cargando = ref(false);

const mostrarModal = ref(false);
const pedidoSeleccionado = ref(null);
const procesandoDevolucion = ref(false);
const mensajeFeedback = ref({ visible: false, texto: '', tipo: 'success' });

// Cargar pedidos
const cargarPedidosPendientes = async () => {
    cargando.value = true;
    try {
        const response = await axios.get('/api/pedidos/pendientes'); 
        pedidosPendientes.value = response.data;
    } catch (error) {
        console.error("Error al cargar pedidos pendientes:", error);
    } finally {
        cargando.value = false;
    }
};

onMounted(() => {
    cargarPedidosPendientes();
});

// Abrir Modal (Activado por el componente hijo TablaPedidos)
const revisarDevolucion = (pedido) => {
    pedidoSeleccionado.value = pedido;
    mostrarModal.value = true;
};

// Confirmar (Activado por el componente hijo ModalDevolucion)
const confirmarDevolucion = async (pedidoModificado) => {
    procesandoDevolucion.value = true;
    try {
        // Recuperamos el usuario logueado desde el localStorage
        const usuarioSesion = JSON.parse(localStorage.getItem('usuario')) || JSON.parse(localStorage.getItem('usuarioActivo'));

        if (!usuarioSesion || !usuarioSesion.id) {
            throw new Error('No se encontró una sesión activa. Por favor, vuelve a iniciar sesión.');
        }

        const payload = {
            receptorId: usuarioSesion.id, // ID del almacenista en turno que recibe la devolución
            herramientasDevueltas: pedidoModificado.herramientas.map(h => ({
                detalleId: h.detalleId,
                cantidad: h.cantidadARegresar
            }))
        };

        await axios.put(`/api/pedidos/${pedidoModificado.id}/devolver`, payload);
        
        mensajeFeedback.value = { visible: true, texto: '¡Devolución registrada con éxito!', tipo: 'success' };
        mostrarModal.value = false;
        
        await cargarPedidosPendientes();
        
        setTimeout(() => { mensajeFeedback.value.visible = false; }, 3000);

    } catch (error) {
        console.error("Error al procesar la devolución:", error);
        mensajeFeedback.value = { 
            visible: true, 
            texto: error.response?.data?.error || error.message || 'Error al procesar la devolución.', 
            tipo: 'error' 
        };
    } finally {
        procesandoDevolucion.value = false;
    }
};
</script>

<template>
  <div class="panel-principal p-4 border-round-xl shadow-1 mt-4">
    <div class="flex justify-content-between align-items-center mb-4">
        <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">Devolución de Herramientas</h2>
    </div>

    <!-- Mensaje de éxito/error -->
    <Message v-if="mensajeFeedback.visible" :severity="mensajeFeedback.tipo" class="mb-4" :closable="false">
        {{ mensajeFeedback.texto }}
    </Message>

    <!-- INYECTAMOS LA TABLA -->
    <TablaPedidos 
        :pedidos="pedidosPendientes" 
        :cargando="cargando"
        @revisar="revisarDevolucion" 
    />

    <!-- INYECTAMOS EL MODAL -->
    <ModalDevolucion 
        :mostrar="mostrarModal"
        :pedido="pedidoSeleccionado"
        :procesando="procesandoDevolucion"
        @cerrar="mostrarModal = false"
        @confirmar="confirmarDevolucion"
    />
  </div>
</template>

<style scoped>
.panel-principal {
    background-color: #2a323d !important;
    color: #ffffff;
}
</style>