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
/* Tabla Oscura */
:deep(.tabla-oscura .p-datatable-thead > tr > th) {
    background-color: transparent !important; color: #94a3b8 !important;
    border: none !important; border-bottom: 1px solid #4a5568 !important; padding: 1.2rem 1rem;
}
:deep(.tabla-oscura .p-datatable-tbody > tr > td) {
    background-color: #121820 !important; color: #ffffff !important;
    border: none !important; border-bottom: 1px solid #1e252d !important; padding: 1rem;
}
:deep(.tabla-oscura .p-datatable-tbody > tr:hover > td) { background-color: #1e252d !important; }

/* Paginador y Mensaje de vacío */
:deep(.p-paginator) { background-color: transparent !important; border: none !important; margin-top: 1rem;}
:deep(.p-paginator .p-paginator-page) { color: #94a3b8 !important; }
:deep(.p-paginator .p-paginator-page.p-highlight) { background-color: #5ab1ce !important; color: #ffffff !important; border-radius: 50%; }
:deep(.tabla-oscura .p-datatable-empty-message > td) { background-color: #121820 !important; color: #94a3b8 !important; text-align: center; padding: 2rem; font-weight: 500; }
</style>