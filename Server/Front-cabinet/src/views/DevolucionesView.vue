<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Message from 'primevue/message';

import TablaPedidos from '@/components/devoluciones/TablaDevoluciones.vue';
import ModalDevolucion from '@/components/devoluciones/ModalDevolucion.vue';

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
        const usuarioSesion = JSON.parse(localStorage.getItem('usuarioActivo')) || JSON.parse(localStorage.getItem('usuario'));

        // Añadimos los parámetros para que el backend filtre según el rol
        const response = await axios.get('/api/pedidos/pendientes', {
            params: {
                usuarioId: usuarioSesion?.id,
                rol: usuarioSesion?.rol
            }
        }); 
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

const revisarDevolucion = (pedido) => {
    pedidoSeleccionado.value = pedido;
    mostrarModal.value = true;
};

const confirmarDevolucion = async (pedidoModificado) => {
    procesandoDevolucion.value = true;
    try {
        const usuarioSesion = JSON.parse(localStorage.getItem('usuario')) || JSON.parse(localStorage.getItem('usuarioActivo'));

        if (!usuarioSesion || !usuarioSesion.id) {
            throw new Error('No se encontró una sesión activa. Por favor, vuelve a iniciar sesión.');
        }

        const payload = {
            receptorId: usuarioSesion.id, 
            herramientasDevueltas: pedidoModificado.herramientas
                .filter(h => h.cantidadARegresar > 0)
                .map(h => ({
                    detalleId: h.detalleId,
                    cantidad: h.cantidadARegresar
                }))
        };

        if (payload.herramientasDevueltas.length === 0) {
            throw new Error('Debes seleccionar al menos una herramienta válida para devolver.');
        }

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
        setTimeout(() => { mensajeFeedback.value.visible = false; }, 4000);
    } finally {
        procesandoDevolucion.value = false;
    }
};
</script>

<template>
  <div class="panel-principal p-3 md:p-4 border-round-xl shadow-1 mt-4">
    <div class="flex justify-content-between align-items-center mb-4">
        <h2 class="text-xl md:text-2xl font-bold m-0" style="color: #5ab1ce;">Devolución de Herramientas</h2>
    </div>

    <!-- Mensaje de éxito/error -->
    <Message v-if="mensajeFeedback.visible" :severity="mensajeFeedback.tipo" class="mb-4" :closable="false">
        {{ mensajeFeedback.texto }}
    </Message>

    <TablaPedidos 
        :pedidos="pedidosPendientes" 
        :cargando="cargando"
        @revisar="revisarDevolucion" 
    />

    <ModalDevolucion 
        :mostrar="mostrarModal"
        :pedido="pedidoSeleccionado"
        :procesando="procesandoDevolucion"
        @cerrar="mostrarModal = false"
        @confirmar="confirmarDevolucion"
    />
  </div>
</template>