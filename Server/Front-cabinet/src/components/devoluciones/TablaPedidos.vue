<script setup>
import { ref, onMounted, onUnmounted } from 'vue'; 
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

// Componentes del buscador
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import { FilterMatchMode } from '@primevue/core/api';

defineProps({
    pedidos: {
        type: Array,
        required: true
    },
    cargando: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['revisar']);

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

const filtros = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const formatearFecha = (fechaString) => {
    if (!fechaString) return 'N/A';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-MX', { 
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
};
</script>

<template>
    <DataTable 
      :value="pedidos" 
      :paginator="true" 
      :rows="10" 
      :loading="cargando"
      dataKey="id"
      v-model:filters="filtros"
      :globalFilterFields="['id', 'trabajadorNumero', 'trabajadorNombre']"
      class="tabla-oscura w-full"
      emptyMessage="No hay préstamos pendientes de devolución."
      :scrollable="esMovil"
    >
      <template #header>
          <div class="flex justify-content-end">
              <IconField iconPosition="left" class="w-full sm:w-20rem">
                  <InputIcon class="pi pi-search" />
                  <InputText 
                      id="buscadorDevoluciones"
                      name="buscadorDevoluciones"
                      aria-label="Buscar por folio o empleado"
                      v-model="filtros['global'].value" 
                      placeholder="Buscar por folio o empleado..." 
                      class="w-full input-oscuro" 
                      autocomplete="off"
                  />
              </IconField>
          </div>
      </template>

      <Column field="id" header="Folio Pedido" :style="esMovil ? { minWidth: '120px' } : { width: '15%' }">
          <template #body="{ data }">
              <span class="font-bold text-400">#{{ data.id }}</span>
          </template>
      </Column>
      
      <Column field="trabajadorNumero" header="No. Empleado" :style="esMovil ? { minWidth: '140px' } : { width: '15%' }"></Column>
      
      <Column field="trabajadorNombre" header="Nombre del Trabajador" :style="esMovil ? { minWidth: '220px' } : { width: '30%' }"></Column>
      
      <Column header="Fecha de Préstamo" :style="esMovil ? { minWidth: '160px' } : { width: '20%' }">
          <template #body="{ data }">
              {{ formatearFecha(data.fechaPedido) }}
          </template>
      </Column>
      
      <Column header="Estado" :style="esMovil ? { minWidth: '120px' } : { width: '10%' }">
          <template #body>
              <Tag severity="danger" value="Pendiente" class="px-3 py-1 bg-red-500 text-white font-bold" style="border-radius: 4px;" />
          </template>
      </Column>
      
      <Column header="Acción" :style="esMovil ? { minWidth: '140px' } : { width: '10%' }">
        <template #body="{ data }">
            <Button 
                icon="pi pi-replay" 
                label="Devolver" 
                class="btn-accion-devolver p-button-sm w-full sm:w-auto" 
                @click="emit('revisar', data)" 
            />
        </template>
      </Column>
    </DataTable>
</template>

<style scoped>
/* =========================================================
   BLINDAJE NUCLEAR DE LA TABLA 
   ========================================================= */

/* Fondo de la tabla y envolturas */
:deep(.p-datatable),
:deep(.p-datatable-wrapper),
:deep(.p-datatable-table) {
    background-color: transparent !important;
}

/* Cabeceras (thead y th) */
:deep(.p-datatable-thead),
:deep(.p-datatable-thead > tr),
:deep(.p-datatable-thead > tr > th) {
    background-color: #121820 !important; 
    color: #94a3b8 !important; 
    border: none !important; 
    border-bottom: 1px solid #4a5568 !important; 
    padding: 1.2rem 1rem !important;
}

/* Filas y Celdas del cuerpo */
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
    text-align: center;
}

/* Cabecera superior (donde está el buscador) */
:deep(.p-datatable-header) { 
    background-color: transparent !important; 
    border: none !important; 
    padding: 0 0 1rem 0 !important;
}

/* =========================================================
   BUSCADOR Y PAGINADOR
   ========================================================= */
:deep(.input-oscuro) { 
    background-color: #121820 !important; 
    color: #ffffff !important; 
    border: 1px solid #4a5568 !important; 
}
:deep(.input-oscuro:focus) { 
    border-color: #5ab1ce !important; 
    box-shadow: 0 0 0 1px #5ab1ce !important; 
}

:deep(.p-paginator) { 
    background-color: transparent !important; 
    border: none !important; 
    margin-top: 1rem;
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
   BOTONES Y SCROLL HORIZONTAL
   ========================================================= */
.btn-accion-devolver { 
    background-color: #3b82f6 !important; 
    border: none !important; 
    font-weight: bold; 
}

/* Scroll horizontal responsivo */
:deep(.p-datatable-wrapper::-webkit-scrollbar) { height: 6px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-thumb) { background: #4a5568; border-radius: 4px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-track) { background: transparent; }
</style>