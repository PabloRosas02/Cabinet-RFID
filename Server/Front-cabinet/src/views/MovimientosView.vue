<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router'; 
import { FilterMatchMode } from '@primevue/core/api';
import { useHerramientas } from '@/composables/useHerramientas';

import Button from 'primevue/button';
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
  <!-- Padding responsivo: p-3 en celular, p-4 en tablet/PC -->
  <div class="panel-movimientos p-3 md:p-4 border-round-xl shadow-1 mt-4">
    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">Administración y Movimientos</h2>
    </div>

    <div class="flex flex-column xl:flex-row justify-content-between gap-3 mb-4 p-3 toolbar-oscuro border-round">

      <div class="flex flex-column sm:flex-row gap-2 w-full xl:w-auto">
        <Button 
            icon="pi pi-arrow-left" 
            label="Volver" 
            class="btn-volver w-full sm:w-auto" 
            outlined 
            @click="volverAInventario" 
        />

        <Button 
            label="Editar Seleccionado" 
            icon="pi pi-pencil" 
            severity="info" 
            class="font-bold btn-editar w-full sm:w-auto" 
            :disabled="!herramientaSeleccionada" 
            @click="prepararEdicionSeleccionada" 
        />
        
        <Button 
            label="Dar de Baja" 
            icon="pi pi-trash" 
            severity="danger" 
            class="font-bold btn-eliminar w-full sm:w-auto" 
            :disabled="!herramientaSeleccionada" 
            @click="eliminarSeleccionada" 
        />
      </div>
      
      <div class="w-full xl:w-auto">
        <IconField iconPosition="left" class="w-full">
          <InputIcon class="pi pi-search" />
          <InputText 
            id="buscador-movimientos" 
            name="buscador-movimientos" 
            v-model="filtros['global'].value" 
            placeholder="Buscar para editar..." 
            class="input-oscuro w-full" 
            autocomplete="off" 
          />
        </IconField>
      </div>
    </div>

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

/* Contenedor oscuro estilo toolbar */
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