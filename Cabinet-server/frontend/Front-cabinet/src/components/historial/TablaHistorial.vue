<script setup>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';

// Recibimos los datos ya filtrados desde el padre
defineProps({
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

const formatearFecha = (fechaString) => {
    return new Date(fechaString).toLocaleDateString('es-MX', { 
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
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
      :globalFilterFields="['trabajadorNombre', 'trabajadorNumero', 'prestadorNombre']"
      class="tabla-oscura w-full"
      emptyMessage="No hay registros en el historial para esta búsqueda."
    >
      <Column field="id" header="Folio" style="width: 10%">
          <template #body="{ data }"><span class="font-bold text-400">#{{ data.id }}</span></template>
      </Column>
      
      <Column field="prestadorNombre" header="Autorizó (Prestador)" style="width: 20%"></Column>
      <Column header="Solicitó (Empleado)" style="width: 20%">
          <template #body="{ data }">
              {{ data.trabajadorNumero }} - {{ data.trabajadorNombre }}
          </template>
      </Column>

      <Column header="Fecha" style="width: 15%">
          <template #body="{ data }">{{ formatearFecha(data.fechaPedido) }}</template>
      </Column>

      <Column header="Herramientas" style="width: 25%">
          <template #body="{ data }">
              <div class="text-sm">
                  <div v-for="(h, idx) in data.herramientas" :key="idx" class="mb-1 text-400">
                      • {{ h.cantidadPrestada }}x {{ h.nombre }} 
                      <span v-if="h.cantidadRegresada > 0" class="text-green-500">
                          (Regresó: {{ h.cantidadRegresada }})
                      </span>
                  </div>
              </div>
          </template>
      </Column>

      <Column field="estado" header="Estado" style="width: 10%">
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

/* 1. Fondo de la tabla y envolturas */
:deep(.p-datatable),
:deep(.p-datatable-wrapper),
:deep(.p-datatable-table) {
    background-color: transparent !important;
}

/* 2. Cabeceras (thead y th) -> TRANSPARENTES para igualar a la vista principal */
:deep(.p-datatable-thead),
:deep(.p-datatable-thead > tr),
:deep(.p-datatable-thead > tr > th) {
    background-color: transparent !important; 
    color: #94a3b8 !important; 
    border: none !important; 
    border-bottom: 1px solid #4a5568 !important; 
    padding: 1.2rem 1rem !important;
}

/* 3. Filas y Celdas del cuerpo (tbody, tr, td) */
:deep(.p-datatable-tbody),
:deep(.p-datatable-tbody > tr),
:deep(.p-datatable-tbody > tr > td) {
    background-color: #121820 !important; 
    color: #ffffff !important; 
    border: none !important; 
    border-bottom: 1px solid #1e252d !important; 
}

/* 4. Hover de la fila y fila vacía */
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
    border-top: 1px solid #4a5568 !important; /* Línea separadora igual a la vista 1 */
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
    background-color: rgba(34, 197, 94, 0.15) !important; /* Fondo verde translúcido */
    color: #4ade80 !important; /* Texto verde brillante */
}
:deep(.p-tag.p-tag-danger) {
    background-color: rgba(239, 68, 68, 0.15) !important; /* Fondo rojo translúcido */
    color: #f87171 !important; /* Texto rojo brillante */
}
</style>