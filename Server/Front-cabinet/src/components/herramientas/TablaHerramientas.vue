<script setup>
import { computed } from 'vue'; 
import { useI18n } from 'vue-i18n'; 
import TablaGenerica from '@/components/TablaGenerica.vue';
import Button from 'primevue/button';

const { t } = useI18n();

const props = defineProps({
    herramientas: {
        type: Array,
        default: () => []
    },
    cargando: {
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
    },
    filtros: {
        type: Object,
        default: () => ({})
    },
    llaveMemoria: { 
        type: String, 
        default: 'inventario_general' 
    },
    mensajeVacio: {
        type: String,
        default: null
    },
    iconoVacio: {
        type: String,
        default: 'pi-box'
    }
});

const emit = defineEmits(['seleccion', 'doble-click', 'cambio-pagina', 'ordenar', 'toggle-categoria']);

const columnas = computed(() => [
    { field: 'codigo', header: t('tabla_herramientas.codigo'), sortable: true, width: '12%', minWidth: '110px' },
    { field: 'nombre', header: t('tabla_herramientas.nombre'), sortable: true, width: '22%', minWidth: '180px' },
    { field: 'tipo', header: t('tabla_herramientas.tipo'), sortable: true, width: '13%', minWidth: '120px' },
    { field: 'ubicacion', header: t('tabla_herramientas.ubicacion'), sortable: true, width: '13%', minWidth: '120px' },
    { field: 'esDesechable', header: t('tabla_herramientas.desechable'), sortable: true, width: '10%', minWidth: '100px', slotName: 'desechable' },
    { field: 'cantidadMinima', header: t('tabla_herramientas.stock_min'), sortable: true, width: '10%', minWidth: '100px' },
    { field: 'cantidadMaxima', header: t('tabla_herramientas.stock_max'), sortable: true, width: '10%', minWidth: '100px' },
    { field: 'cantidadDisponible', header: t('tabla_herramientas.stock_fisico'), sortable: true, width: '10%', minWidth: '110px', slotName: 'stock' },
    { width: '5%', minWidth: '60px', slotName: 'acciones' }
]);

const getEstadoStock = (herramienta) => {
    if (!herramienta) return 'optimo';
    if (herramienta.cantidadDisponible < herramienta.cantidadMinima) return 'agotado';
    if (herramienta.cantidadDisponible === herramienta.cantidadMinima) return 'alerta';
    return 'optimo';
};

const manejarCambioPagina = (event) => {
    const nuevaPagina = (event.page !== undefined) ? event.page + 1 : event.pagina;
    const limit = event.rows || props.filasPorPagina;
    emit('cambio-pagina', { page: nuevaPagina, limit });
};
</script>

<template>
    <div class="tabla-contenedor-interactivo">
        <TablaGenerica 
            :datos="herramientas"
            :columnas="columnas"
            :cargando="cargando"
            :lazy="true"
            :totalRecords="totalRecords"
            :rows="filasPorPagina"
            :first="(paginaActual - 1) * filasPorPagina"
            :filtros="filtros"
            :globalFilterFields="['codigo', 'nombre', 'tipo', 'ubicacion']" 
            :llaveMemoria="llaveMemoria"
            :seleccionable="true"
            :mensajeVacio="mensajeVacio || t('tabla_herramientas.mensaje_vacio')"
            :iconoVacio="iconoVacio"
            @page="manejarCambioPagina"
            @cambio-pagina="manejarCambioPagina"
            @seleccion="emit('seleccion', $event)"
            @sort="emit('ordenar', $event)"
            @doble-click="emit('doble-click', $event)"
        >
            <template #desechable="{ data }">
                <div class="text-center">
                    <i v-if="data.esDesechable || data.es_desechable" class="pi pi-check font-bold text-green-400 text-lg"></i>
                    <span v-else class="text-gray-500">-</span>
                </div>
            </template>

            <template #stock="{ data }">
                <span :class="['badge-stock', getEstadoStock(data)]">
                    {{ data.cantidadDisponible }}
                </span>
            </template>

            <template #acciones="{ data }">
                <Button 
                    icon="pi pi-eye" 
                    class="p-button-rounded p-button-text p-button-info btn-ver"
                    :title="t('tabla_herramientas.btn_ver_detalles')"
                    :aria-label="t('tabla_herramientas.btn_ver_detalles')"
                    @click.stop="emit('doble-click', data)" 
                />
            </template>
        </TablaGenerica>
    </div>
</template>

<style scoped>
.badge-stock { 
    padding: 0.35rem 0.75rem; 
    border-radius: 6px; 
    font-weight: 800; 
    display: inline-block; 
}
.optimo { 
    background-color: rgba(74, 222, 128, 0.15); 
    color: #4ade80; 
}
.alerta { 
    background-color: rgba(250, 204, 21, 0.15); 
    color: #facc15; 
}
.agotado { 
    background-color: rgba(248, 113, 113, 0.15); 
    color: #f87171; 
}

:global(html.light-theme) .optimo { 
    background-color: #dcfce7; 
    color: #166534; 
}
:global(html.light-theme) .alerta { 
    background-color: #fef9c3; 
    color: #854d0e; 
}
:global(html.light-theme) .agotado { 
    background-color: #fee2e2; 
    color: #991b1b; 
}
</style>