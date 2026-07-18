<script setup>
import { ref } from 'vue';
import Message from 'primevue/message';

// IMPORTAMOS EL COMPONENTE FORMULARIO
import FormularioProducto from '@/components/productos/FomularioProducto.vue'; 

const cargando = ref(false);
const mensajeExito = ref(false);
const mensajeError = ref('');

// Referencia directa al componente hijo para poder acceder a sus métodos
const formRef = ref(null);

const limpiarMensajes = () => {
    mensajeExito.value = false;
    mensajeError.value = '';
};

const mostrarError = (errorMsg) => {
    mensajeError.value = errorMsg;
    mensajeExito.value = false;
};

// 1. Guardar en Base de Datos
const guardarProducto = async (herramientaData) => {
    limpiarMensajes();
    cargando.value = true;
    
    try {
        const respuesta = await fetch('/api/herramientas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(herramientaData)
        });

        if (!respuesta.ok) {
            const errorData = await respuesta.json();
            throw new Error(errorData.error || 'Error al guardar');
        }

        mensajeExito.value = true;
        
        // Retraso ligero visual antes de limpiar el formulario a través de la referencia
        setTimeout(() => {
            if (formRef.value) {
                formRef.value.limpiar();
            }
        }, 500);

    } catch (error) {
        mostrarError(error.message);
    } finally {
        cargando.value = false;
    }
};
</script>

<template>
  <div class="panel-nuevo-producto p-4 border-round-xl shadow-1 max-w-70rem mx-auto mt-4">
    <h2 class="text-2xl font-bold mb-4" style="color: #5ab1ce;">Registrar Nuevo Producto</h2>
    
    <!-- INYECTAMOS EL FORMULARIO -->
    <FormularioProducto 
        ref="formRef"
        :cargando="cargando"
        @guardar="guardarProducto"
        @error="mostrarError"
        @limpiar-mensajes="limpiarMensajes"
    />

    <!-- MENSAJES DE FEEDBACK -->
    <div class="mt-4" v-if="mensajeExito || mensajeError">
        <Message v-if="mensajeExito" severity="success" :closable="false">Producto registrado correctamente.</Message>
        <Message v-if="mensajeError" severity="error" :closable="false">{{ mensajeError }}</Message>
    </div>
  </div>
</template>

<style scoped>
/* CONTENEDOR PRINCIPAL */
.panel-nuevo-producto {
    background-color: #2a323d !important;
    color: #ffffff;
}
</style>