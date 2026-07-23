<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router'; 
import { FilterMatchMode } from '@primevue/core/api';
import { useHerramientas } from '@/composables/useHerramientas';

import Button from 'primevue/button';
import Toolbar from 'primevue/toolbar';
import InputText from 'primevue/inputtext';

import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

import TablaHerramientas from '@/components/herramientas/TablaHerramientas.vue';
import FormularioHerramienta from '@/components/herramientas/FormularioHerramientas.vue';

const router = useRouter(); 
const { 
    herramientas, cargando, mostrarModal, herramientaActual, esEdicion, 
    prepararEdicion, guardarHerramienta, eliminarHerramienta 
} = useHerramientas();

const herramientaSeleccionada = ref(null);
const filtros = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const manejarSeleccion = (seleccion) => {
    herramientaSeleccionada.value = seleccion;
};

const prepararEdicionSeleccionada = () => {
    if (herramientaSeleccionada.value) {
        prepararEdicion(herramientaSeleccionada.value);
    }
};

const eliminarSeleccionada = async () => {
    if (herramientaSeleccionada.value) {
        await eliminarHerramienta(herramientaSeleccionada.value);
        herramientaSeleccionada.value = null; 
    }
};

// <-- FUNCIÓN PARA VOLVER AL INVENTARIO PRINCIPAL -->
const volverAInventario = () => {
    router.push('/inventario');
};
</script>

<template>
  <div class="panel-movimientos p-4 border-round-xl shadow-1">
    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">Administración y Movimientos</h2>
    </div>

    <!-- Toolbar oscura integrada -->
    <Toolbar class="mb-4 border-none toolbar-oscuro p-3">
      <template #start>
        <!-- NUEVO BOTÓN: Volver al Inventario -->
        <Button 
            icon="pi pi-arrow-left" 
            label="Volver" 
            class="mr-4 btn-volver" 
            outlined 
            @click="volverAInventario" 
        />

        <Button 
            label="Editar Seleccionado" 
            icon="pi pi-pencil" 
            severity="info" 
            class="mr-2 font-bold btn-editar" 
            :disabled="!herramientaSeleccionada" 
            @click="prepararEdicionSeleccionada" 
        />
        
        <Button 
            label="Dar de Baja (Eliminar)" 
            icon="pi pi-trash" 
            severity="danger" 
            class="font-bold btn-eliminar" 
            :disabled="!herramientaSeleccionada" 
            @click="eliminarSeleccionada" 
        />
      </template>
      <template #end>
        <!-- Buscador -->
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search" />
          <InputText v-model="filtros['global'].value" placeholder="Buscar para editar..." class="input-oscuro" />
        </IconField>
      </template>
    </Toolbar>

    <TablaHerramientas
      :herramientas="herramientas"
      :cargando="cargando"
      :filtros="filtros"
      @seleccion="manejarSeleccion"
    />

    <FormularioHerramienta
      v-model:visible="mostrarModal"
      :herramienta="herramientaActual"
      :esEdicion="true"
      @guardar="guardarHerramienta"
    />
  </div>
</template>

<style scoped>
/* Contenedor principal con fondo de pedidos */
.panel-movimientos { 
    background-color: #2a323d !important; 
    color: #ffffff;
}

/* Toolbar oscura */
.toolbar-oscuro {
    background-color: #1e252d !important;
}

/* Botón Volver */
.btn-volver {
    color: #94a3b8 !important;
    border-color: #4a5568 !important;
}
.btn-volver:hover {
    background-color: rgba(148, 163, 184, 0.1) !important;
    color: #ffffff !important;
}

/* Colores vibrantes para los botones de acción usando /deep/ para PrimeVue */
:deep(.btn-editar) {
    background-color: #0ea5e9 !important;
    border: none !important;
    color: white !important;
}
:deep(.btn-editar:not(:disabled):hover) {
    background-color: #0284c7 !important;
}

:deep(.btn-eliminar) {
    background-color: #ef4444 !important;
    border: none !important;
    color: white !important;
}
:deep(.btn-eliminar:not(:disabled):hover) {
    background-color: #dc2626 !important;
}

/* Opacidad cuando no hay nada seleccionado */
:deep(.p-button:disabled) {
    opacity: 0.5 !important;
}

/* Buscador oscuro */
:deep(.input-oscuro) { 
    background-color: #121820 !important; 
    color: #ffffff !important; 
    border: 1px solid #4a5568 !important; 
}
:deep(.input-oscuro:focus) { 
    border-color: #5ab1ce !important; 
    box-shadow: 0 0 0 1px #5ab1ce !important; 
}
</style>