<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router'; 
import { FilterMatchMode } from '@primevue/core/api';
import { useHerramientas } from '@/composables/useHerramientas';
import { useGestorArchivos } from '@/composables/useGestordeArchivos'; 
import Menu from 'primevue/menu';

import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

import TablaHerramientas from '@/components/herramientas/TablaHerramientas.vue';
import DetalleHerramienta from '@/components/herramientas/DetalleHerramientas.vue';

const router = useRouter(); 

const { herramientas, cargando, herramientaActual, cargarHerramientas } = useHerramientas();
const { exportarInventario } = useGestorArchivos();

const tablaRef = ref();
const menuExportar = ref();
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

const opcionesExportar = ref([
    {
        label: 'Exportar a CSV',
        icon: 'pi pi-file',
        command: () => exportarInventario(herramientasVisibles.value, 'csv')
    },
    {
        label: 'Exportar a Excel (.xlsx)',
        icon: 'pi pi-file-excel',
        command: () => exportarInventario(herramientasVisibles.value, 'xlsx')
    }
]);

const toggleExportar = (event) => {
    menuExportar.value.toggle(event);
};

const irAMovimientos = () => {
    router.push('/movimientos');
};

const irABitacora = () => {
    router.push('/bitacora');
};

onMounted(() => {
    cargarHerramientas();
});
</script>

<template>
  <!-- Cambiado a .panel-principal global -->
  <div class="panel-principal p-3 md:p-4 border-round-xl shadow-1 mt-4">
    
    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">Control de Inventario</h2>
    </div>

    <!-- Las clases toolbar-oscuro ya están en el main.css -->
    <div class="flex flex-column xl:flex-row justify-content-between gap-3 mb-4 p-3 toolbar-oscuro border-round">
      
      <div class="flex flex-wrap gap-2 w-full xl:w-auto">
        <!-- btn-exportar ya vive en main.css -->
        <Button 
            type="button" 
            label="Exportar Inventario" 
            icon="pi pi-angle-down" 
            iconPos="right"
            class="btn-exportar w-full sm:w-auto"
            @click="toggleExportar" 
            aria-haspopup="true" 
            aria-controls="exportar_menu"
        />
        <Menu ref="menuExportar" id="exportar_menu" :model="opcionesExportar" :popup="true" class="menu-oscuro" />
        
        <Button 
            :label="verSoloAlertas ? 'Mostrando Todo' : 'Solo Alertas'" 
            :icon="verSoloAlertas ? 'pi pi-check' : 'pi pi-exclamation-triangle'" 
            :severity="verSoloAlertas ? 'success' : 'warning'"
            :outlined="!verSoloAlertas"
            class="btn-alertas w-full sm:w-auto"
            @click="verSoloAlertas = !verSoloAlertas" 
        />

        <Button 
            label="Actualizar Inventario" 
            icon="pi pi-sync" 
            severity="info"
            class="btn-actualizar w-full sm:w-auto"
            @click="irAMovimientos" 
        />

        <Button 
            label="Bitácora de Auditoría" 
            icon="pi pi-history" 
            class="btn-bitacora w-full sm:w-auto"
            @click="irABitacora" 
        />
      </div>

      <div class="w-full xl:w-auto">
        <IconField iconPosition="left" class="w-full xl:w-30rem">
          <InputIcon class="pi pi-search" />
          <InputText 
              id="buscadorInventario"
              name="buscadorInventario"
              aria-label="Buscar código o nombre"
              v-model="filtros['global'].value" 
              placeholder="Buscar código, nombre..." 
              class="input-oscuro w-full" 
              autocomplete="off"
          />
        </IconField>
      </div>
    </div>

    <TablaHerramientas
      ref="tablaRef"
      :herramientas="herramientasVisibles"
      :cargando="cargando"
      :filtros="filtros"
      llaveMemoria="vista_inventario" 
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
/* =========================================================
   BOTONES EXCLUSIVOS DE ESTA VISTA
   ========================================================= */
.btn-actualizar {
    background-color: #0ea5e9 !important; 
    border: none !important;
    color: white !important;
}
.btn-actualizar:hover {
    background-color: #0284c7 !important;
}

.btn-bitacora {
    background-color: #4b5563 !important; 
    border: none !important;
    color: white !important;
}
.btn-bitacora:hover {
    background-color: #374151 !important;
}

/* =========================================================
   BOTÓN DINÁMICO DE ALERTAS
   ========================================================= */
:deep(.btn-alertas.p-button-warning.p-button-outlined) {
    color: #fbbf24 !important; 
    border-color: #fbbf24 !important;
    background-color: transparent !important;
}
:deep(.btn-alertas.p-button-warning.p-button-outlined:hover) {
    background-color: rgba(251, 191, 36, 0.15) !important;
}

:deep(.btn-alertas.p-button-success) {
    background-color: #22c55e !important; 
    border: none !important;
    color: white !important;
}
:deep(.btn-alertas.p-button-success:hover) {
    background-color: #16a34a !important;
}

/* =========================================================
   SCROLLBAR DE LA TABLA
   ========================================================= */
:deep(.p-datatable-wrapper::-webkit-scrollbar) { height: 6px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-thumb) { background: #4a5568; border-radius: 4px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-track) { background: transparent; }
</style>