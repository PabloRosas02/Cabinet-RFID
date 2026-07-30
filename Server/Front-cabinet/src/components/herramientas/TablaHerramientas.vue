<script setup>
import { ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';

const props = defineProps({
    herramientas: Array,
    cargando: Boolean,
    filtros: Object
});

const emit = defineEmits(['seleccion', 'doble-click']);

const herramientaSeleccionada = ref(null);

const onSelectionChange = (valor) => emit('seleccion', valor);

const onRowDoubleClick = (event) => emit('doble-click', event.data);

const verDetalles = (herramienta) => emit('doble-click', herramienta);

const getEstadoStock = (herramienta) => {
    if (herramienta.cantidadDisponible < herramienta.cantidadMinima) return 'agotado';
    if (herramienta.cantidadDisponible === herramienta.cantidadMinima) return 'alerta';
    return 'optimo';
};

const obtenerClaseFila = (data) => {
    if (herramientaSeleccionada.value && herramientaSeleccionada.value.id === data.id) {
        return 'fila-activa-crissair';
    }
    return '';
};
</script>

<template>
  <div class="tabla-contenedor p-3 border-round shadow-1 mt-4">
    <DataTable 
      :value="herramientas" 
      v-model:selection="herramientaSeleccionada" 
      @update:selection="onSelectionChange"
      @row-dblclick="onRowDoubleClick"
      selectionMode="single" 
      :paginator="true" 
      :rows="10" 
      :filters="filtros"
      :loading="cargando"
      dataKey="id"
      class="tabla-oscura w-full"
      emptyMessage="No se encontraron herramientas."
      :rowClass="obtenerClaseFila" 
      scrollable
    >
      <Column field="codigo" header="Código" sortable style="min-width: 120px; width: 15%"></Column>
      <Column field="nombre" header="Nombre" sortable style="min-width: 200px; width: 25%"></Column>
      <Column field="tipo" header="Tipo" sortable style="min-width: 140px; width: 15%"></Column>
      <Column field="ubicacion" header="Ubicación" sortable style="min-width: 140px; width: 15%"></Column>
      <Column field="cantidadMinima" header="Stock Mín." sortable style="min-width: 120px; width: 10%"></Column>
      
      <Column field="cantidadDisponible" header="Stock Físico" sortable style="min-width: 130px; width: 15%">
        <template #body="{ data }">
            <span :class="['badge-stock', getEstadoStock(data)]">
                {{ data.cantidadDisponible }}
            </span>
        </template>
      </Column>

      <!-- La columna de acciones NO lleva sortable -->
      <Column style="min-width: 70px; width: 5%">
        <template #body="{ data }">
            <Button 
                icon="pi pi-eye" 
                class="p-button-rounded p-button-text p-button-info btn-ver" 
                @click.stop="verDetalles(data)" 
                aria-label="Ver detalles"
            />
        </template>
      </Column>

    </DataTable>
  </div>
</template>

<style scoped>
/* CONTENEDOR - Estilo Pedidos */
.tabla-contenedor {
    background-color: #2a323d !important; 
    border: none !important;
    width: 100%;
}

/* =========================================================
   ENCABEZADOS Y FONDO BASE (Corrección Modo Light)
   ========================================================= */
:deep(.tabla-oscura) {
    background-color: #2a323d !important;
}

:deep(.tabla-oscura .p-datatable-thead > tr > th) {
    background-color: #2a323d !important; 
    color: #94a3b8 !important;
    border: none !important;
    border-bottom: 1px solid #4a5568 !important;
    padding: 1.2rem 1rem;
}

/* Efecto Hover al pasar el mouse por los encabezados ordenables */
:deep(.tabla-oscura .p-datatable-thead > tr > th.p-sortable-column:hover) {
    background-color: #1e252d !important;
    color: #ffffff !important;
}

/* Color de las flechas de ordenamiento (↑↓) */
:deep(.tabla-oscura .p-datatable-thead > tr > th .p-sortable-column-icon) {
    color: #94a3b8 !important;
}

/* Color de las flechas al hacer Hover o estar activo */
:deep(.tabla-oscura .p-datatable-thead > tr > th.p-sortable-column:hover .p-sortable-column-icon),
:deep(.tabla-oscura .p-datatable-thead > tr > th.p-highlight .p-sortable-column-icon) {
    color: #ffffff !important;
}

/* CELDAS Y FILAS - Normales (Ultra oscuro y sin contornos) */
:deep(.tabla-oscura .p-datatable-tbody > tr > td) {
    background-color: #121820 !important; 
    color: #ffffff !important;
    border: none !important;
    border-bottom: 1px solid #1e252d !important;
    padding: 1rem;
    transition: all 0.2s ease;
}

/* HOVER - Efecto sutil */
:deep(.tabla-oscura .p-datatable-tbody > tr:not(.fila-activa-crissair):hover > td) {
    background-color: #1e252d !important;
    cursor: pointer;
}

/* SELECCIÓN VISUAL GARANTIZADA */
:deep(.tabla-oscura .p-datatable-tbody > tr.fila-activa-crissair > td),
:deep(.tabla-oscura .p-datatable-tbody > tr.p-highlight > td),
:deep(.tabla-oscura .p-datatable-tbody > tr[data-p-highlight="true"] > td),
:deep(.tabla-oscura .p-datatable-tbody > tr[aria-selected="true"] > td) {
    background-color: #233544 !important; 
    color: #ffffff !important;
    border-bottom: 1px solid #1e252d !important; 
    outline: none !important;
    box-shadow: none !important;
}

/* BADGES DE STOCK */
.badge-stock {
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    font-weight: 800;
    display: inline-block;
}
.optimo { background-color: rgba(74, 222, 128, 0.15); color: #4ade80; }
.alerta { background-color: rgba(250, 204, 21, 0.15); color: #facc15; }
.agotado { background-color: rgba(248, 113, 113, 0.15); color: #f87171; }

/* =========================================================
   PAGINADOR SUTIL Y LIMPIO (Igual que en Usuarios)
   ========================================================= */
:deep(.p-paginator) { 
    background-color: transparent !important; 
    border: none !important; 
    margin-top: 1rem; 
    border-top: 1px solid #4a5568 !important; 
    padding-top: 1rem !important; 
}
:deep(.p-paginator .p-paginator-page), 
:deep(.p-paginator .p-paginator-first), 
:deep(.p-paginator .p-paginator-prev), 
:deep(.p-paginator .p-paginator-next), 
:deep(.p-paginator .p-paginator-last) { 
    color: #94a3b8 !important; 
    background-color: transparent !important; 
}
/* Efecto translúcido sutil para el número de página activo */
:deep(.p-paginator .p-paginator-page.p-highlight),
:deep(.p-paginator .p-paginator-page[data-p-highlight="true"]),
:deep(.p-paginator .p-paginator-page-selected) { 
    background-color: rgba(90, 177, 206, 0.2) !important; 
    color: #5ab1ce !important; 
    border-radius: 50% !important; 
    font-weight: bold;
}

/* SCROLL HORIZONTAL RESPONSIVO */
:deep(.p-datatable-wrapper::-webkit-scrollbar) { height: 6px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-thumb) { background: #4a5568; border-radius: 4px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-track) { background: transparent; }

/* BOTÓN DE VER DETALLES */
:deep(.btn-ver) {
    color: #38bdf8 !important;
    background-color: rgba(56, 189, 248, 0.1) !important;
    width: 2.5rem !important;
    height: 2.5rem !important;
}
:deep(.btn-ver:hover) {
    background-color: rgba(56, 189, 248, 0.25) !important;
}
</style>