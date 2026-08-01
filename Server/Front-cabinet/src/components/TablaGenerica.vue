<script setup>
import { ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const props = defineProps({
    datos: { type: Array, required: true },
    columnas: { type: Array, required: true },
    cargando: { type: Boolean, default: false },
    filtros: { type: Object, default: null },
    globalFilterFields: { type: Array, default: () => [] }, 
    llaveMemoria: { type: String, required: true },
    seleccionable: { type: Boolean, default: false },
    dataKey: { type: String, default: 'id' },
    mensajeVacio: { type: String, default: 'No se encontraron registros.' },
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
      class="tabla-oscura w-full"
      :rowClass="obtenerClaseFila" 
      scrollable
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
      :currentPageReportTemplate="`{first} al {last} de {totalRecords} registros`"
    >

      <template #empty>
          <div class="flex flex-column align-items-center justify-content-center text-center w-full" style="min-height: 220px;">
              <i :class="['pi', iconoVacio, 'mb-3']" style="font-size: 3.5rem; color: #64748b;"></i>
              <span class="text-xl font-medium" style="color: #64748b;">{{ mensajeVacio }}</span>
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

<style scoped>
/* =====================================================================
   CONTENEDOR PRINCIPAL Y BORDES
   ===================================================================== */
.tabla-contenedor { width: 100%; }

:deep(.tabla-oscura .p-datatable-wrapper) {
    border: 1px solid #3f4b5b !important; 
    border-radius: 10px !important;       
    overflow: hidden !important;          
    background-color: #121820 !important; 
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
}

/* Encabezados (Header) */
:deep(.tabla-oscura .p-datatable-thead > tr > th) { 
    background-color: #1e252d !important; 
    color: #cbd5e1 !important; 
    border: none !important; 
    border-bottom: 1px solid #3f4b5b !important; 
    padding: 1.2rem 1rem; 
    font-weight: 600;
}
:deep(.tabla-oscura .p-datatable-thead > tr > th.p-sortable-column:hover) { 
    background-color: #2a323d !important; 
    color: #ffffff !important; 
}
:deep(.tabla-oscura .p-datatable-thead > tr > th .p-sortable-column-icon) { color: #94a3b8 !important; }
:deep(.tabla-oscura .p-datatable-thead > tr > th.p-sortable-column:hover .p-sortable-column-icon),
:deep(.tabla-oscura .p-datatable-thead > tr > th.p-highlight .p-sortable-column-icon) { color: #ffffff !important; }

/* Cuerpo de la tabla (Body) */
:deep(.tabla-oscura .p-datatable-tbody > tr > td) { 
    background-color: #121820 !important; 
    color: #ffffff !important; 
    border: none !important; 
    border-bottom: 1px solid #1e252d !important; 
    padding: 1rem; 
    transition: all 0.2s ease; 
}

/* Evitar línea inferior del último registro */
:deep(.tabla-oscura .p-datatable-tbody > tr:last-child > td) {
    border-bottom: none !important;
}

/* =====================================================================
   ESTADOS VACÍOS (Asegurando que la celda se expanda y cierre bien)
   ===================================================================== */
:deep(.tabla-oscura .p-datatable-tbody > tr.p-datatable-empty-message > td) {
    background-color: #121820 !important;
    border-bottom: none !important;
    padding: 2rem !important;
    text-align: center !important;
}

/* Hover y Selección en filas */
:deep(.tabla-oscura .p-datatable-tbody > tr:not(.fila-activa-crissair):not(.p-datatable-empty-message):hover > td) { 
    background-color: #1a2129 !important; 
    cursor: pointer; 
}
:deep(.tabla-oscura .p-datatable-tbody > tr.fila-activa-crissair > td),
:deep(.tabla-oscura .p-datatable-tbody > tr.p-highlight > td),
:deep(.tabla-oscura .p-datatable-tbody > tr[data-p-highlight="true"] > td),
:deep(.tabla-oscura .p-datatable-tbody > tr[aria-selected="true"] > td) { 
    background-color: rgba(90, 177, 206, 0.1) !important; 
    color: #5ab1ce !important; 
    border-bottom: 1px solid #1e252d !important; 
}

/* =====================================================================
   PAGINADOR
   ===================================================================== */
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
    color: #94a3b8 !important; 
    background-color: transparent !important; 
    border-radius: 6px !important; 
    transition: background-color 0.2s;
}
:deep(.p-paginator .p-paginator-first:hover),
:deep(.p-paginator .p-paginator-prev:hover),
:deep(.p-paginator .p-paginator-next:hover),
:deep(.p-paginator .p-paginator-last:hover),
:deep(.p-paginator .p-paginator-page:not(.p-highlight):hover) {
    background-color: #1e252d !important;
    color: #ffffff !important;
}
:deep(.p-paginator .p-paginator-page.p-highlight), 
:deep(.p-paginator .p-paginator-page[data-p-highlight="true"]), 
:deep(.p-paginator .p-paginator-page-selected) { 
    background-color: #5ab1ce !important; 
    color: #ffffff !important; 
    font-weight: bold; 
}
:deep(.p-paginator .p-paginator-current) { 
    color: #64748b !important; 
    font-size: 0.85rem; 
}

/* Scrollbar personalizado */
:deep(.p-datatable-wrapper::-webkit-scrollbar) { height: 8px; width: 8px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-thumb) { background: #3f4b5b; border-radius: 4px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-thumb:hover) { background: #4a5568; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-track) { background: transparent; }
</style>