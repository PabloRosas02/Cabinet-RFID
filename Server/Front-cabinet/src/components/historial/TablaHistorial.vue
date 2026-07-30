<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Button from 'primevue/button'; 
import { formatearFecha } from '@/utils/dateHelper';

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

const emit = defineEmits(['doble-click']);

// =========================================================
// LÓGICA RESPONSIVA DINÁMICA
// =========================================================
const esMovil = ref(window.innerWidth <= 992);

const actualizarVista = () => {
    esMovil.value = window.innerWidth <= 992;
};

// Escuchamos si el usuario redimensiona la ventana
onMounted(() => window.addEventListener('resize', actualizarVista));
onUnmounted(() => window.removeEventListener('resize', actualizarVista));

// =========================================================
// EVENTOS
// =========================================================
const onRowDblClick = (event) => {
    emit('doble-click', event.data);
};

const verDetalles = (data) => {
    emit('doble-click', data);
};
</script>

<template>
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
      :scrollable="esMovil" 
      

    >
      <Column field="id" header="Folio" :style="esMovil ? { minWidth: '100px' } : { width: '8%' }">
          <template #body="{ data }"><span class="font-bold text-400">#{{ data.id }}</span></template>
      </Column>
      
      <Column field="prestadorNombre" header="Prestó (Almacenista)" :style="esMovil ? { minWidth: '180px' } : { width: '15%' }"></Column>
      
      <Column header="Recibió / Devolución" :style="esMovil ? { minWidth: '180px' } : { width: '15%' }">
          <template #body="{ data }">
              <span class="text-blue-400 font-medium">{{ data.receptorNombre || 'Pendiente' }}</span>
          </template>
      </Column>

      <Column header="Solicitó (Empleado)" :style="esMovil ? { minWidth: '220px' } : { width: '16%' }">
          <template #body="{ data }">
              {{ data.trabajadorNumero }} - {{ data.trabajadorNombre }}
          </template>
      </Column>

      <Column header="Fecha Préstamo" :style="esMovil ? { minWidth: '160px' } : { width: '12%' }">
          <template #body="{ data }">{{ formatearFecha(data.fechaPedido) }}</template>
      </Column>

      <Column header="Fecha Devolución" :style="esMovil ? { minWidth: '160px' } : { width: '12%' }">
          <template #body="{ data }">
              <span :class="{'text-400': !data.fechaDevolucion}">
                  {{ formatearFecha(data.fechaDevolucion) }}
              </span>
          </template>
      </Column>

      <Column header="Herramientas" :style="esMovil ? { minWidth: '250px' } : { width: '14%' }">
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

      <Column field="estado" header="Estado" :style="esMovil ? { minWidth: '120px' } : { width: '8%' }">
          <template #body="{ data }">
              <Tag 
                :severity="data.estado === 'DEVUELTO' ? 'success' : 'danger'" 
                :value="data.estado" 
                class="px-3 py-1 font-bold" 
              />
          </template>
      </Column>

      <Column v-if="esMovil" style="min-width: 70px;">
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
</template>

<style scoped>
/* =========================================================
   BLINDAJE DE LA TABLA (CONSISTENCIA CON ADMINISTRACIÓN)
   ========================================================= */
.cursor-pointer :deep(.p-datatable-tbody > tr) {
    cursor: pointer;
}

:deep(.p-datatable),
:deep(.p-datatable-wrapper),
:deep(.p-datatable-table) {
    background-color: transparent !important;
}

:deep(.p-datatable-thead),
:deep(.p-datatable-thead > tr),
:deep(.p-datatable-thead > tr > th) {
    background-color: #121820 !important; /* Fix fondo blanco en light mode */
    color: #94a3b8 !important; 
    border: none !important; 
    border-bottom: 1px solid #4a5568 !important; 
    padding: 1.2rem 1rem !important;
}

:deep(.p-datatable-tbody),
:deep(.p-datatable-tbody > tr),
:deep(.p-datatable-tbody > tr > td) {
    background-color: #121820 !important; 
    color: #ffffff !important; 
    border: none !important; 
    border-bottom: 1px solid #1e252d !important; 
}

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
   PAGINADOR SUTIL Y LIMPIO (Estandarizado)
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

/* Efecto hover en botones de navegación del paginador */
:deep(.p-paginator .p-paginator-first:hover),
:deep(.p-paginator .p-paginator-prev:hover),
:deep(.p-paginator .p-paginator-next:hover),
:deep(.p-paginator .p-paginator-last:hover) {
    background-color: #36464d !important;
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

/* Estilo para el texto del reporte (ej. "1 al 10 de 50 registros") */
:deep(.p-paginator .p-paginator-current) { 
    color: #94a3b8 !important; 
    font-size: 0.85rem; 
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

/* =========================================================
   SCROLL HORIZONTAL RESPONSIVO & BOTÓN DE ACCIÓN
   ========================================================= */
:deep(.p-datatable-wrapper::-webkit-scrollbar) { height: 6px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-thumb) { background: #4a5568; border-radius: 4px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-track) { background: transparent; }

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