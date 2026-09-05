<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router'; 
import { FilterMatchMode } from '@primevue/core/api';
import { useHerramientas } from '@/composables/useHerramientas';
import { useGestorArchivos } from '@/composables/useGestordeArchivos'; 
import Menu from 'primevue/menu';
import { useI18n } from 'vue-i18n'; 

import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

import TablaHerramientas from '@/components/herramientas/TablaHerramientas.vue';
import ModalDetalleHerramienta from '@/components/ModalDetalleHerramienta.vue';

const router = useRouter(); 
const { t } = useI18n();

const { 
    herramientas, 
    cargando, 
    totalRegistros,
    paginaActual,
    herramientaActual, 
    cargarHerramientas 
} = useHerramientas();

const { exportarInventario } = useGestorArchivos();

const tablaRef = ref();
const menuExportar = ref();
const verSoloAlertas = ref(false);
const herramientaSeleccionada = ref(null);
const mostrarModalDetalle = ref(false);

// Variable para reactividad de búsqueda backend
const busquedaTexto = ref('');
const sortFieldActual = ref('id');
const sortOrderActual = ref('ASC');

const filtros = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// WATCH: Detecta cambios en el input de búsqueda y llama al servidor reseteando a página 1
let timeoutBusqueda = null;
watch(busquedaTexto, (nuevoTexto) => {
    clearTimeout(timeoutBusqueda);
    timeoutBusqueda = setTimeout(() => {
        cargarHerramientas({
            page: 1, // Reset a primera página al buscar
            limit: 10,
            search: nuevoTexto,
            sortField: sortFieldActual.value,
            sortOrder: sortOrderActual.value
        });
    }, 300); // Debounce de 300ms para evitar sobrecargar llamadas API
});

const herramientasVisibles = computed(() => {
    if (!verSoloAlertas.value) return herramientas.value;
    return herramientas.value.filter(h => {
        const disponible = h.cantidadDisponible ?? h.stockFisico ?? 0;
        const minimo = h.cantidadMinima ?? h.stockMinimo ?? 0;
        return disponible <= minimo;
    });
});

const manejarSeleccion = (seleccion) => {
    herramientaSeleccionada.value = seleccion;
};

const abrirDetalles = (herramienta) => {
    herramientaActual.value = { ...herramienta };
    mostrarModalDetalle.value = true;
};

const cambiarPagina = (evento) => {
    cargarHerramientas({ 
        page: evento.page, 
        limit: evento.limit || 10,
        search: busquedaTexto.value,
        sortField: sortFieldActual.value,
        sortOrder: sortOrderActual.value
    });
};

const manejarOrden = (event) => {
    if (!event.sortField) return;

    sortFieldActual.value = event.sortField;
    sortOrderActual.value = event.sortOrder === 1 ? 'ASC' : 'DESC';

    cargarHerramientas({ 
        page: paginaActual.value, 
        limit: 10, 
        search: busquedaTexto.value,
        sortField: sortFieldActual.value, 
        sortOrder: sortOrderActual.value 
    });
};

const opcionesExportar = computed(() => [
    {
        label: t('view_inventario.exportar_csv'),
        icon: 'pi pi-file',
        command: () => exportarInventario(herramientasVisibles.value, 'csv')
    },
    {
        label: t('view_inventario.exportar_excel'),
        icon: 'pi pi-file-excel',
        command: () => exportarInventario(herramientasVisibles.value, 'xlsx')
    }
]);

const toggleExportar = (event) => menuExportar.value.toggle(event);
const irABitacora = () => router.push('/bitacora');
const irAMovimientos = () => router.push('/movimientos'); 

onMounted(() => {
    cargarHerramientas({ page: 1, limit: 10 });
});
</script>

<template>
  <div class="panel-principal p-3 md:p-4 border-round-xl shadow-1 mt-4">
    
    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0 titulo-vista">{{ t('view_inventario.titulo') }}</h2>
    </div>

    <!-- Toolbar y Filtros -->
    <div class="flex flex-column xl:flex-row justify-content-between gap-3 mb-4 p-3 toolbar-oscuro border-round">
      <div class="flex flex-wrap gap-2 w-full xl:w-auto">
        <Button 
            type="button" 
            :label="t('view_inventario.btn_exportar')" 
            icon="pi pi-angle-down" 
            iconPos="right"
            class="btn-exportar w-full sm:w-auto"
            @click="toggleExportar" 
            aria-haspopup="true" 
            aria-controls="exportar_menu"
        />
        <Menu ref="menuExportar" id="exportar_menu" :model="opcionesExportar" :popup="true" class="menu-oscuro" />
        
        <Button 
            :label="verSoloAlertas ? t('view_inventario.btn_mostrando_todo') : t('view_inventario.btn_solo_alertas')" 
            :icon="verSoloAlertas ? 'pi pi-check' : 'pi pi-exclamation-triangle'" 
            :severity="verSoloAlertas ? 'success' : 'warning'"
            :outlined="!verSoloAlertas"
            class="btn-alertas w-full sm:w-auto"
            @click="verSoloAlertas = !verSoloAlertas" 
        />

        <Button 
            :label="t('view_inventario.btn_actualizar')" 
            icon="pi pi-sync" 
            severity="info"
            class="btn-actualizar w-full sm:w-auto"
            @click="irAMovimientos" 
        />

        <Button 
            :label="t('view_inventario.btn_bitacora')" 
            icon="pi pi-history" 
            class="btn-bitacora w-full sm:w-auto"
            @click="irABitacora" 
        />
      </div>

      <div class="w-full xl:w-25rem">
        <IconField iconPosition="left" class="w-full">
          <InputIcon class="pi pi-search" />
          <InputText 
              id="buscadorInventario"
              name="buscadorInventario"
              :aria-label="t('view_inventario.ph_buscar')"
              v-model="busquedaTexto" 
              :placeholder="t('view_inventario.ph_buscar')" 
              class="input-oscuro w-full" 
              autocomplete="off"
          />
        </IconField>
      </div>
    </div>

    <!-- Tabla Genérica con Paginación Servidor -->
    <TablaHerramientas
        ref="tablaRef"
        :herramientas="herramientas"
        :cargando="cargando"
        :totalRecords="totalRegistros"
        :paginaActual="paginaActual"
        :filtros="filtros"
        :filasPorPagina="10"
        llaveMemoria="vista_inventario" 
        @seleccion="manejarSeleccion"
        @doble-click="abrirDetalles"
        @cambio-pagina="cambiarPagina"
        @ordenar="manejarOrden"
    />

    <!-- Modal Detalles Reutilizado (Solo Lectura) -->
    <ModalDetalleHerramienta
        v-model:visible="mostrarModalDetalle"
        :herramienta="herramientaActual"
        :ocultarBotonAgregar="true"
    />
  </div>
</template>

<style scoped>
.titulo-vista { color: #5ab1ce; }

.btn-actualizar {
    background-color: #0ea5e9 !important; 
    border: none !important;
    color: white !important;
}
.btn-actualizar:hover { background-color: #0284c7 !important; }

.btn-bitacora {
    background-color: #4b5563 !important; 
    border: none !important;
    color: white !important;
}
.btn-bitacora:hover { background-color: #374151 !important; }

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
:deep(.btn-alertas.p-button-success:hover) { background-color: #16a34a !important; }

:deep(.p-datatable-wrapper::-webkit-scrollbar) { height: 6px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-thumb) { background: #4a5568; border-radius: 4px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-track) { background: transparent; }
</style>