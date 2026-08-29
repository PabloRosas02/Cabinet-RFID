<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n'; 
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const { t } = useI18n(); 

const props = defineProps({
    datos: { type: Array, required: true },
    columnas: { type: Array, required: true },
    cargando: { type: Boolean, default: false },
    filtros: { type: Object, default: null },
    globalFilterFields: { type: Array, default: () => [] }, 
    llaveMemoria: { type: String, required: true },
    seleccionable: { type: Boolean, default: false },
    dataKey: { type: String, default: 'id' },
    mensajeVacio: { type: String, default: '' }, 
    iconoVacio: { type: String, default: 'pi-box' }
});

const emit = defineEmits(['seleccion', 'doble-click']);
const filaSeleccionada = ref(null);

const onSelectionChange = (valor) => emit('seleccion', valor);
const onRowDoubleClick = (event) => emit('doble-click', event.data);

const obtenerClaseFila = (data) => {
    if (props.seleccionable && filaSeleccionada.value && filaSeleccionada.value[props.dataKey] === data[props.dataKey]) {
        return 'fila-activa-crissair';
    }
    return '';
};

// Computado para el mensaje vacío: usa la prop (si se envía algo) o el diccionario traducido.
const textoVacio = computed(() => props.mensajeVacio || t('tabla_generica.mensaje_vacio'));

</script>

<template>
  <div class="tabla-contenedor mt-4">
    <DataTable 
        :value="datos" 
        v-model:selection="filaSeleccionada" 
        @update:selection="onSelectionChange"
        @row-dblclick="onRowDoubleClick"
        :selectionMode="seleccionable ? 'single' : null" 
        :paginator="true" 
        :rows="10" 
        :filters="filtros"
        :globalFilterFields="globalFilterFields" 
        :loading="cargando"
        :dataKey="dataKey"
        stateStorage="session"
        :stateKey="llaveMemoria"
        class="tabla-generica w-full"
        :rowClass="obtenerClaseFila" 
        scrollable
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        :currentPageReportTemplate="t('tabla_generica.reporte_paginacion', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}' })"
    >

      <template #empty>
          <div class="flex flex-column align-items-center justify-content-center text-center w-full" style="min-height: 220px;">
              <i :class="['pi', iconoVacio, 'mb-3']" style="font-size: 3.5rem; color: #64748b;"></i>
              <span class="text-xl font-medium" style="color: #64748b;">{{ textoVacio }}</span>
          </div>
      </template>

      <!-- Generación Dinámica de Columnas -->
      <Column 
        v-for="col in columnas" 
        :key="col.field || col.slotName" 
        :field="col.field" 
        :header="col.header" 
        :sortable="col.sortable" 
        :style="{ width: col.width, minWidth: col.minWidth }"
      >
        <template #body="{ data }">
            <slot v-if="col.slotName" :name="col.slotName" :data="data"></slot>
            <span v-else>{{ data[col.field] }}</span>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<!-- <style scoped>
/* =====================================================================
   VARIABLES DE TEMA (Modo OSCURO por defecto)
   ===================================================================== */
.tabla-contenedor {
    --tbl-bg: #1e252d;
    --tbl-border: #2a323d;
    --tbl-text: #e2e8f0;
    --tbl-text-muted: #94a3b8;
    --tbl-header-bg: #1e252d;
    --tbl-header-text: #cbd5e1;
    --tbl-hover-bg: #2a323d;
    --tbl-header-hover-bg: #36464d;
    --tbl-header-hover-text: #ffffff;
    --tbl-active-bg: rgba(90, 177, 206, 0.15);
    --tbl-active-text: #5ab1ce;
    --tbl-paginator-hover: #2a323d;
    --tbl-paginator-text: #94a3b8;
    --tbl-paginator-hover-text: #ffffff;
    --tbl-scrollbar: #3f4b5b;
    --tbl-scrollbar-hover: #4a5568;
    
    width: 100%;
}

/* =====================================================================
   VARIABLES DE TEMA (Modo CLARO)
   ===================================================================== */
:global(html.light-theme) .tabla-contenedor {
    --tbl-bg: #ffffff;
    --tbl-border: #e2e8f0;
    --tbl-text: #334155;
    --tbl-text-muted: #64748b;
    --tbl-header-bg: #f8fafc;
    --tbl-header-text: #475569;
    --tbl-hover-bg: #f1f5f9;
    --tbl-header-hover-bg: #e2e8f0;
    --tbl-header-hover-text: #0f172a;
    --tbl-active-bg: rgba(90, 177, 206, 0.1);
    --tbl-active-text: #0369a1;
    --tbl-paginator-hover: #e2e8f0;
    --tbl-paginator-text: #64748b;
    --tbl-paginator-hover-text: #0f172a;
    --tbl-scrollbar: #cbd5e1;
    --tbl-scrollbar-hover: #94a3b8;
}

/* =====================================================================
   ESTILOS APLICADOS (Forzando a PrimeVue a usar nuestras variables)
   ===================================================================== */

/* Wrapper Principal */
:deep(.tabla-generica .p-datatable-wrapper) {
    background-color: var(--tbl-bg) !important;
    border: 1px solid var(--tbl-border) !important;
    border-radius: 10px !important;
    overflow: hidden !important;
}

/* Encabezados (Header) */
:deep(.tabla-generica .p-datatable-thead > tr > th) {
    background-color: var(--tbl-header-bg) !important;
    color: var(--tbl-header-text) !important;
    border: none !important;
    border-bottom: 1px solid var(--tbl-border) !important;
    padding: 1.2rem 1rem !important;
    font-weight: 600;
}
:deep(.tabla-generica .p-datatable-thead > tr > th.p-sortable-column:hover) {
    background-color: var(--tbl-header-hover-bg) !important;
    color: var(--tbl-header-hover-text) !important;
}
:deep(.tabla-generica .p-datatable-thead > tr > th .p-sortable-column-icon) {
    color: var(--tbl-text-muted) !important;
}
:deep(.tabla-generica .p-datatable-thead > tr > th.p-sortable-column:hover .p-sortable-column-icon),
:deep(.tabla-generica .p-datatable-thead > tr > th.p-highlight .p-sortable-column-icon) {
    color: var(--tbl-active-text) !important;
}

/* Cuerpo (Body) */
:deep(.tabla-generica .p-datatable-tbody > tr > td) {
    background-color: var(--tbl-bg) !important;
    color: var(--tbl-text) !important;
    border: none !important;
    border-bottom: 1px solid var(--tbl-border) !important;
    padding: 1rem !important;
    transition: all 0.2s ease;
}

/* Hover en filas */
:deep(.tabla-generica .p-datatable-tbody > tr:not(.fila-activa-crissair):not(.p-datatable-empty-message):hover > td) {
    background-color: var(--tbl-hover-bg) !important;
    cursor: pointer;
}

/* Fila Activa (Seleccionada) */
:deep(.tabla-generica .p-datatable-tbody > tr.fila-activa-crissair > td),
:deep(.tabla-generica .p-datatable-tbody > tr.p-highlight > td) {
    background-color: var(--tbl-active-bg) !important;
    color: var(--tbl-active-text) !important;
}

/* Estado Vacío */
:deep(.tabla-generica .p-datatable-tbody > tr.p-datatable-empty-message > td) {
    background-color: var(--tbl-bg) !important;
    border-bottom: none !important;
    padding: 2rem !important;
    text-align: center !important;
}

/* Evitar línea inferior del último registro */
:deep(.tabla-generica .p-datatable-tbody > tr:last-child > td) { 
    border-bottom: none !important; 
}

/* Paginador */
:deep(.p-paginator) {
    background-color: transparent !important;
    border: none !important;
    margin-top: 1rem;
    padding-top: 0.5rem !important;
}
:deep(.p-paginator .p-paginator-page),
:deep(.p-paginator .p-paginator-first),
:deep(.p-paginator .p-paginator-prev),
:deep(.p-paginator .p-paginator-next),
:deep(.p-paginator .p-paginator-last) {
    color: var(--tbl-paginator-text) !important;
    background-color: transparent !important;
    border-radius: 6px !important;
    transition: background-color 0.2s;
}
:deep(.p-paginator .p-paginator-first:hover),
:deep(.p-paginator .p-paginator-prev:hover),
:deep(.p-paginator .p-paginator-next:hover),
:deep(.p-paginator .p-paginator-last:hover),
:deep(.p-paginator .p-paginator-page:not(.p-highlight):hover) {
    background-color: var(--tbl-paginator-hover) !important;
    color: var(--tbl-paginator-hover-text) !important;
}
:deep(.p-paginator .p-paginator-page.p-highlight) {
    background-color: #5ab1ce !important; 
    color: #ffffff !important;
    font-weight: bold;
}
:deep(.p-paginator .p-paginator-current) {
    color: var(--tbl-paginator-text) !important;
    font-size: 0.85rem;
}

/* Scrollbar */
:deep(.p-datatable-wrapper::-webkit-scrollbar) { height: 8px; width: 8px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-track) { background: transparent; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-thumb) { background: var(--tbl-scrollbar); border-radius: 4px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-thumb:hover) { background: var(--tbl-scrollbar-hover); }
</style>     -->