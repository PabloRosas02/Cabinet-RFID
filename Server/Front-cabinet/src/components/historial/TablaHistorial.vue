<script setup>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import { defineProps, defineEmits } from 'vue';

// Recibimos los datos ya filtrados desde el padre
const props = defineProps({
    historial: {
        type: Array,
        required: true
    },
    cargando: {
        type: Boolean,
        default: false
    },
    filtros: {
        type: Object,
        required: true
    }
});

// Definimos el evento que vamos a emitir al hacer doble clic
const emit = defineEmits(['doble-click']);

// Función que captura el evento de PrimeVue y emite solo la data del pedido seleccionado
const onRowDblClick = (event) => {
    emit('doble-click', event.data);
};

const formatearFecha = (fechaString) => {
    if (!fechaString) return '--'; // Si no hay fecha (Pendiente), mostramos unos guiones
    return new Date(fechaString).toLocaleDateString('es-MX', { 
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
};
</script>

<template>
    <!-- Agregamos selectionMode y el evento @row-dblclick a la DataTable -->
    <DataTable 
      :value="historial" 
      :paginator="true" 
      :rows="10" 
      :loading="cargando"
      dataKey="id"
      :filters="filtros" 
      :globalFilterFields="['trabajadorNombre', 'trabajadorNumero', 'prestadorNombre', 'receptorNombre']"
      class="tabla-oscura w-full cursor-pointer"
      emptyMessage="No hay registros en el historial para esta búsqueda."
      selectionMode="single"
      @row-dblclick="onRowDblClick"
    >
      <Column field="id" header="Folio" style="width: 8%">
          <template #body="{ data }"><span class="font-bold text-400">#{{ data.id }}</span></template>
      </Column>
      
      <Column field="prestadorNombre" header="Prestó (Almacenista)" style="width: 15%"></Column>
      
      <Column header="Recibió / Devolución" style="width: 15%">
          <template #body="{ data }">
              <span class="text-blue-400 font-medium">{{ data.receptorNombre || 'Pendiente' }}</span>
          </template>
      </Column>

      <Column header="Solicitó (Empleado)" style="width: 16%">
          <template #body="{ data }">
              {{ data.trabajadorNumero }} - {{ data.trabajadorNombre }}
          </template>
      </Column>

      <Column header="Fecha Préstamo" style="width: 12%">
          <template #body="{ data }">{{ formatearFecha(data.fechaPedido) }}</template>
      </Column>

      <!-- NUEVA COLUMNA: FECHA DE DEVOLUCIÓN -->
      <Column header="Fecha Devolución" style="width: 12%">
          <template #body="{ data }">
              <span :class="{'text-400': !data.fechaDevolucion}">
                  {{ formatearFecha(data.fechaDevolucion) }}
              </span>
          </template>
      </Column>

      <Column header="Herramientas" style="width: 14%">
          <template #body="{ data }">
              <div class="text-sm">
                  <div v-for="(h, idx) in data.herramientas" :key="idx" class="mb-1 text-400">
                      • {{ h.cantidadPrestada }}x {{ h.nombre }} 
                      <span v-if="h.cantidadRegresada > 0" class="text-green-500 block">
                          (Regresó: {{ h.cantidadRegresada }})
                      </span>
                  </div>
              </div>
          </template>
      </Column>

      <Column field="estado" header="Estado" style="width: 8%">
          <template #body="{ data }">
              <Tag 
                :severity="data.estado === 'DEVUELTO' ? 'success' : 'danger'" 
                :value="data.estado" 
                class="px-3 py-1 font-bold" 
              />
          </template>
      </Column>
    </DataTable>
</template>

<style scoped>
/* =========================================================
   BLINDAJE DE LA TABLA (CONSISTENCIA CON ADMINISTRACIÓN)
   ========================================================= */

/* Hacemos que el puntero cambie a una "manita" para indicar que se le puede dar clic */
.cursor-pointer :deep(.p-datatable-tbody > tr) {
    cursor: pointer;
}

/* Fondo de la tabla y envolturas */
:deep(.p-datatable),
:deep(.p-datatable-wrapper),
:deep(.p-datatable-table) {
    background-color: transparent !important;
}

/* Cabeceras (thead y th) -> TRANSPARENTES para igualar a la vista principal */
:deep(.p-datatable-thead),
:deep(.p-datatable-thead > tr),
:deep(.p-datatable-thead > tr > th) {
    background-color: transparent !important; 
    color: #94a3b8 !important; 
    border: none !important; 
    border-bottom: 1px solid #4a5568 !important; 
    padding: 1.2rem 1rem !important;
}

/* Filas y Celdas del cuerpo (tbody, tr, td) */
:deep(.p-datatable-tbody),
:deep(.p-datatable-tbody > tr),
:deep(.p-datatable-tbody > tr > td) {
    background-color: #121820 !important; 
    color: #ffffff !important; 
    border: none !important; 
    border-bottom: 1px solid #1e252d !important; 
}

/* Hover de la fila y fila vacía */
:deep(.p-datatable-tbody > tr:hover > td) { 
    background-color: #1e252d !important; 
}
:deep(.p-datatable-tbody > tr.p-datatable-empty-message > td) {
    background-color: #121820 !important;
    color: #94a3b8 !important;
    text-align: center !important;
    padding: 2rem !important;
    font-weight: 500 !important;
}

/* =========================================================
   PAGINADOR
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
:deep(.p-paginator .p-paginator-page.p-highlight) { 
    background-color: #5ab1ce !important; 
    color: #ffffff !important; 
    border-radius: 50%; 
}

/* =========================================================
   ETIQUETAS DE ESTADO (TAGS) - TEMA OSCURO
   ========================================================= */
:deep(.p-tag.p-tag-success) {
    background-color: rgba(34, 197, 94, 0.15) !important; 
    color: #4ade80 !important; 
}
:deep(.p-tag.p-tag-danger) {
    background-color: rgba(239, 68, 68, 0.15) !important; 
    color: #f87171 !important; 
}
</style>