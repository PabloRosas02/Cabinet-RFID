<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n'; 
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const { t } = useI18n(); 

const props = defineProps({
    datos: { 
      type: Array, 
      required: true, 
      default: () => [] 
    },
    columnas: { 
      type: Array, 
      required: true, 
      default: () => [] 
    },
    cargando: { 
      type: Boolean, 
      default: false 
    },
    filtros: { 
      type: Object, 
      default: null 
    },
    globalFilterFields: { 
      type: Array, 
      default: () => [] 
    }, 
    llaveMemoria: { 
      type: String, 
      required: true 
    },
    seleccionable: { 
      type: Boolean, 
      default: false 
    },
    dataKey: { 
      type: String, 
      default: 'id' 
    },
    mensajeVacio: { 
      type: String, 
      default: '' 
    }, 
    iconoVacio: { 
      type: String, 
      default: 'pi-box' 
    },
    lazy: { 
      type: Boolean, 
      default: false 
    },
    totalRecords: { 
      type: Number, 
      default: 0 
    },
    paginaActual: { 
      type: Number, 
      default: 1 
    },
    filasPorPagina: { 
      type: Number, 
      default: 10 
    }
});

const emit = defineEmits(['seleccion', 'doble-click', 'page', 'sort', 'filter']);
const filaSeleccionada = ref(null);

const onSelectionChange = (valor) => emit('seleccion', valor);
const onRowDoubleClick = (event) => emit('doble-click', event.data);

const primerRegistro = computed(() => (props.paginaActual - 1) * props.filasPorPagina);

const obtenerClaseFila = (data) => {
    if (props.seleccionable && filaSeleccionada.value && filaSeleccionada.value[props.dataKey] === data[props.dataKey]) {
        return 'fila-activa-crissair';
    }
    return '';
};

const textoVacio = computed(() => props.mensajeVacio || t('tabla_generica.mensaje_vacio'));
</script>

<template>
  <div class="tabla-contenedor mt-4">
    <DataTable 
        :value="datos" 
        v-model:selection="filaSeleccionada" 
        @update:selection="onSelectionChange"
        @row-dblclick="onRowDoubleClick"
        
        @page="$emit('page', $event)"
        @sort="$emit('sort', $event)"
        @filter="$emit('filter', $event)"
        
        :lazy="lazy"
        :totalRecords="lazy ? totalRecords : null"
        :first="lazy ? primerRegistro : null"
        
        :selectionMode="seleccionable ? 'single' : null" 
        :paginator="true" 
        :rows="filasPorPagina" 
        :filters="filtros"
        :globalFilterFields="globalFilterFields" 
        :loading="cargando"
        :dataKey="dataKey"
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