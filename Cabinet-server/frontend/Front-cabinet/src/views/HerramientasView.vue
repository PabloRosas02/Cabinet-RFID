<script setup>
import { ref, computed } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { useHerramientas } from '@/composables/useHerramientas';

import Button from 'primevue/button';
import Toolbar from 'primevue/toolbar';
import ToggleButton from 'primevue/togglebutton';
import InputText from 'primevue/inputtext';

// 1. AÑADIMOS LAS IMPORTACIONES PARA EL BUSCADOR
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

import TablaHerramientas from '@/components/herramientas/TablaHerramientas.vue';
import DetalleHerramienta from '@/components/herramientas/DetalleHerramientas.vue';

const { herramientas, cargando, herramientaActual } = useHerramientas();

const tablaRef = ref();
const verSoloAlertas = ref(false);
const herramientaSeleccionada = ref(null);
const mostrarModalDetalle = ref(false);

const filtros = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const herramientasVisibles = computed(() => {
    if (!verSoloAlertas.value) return herramientas.value;
    return herramientas.value.filter(h => h.cantidadDisponible <= h.cantidadMinima);
});

const manejarSeleccion = (seleccion) => {
    herramientaSeleccionada.value = seleccion;
};

const abrirDetalles = (herramienta) => {
    herramientaActual.value = { ...herramienta };
    mostrarModalDetalle.value = true;
};

const exportarCSV = () => {
    if (tablaRef.value) tablaRef.value.exportar();
};
</script>

<template>
  <!-- Contenedor oscuro -->
  <div class="panel-herramientas p-4 border-round-xl shadow-1">
    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">Control de Inventario - Herramientas</h2>
    </div>

    <!-- Barra superior con estilo Pedidos -->
    <Toolbar class="mb-4 border-none toolbar-oscuro p-3">
      <template #start>
        <Button label="Exportar CSV" icon="pi pi-file-excel" class="mr-2 btn-exportar" @click="exportarCSV" />
        <ToggleButton v-model="verSoloAlertas" onLabel="Mostrando Todo" offLabel="Solo Alertas" 
                      onIcon="pi pi-check" offIcon="pi pi-exclamation-triangle" class="btn-toggle" />
      </template>
      <template #end>
        <!-- 2. REEMPLAZAMOS EL SPAN POR ICONFIELD E INPUTICON -->
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search" />
          <InputText v-model="filtros['global'].value" placeholder="Buscar código, nombre..." class="input-oscuro" />
        </IconField>
      </template>
    </Toolbar>

    <TablaHerramientas
      ref="tablaRef"
      :herramientas="herramientasVisibles"
      :cargando="cargando"
      :filtros="filtros"
      @seleccion="manejarSeleccion"
      @doble-click="abrirDetalles"
    />

    <DetalleHerramienta
      v-model:visible="mostrarModalDetalle"
      :herramienta="herramientaActual"
    />
  </div>
</template>

<style scoped>
/* 1. CONTENEDOR PRINCIPAL - Fondo de Pedidos */
.panel-herramientas { 
    background-color: #2a323d !important; 
    color: #ffffff;
}

/* 2. TOOLBAR OSCURA */
.toolbar-oscuro {
    background-color: #1e252d !important;
}

/* 3. INPUT OSCURO */
:deep(.input-oscuro) { 
    background-color: #121820 !important; 
    color: #ffffff !important; 
    border: 1px solid #4a5568 !important; 
}
:deep(.input-oscuro:focus) { 
    border-color: #5ab1ce !important; 
    box-shadow: 0 0 0 1px #5ab1ce !important; 
}

/* 4. BOTONES CORREGIDOS */

/* Botón Excel: Color Verde Intenso */
.btn-exportar {
    background-color: #217346 !important; /* Verde Excel */
    border: none !important;
    color: white !important;
}

/* ToggleButton: Limpieza de contornos y colores */
.btn-toggle {
    background-color: #1e252d !important;
    border: 1px solid #4a5568 !important;
    color: #cbd5e1 !important;
}

/* Eliminamos el borde naranja (outline) cuando el botón está activo */
.btn-toggle.p-togglebutton.p-highlight {
    background-color: #f59e0b !important; /* Naranja cuando está activo */
    color: white !important;
    border-color: #f59e0b !important;
    box-shadow: none !important; /* Esto quita el contorno naranja */
    outline: none !important;    /* Asegura que no haya outline */
}

/* Forzar color blanco a los íconos dentro de los botones */
.btn-exportar i, 
.btn-toggle i {
    color: white !important;
}
</style>