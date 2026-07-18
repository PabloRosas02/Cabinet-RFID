<script setup>
import { ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { useHerramientas } from '@/composables/useHerramientas';

import Button from 'primevue/button';
import Toolbar from 'primevue/toolbar';
import InputText from 'primevue/inputtext';

// 1. AGREGAMOS LAS IMPORTACIONES DEL BUSCADOR
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

import TablaHerramientas from '@/components/herramientas/TablaHerramientas.vue';
import FormularioHerramienta from '@/components/herramientas/FormularioHerramientas.vue';

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
</script>

<template>
  <!-- Contenedor con el estilo del panel de pedidos -->
  <div class="panel-movimientos p-4 border-round-xl shadow-1">
    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">Administración y Movimientos</h2>
    </div>

    <!-- Toolbar oscura integrada -->
    <Toolbar class="mb-4 border-none toolbar-oscuro p-3">
      <template #start>
        <Button label="Editar Seleccionado" icon="pi pi-pencil" class="mr-2 p-button-info" 
                :disabled="!herramientaSeleccionada" @click="prepararEdicionSeleccionada" />
        <Button label="Dar de Baja (Eliminar)" icon="pi pi-trash" class="mr-2 p-button-danger" 
                :disabled="!herramientaSeleccionada" @click="eliminarSeleccionada" />
      </template>
      <template #end>
        <!-- 2. CAMBIAMOS EL SPAN POR LOS COMPONENTES DE PRIMEVUE -->
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