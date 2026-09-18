<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router'; 
import { FilterMatchMode } from '@primevue/core/api';
import { useHerramientas } from '@/composables/useHerramientas';
import { useGestorArchivos } from '@/composables/useGestordeArchivos'; 
import Menu from 'primevue/menu';
import Chip from 'primevue/chip';
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

const busquedaTexto = ref('');
const sortFieldActual = ref('id');
const sortOrderActual = ref('ASC');

const categoriasDisponibles = computed(() => [
    { key: 'codigo', label: t('view_inventario.categorias.codigo') },
    { key: 'nombre', label: t('view_inventario.categorias.nombre') },
    { key: 'tipo', label: t('view_inventario.categorias.tipo') },
    { key: 'ubicacion', label: t('view_inventario.categorias.ubicacion') }
]);

const categoriasSeleccionadas = ref(['codigo', 'nombre', 'tipo', 'ubicacion']);

const toggleCategoria = (key) => {
    const idx = categoriasSeleccionadas.value.indexOf(key);
    if (idx > -1) {
        if (categoriasSeleccionadas.value.length > 1) {
            categoriasSeleccionadas.value.splice(idx, 1);
        }
    } else {
        categoriasSeleccionadas.value.push(key);
    }
};

const placeholderDinamico = computed(() => {
    if (categoriasSeleccionadas.value.length === categoriasDisponibles.value.length) {
        return t('view_inventario.ph_buscar');
    }
    const nombres = categoriasDisponibles.value
        .filter(c => categoriasSeleccionadas.value.includes(c.key))
        .map(c => c.label.toLowerCase())
        .join(', ');
    return `${t('view_inventario.buscar_en')} ${nombres}...`;
});

const filtros = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const solicitarCarga = () => {
    cargarHerramientas({
        page: paginaActual.value, 
        limit: 10,
        search: busquedaTexto.value,
        categories: categoriasSeleccionadas.value.join(','),
        sortField: sortFieldActual.value,
        sortOrder: sortOrderActual.value,
        soloAlertas: verSoloAlertas.value
    });
};

let timeoutBusqueda = null;
watch([busquedaTexto, categoriasSeleccionadas], () => {
    clearTimeout(timeoutBusqueda);
    timeoutBusqueda = setTimeout(() => {
        paginaActual.value = 1;
        solicitarCarga();
    }, 300);
}, { deep: true });

const toggleAlertas = () => {
    verSoloAlertas.value = !verSoloAlertas.value;
    paginaActual.value = 1;
    solicitarCarga();
};

const manejarSeleccion = (seleccion) => {
    herramientaSeleccionada.value = seleccion;
};

const abrirDetalles = (herramienta) => {
    herramientaActual.value = { ...herramienta };
    mostrarModalDetalle.value = true;
};

const cambiarPagina = (evento) => {
    paginaActual.value = evento.page;
    solicitarCarga();
};

const manejarOrden = (event) => {
    if (!event.sortField) return;

    sortFieldActual.value = event.sortField;
    sortOrderActual.value = event.sortOrder === 1 ? 'ASC' : 'DESC';

    solicitarCarga();
};

const opcionesExportar = computed(() => [
    {
        label: t('export.exportar_csv'),
        icon: 'pi pi-file',
        command: () => exportarInventario(herramientas.value, 'csv')
    },
    {
        label: t('export.exportar_excel'),
        icon: 'pi pi-file-excel',
        command: () => exportarInventario(herramientas.value, 'xlsx')
    }
]);

const toggleExportar = (event) => menuExportar.value.toggle(event);
const irABitacora = () => router.push('/bitacora');
const irAMovimientos = () => router.push('/movimientos'); 

onMounted(() => {
    solicitarCarga();
});
</script>

<template>
  <div class="panel-principal p-3 md:p-4 border-round-xl shadow-1 mt-4">
    
    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0 titulo-vista">{{ t('view_inventario.titulo') }}</h2>
    </div>

    <div class="flex flex-column gap-3 mb-4 p-3 toolbar-oscuro border-round">
      <div class="flex flex-wrap gap-2 w-full justify-content-between align-items-center">
        <div class="flex flex-wrap gap-2 w-full sm:w-auto">
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
                @click="toggleAlertas" 
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
      </div>

      <div class="w-full mt-2">
        <div class="flex flex-wrap align-items-center gap-2 mb-2">
            <span class="text-sm font-bold text-400 mr-2">{{ t('view_inventario.buscar_en') }}</span>
            <Chip 
                v-for="cat in categoriasDisponibles" 
                :key="cat.key"
                :label="cat.label"
                :class="['chip-categoria cursor-pointer', { 'active': categoriasSeleccionadas.includes(cat.key) }]"
                @click="toggleCategoria(cat.key)"
            />
        </div>

        <IconField iconPosition="left" class="w-full">
          <InputIcon class="pi pi-search" />
          <InputText 
              id="buscadorInventario"
              name="buscadorInventario"
              :aria-label="t('view_inventario.ph_buscar')"
              v-model="busquedaTexto" 
              :placeholder="placeholderDinamico" 
              class="input-oscuro w-full input-buscador-grande" 
              autocomplete="off"
          />
        </IconField>
      </div>
    </div>

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
        @toggle-categoria="toggleCategoria"
    />

    <ModalDetalleHerramienta
        v-model:visible="mostrarModalDetalle"
        :herramienta="herramientaActual"
        :ocultarBotonAgregar="true"
    />
  </div>
</template>

<style scoped>
.titulo-vista { color: #5ab1ce; }

.input-buscador-grande {
    font-size: 1.05rem;
    padding: 0.75rem 1rem 0.75rem 2.5rem !important;
}

.chip-categoria {
    background-color: #1e293b;
    color: #94a3b8;
    border: 1px solid #334155;
    transition: all 0.2s ease;
    user-select: none;
}
.chip-categoria:hover {
    border-color: #5ab1ce;
    color: #e2e8f0;
}
.chip-categoria.active {
    background-color: #0284c7;
    color: #ffffff;
    border-color: #38bdf8;
    font-weight: 600;
}

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
</style>