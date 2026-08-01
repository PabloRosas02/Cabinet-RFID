<script setup>
import TablaGenerica from '@/components/TablaGenerica.vue';
import Button from 'primevue/button';

const props = defineProps({
    herramientas: Array,
    cargando: Boolean,
    filtros: Object,
    llaveMemoria: { 
        type: String, 
        default: 'inventario_general' 
    },
    mensajeVacio: {
        type: String,
        default: 'No se encontraron herramientas con los filtros actuales.'
    },
    iconoVacio: {
        type: String,
        default: 'pi-box'
    }
});

const emit = defineEmits(['seleccion', 'doble-click']);

const columnas = [
    { field: 'codigo', header: 'Código', sortable: true, width: '15%', minWidth: '120px' },
    { field: 'nombre', header: 'Nombre', sortable: true, width: '25%', minWidth: '200px' },
    { field: 'tipo', header: 'Tipo', sortable: true, width: '15%', minWidth: '140px' },
    { field: 'ubicacion', header: 'Ubicación', sortable: true, width: '15%', minWidth: '140px' },
    { field: 'cantidadMinima', header: 'Stock Mín.', sortable: true, width: '10%', minWidth: '120px' },
    { field: 'cantidadDisponible', header: 'Stock Físico', sortable: true, width: '15%', minWidth: '130px', slotName: 'stock' },
    { width: '5%', minWidth: '70px', slotName: 'acciones' }
];

const getEstadoStock = (herramienta) => {
    if (herramienta.cantidadDisponible < herramienta.cantidadMinima) return 'agotado';
    if (herramienta.cantidadDisponible === herramienta.cantidadMinima) return 'alerta';
    return 'optimo';
};
</script>

<template>
    <TablaGenerica 
        :datos="herramientas"
        :columnas="columnas"
        :cargando="cargando"
        :filtros="filtros"
        :globalFilterFields="['codigo', 'nombre', 'tipo', 'ubicacion']" 
        :llaveMemoria="llaveMemoria"
        :seleccionable="true"
        :mensajeVacio="mensajeVacio"
        :iconoVacio="iconoVacio"
        @seleccion="emit('seleccion', $event)"
        @doble-click="emit('doble-click', $event)"
    >
        <!-- Inyectamos el diseño para la columna 'stock' -->
        <template #stock="{ data }">
            <span :class="['badge-stock', getEstadoStock(data)]">
                {{ data.cantidadDisponible }}
            </span>
        </template>

        <!-- Inyectamos el diseño para la columna 'acciones' -->
        <template #acciones="{ data }">
            <Button 
                icon="pi pi-eye" 
                class="p-button-rounded p-button-text p-button-info btn-ver" 
                @click.stop="emit('doble-click', data)" 
            />
        </template>
    </TablaGenerica>
</template>

<style scoped>
/* Solo conservamos los estilos específicos de esta vista */
.badge-stock { padding: 0.35rem 0.75rem; border-radius: 6px; font-weight: 800; display: inline-block; }
.optimo { background-color: rgba(74, 222, 128, 0.15); color: #4ade80; }
.alerta { background-color: rgba(250, 204, 21, 0.15); color: #facc15; }
.agotado { background-color: rgba(248, 113, 113, 0.15); color: #f87171; }

:deep(.btn-ver) { color: #38bdf8 !important; background-color: rgba(56, 189, 248, 0.1) !important; width: 2.5rem !important; height: 2.5rem !important; }
:deep(.btn-ver:hover) { background-color: rgba(56, 189, 248, 0.25) !important; }
</style>