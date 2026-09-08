<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Message from 'primevue/message';
import { useI18n } from 'vue-i18n'; 

import TablaPedidos from '@/components/devoluciones/TablaDevoluciones.vue';
import ModalDevolucion from '@/components/devoluciones/ModalDevolucion.vue';

const { t } = useI18n();

const pedidosPendientes = ref([]);
const cargando = ref(false);

const mostrarModal = ref(false);
const pedidoSeleccionado = ref(null);
const procesandoDevolucion = ref(false);
const mensajeFeedback = ref({ visible: false, texto: '', tipo: 'success' });

const cargarPedidosPendientes = async () => {
    cargando.value = true;
    try {
        const usuarioSesion = JSON.parse(localStorage.getItem('usuarioActivo')) || JSON.parse(localStorage.getItem('usuario'));

        const response = await axios.get('/api/salidas/pendientes', {
            params: {
                usuarioId: usuarioSesion?.id,
                rol: usuarioSesion?.rol
            }
        }); 
        pedidosPendientes.value = response.data;
    } catch (error) {
        console.error("Error al cargar las salidas pendientes:", error);
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

const confirmarDevolucion = async (datosEmitidos) => {
    procesandoDevolucion.value = true;
    try {
        const usuarioSesion = JSON.parse(localStorage.getItem('usuarioActivo')) || JSON.parse(localStorage.getItem('usuario'));

        if (!usuarioSesion || !usuarioSesion.id) {
            throw new Error(t('view_devoluciones.error_sesion'));
        }

        const payloadFinal = {
            receptorId: usuarioSesion.id, 
            herramientasDevueltas: datosEmitidos.payload.herramientasDevueltas
        };

        if (payloadFinal.herramientasDevueltas.length === 0) {
            throw new Error(t('view_devoluciones.error_herramienta_invalida'));
        }

        await axios.put(`/api/salidas/${datosEmitidos.salidaId}/devolver`, payloadFinal);
        
        mensajeFeedback.value = { visible: true, texto: t('view_devoluciones.exito_devolucion'), tipo: 'success' };
        mostrarModal.value = false;
        
        await cargarPedidosPendientes();
        
        setTimeout(() => { mensajeFeedback.value.visible = false; }, 3000);

    } catch (error) {
        console.error("Error al procesar la devolución:", error);
        
        mensajeFeedback.value = { 
            visible: true, 
            texto: error.response?.data?.error || error.message || t('view_devoluciones.error_procesar'), 
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
        <h2 class="text-xl md:text-2xl font-bold m-0" style="color: #5ab1ce;">{{ t('view_devoluciones.titulo') }}</h2>
    </div>

    <Message v-if="mensajeFeedback.visible" :severity="mensajeFeedback.tipo" class="mb-4" :closable="false">
        {{ mensajeFeedback.texto }}
    </Message>

    <TablaPedidos 
        :salidas="pedidosPendientes" 
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