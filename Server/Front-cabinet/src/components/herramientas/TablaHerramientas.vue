<script setup>
import { computed } from 'vue'; 
import { useI18n } from 'vue-i18n'; 
import TablaGenerica from '@/components/TablaGenerica.vue';
import Button from 'primevue/button';

const { t } = useI18n();

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
        default: null // Lo dejamos en null para inyectar la traducción en el template
    },
    iconoVacio: {
        type: String,
        default: 'pi-box'
    }
});

const emit = defineEmits(['seleccion', 'doble-click']);

// Convertimos las columnas en una propiedad computada para que reaccionen al cambio de idioma
const columnas = computed(() => [
    { field: 'codigo', header: t('tabla_herramientas.codigo'), sortable: true, width: '15%', minWidth: '120px' },
    { field: 'nombre', header: t('tabla_herramientas.nombre'), sortable: true, width: '25%', minWidth: '200px' },
    { field: 'tipo', header: t('tabla_herramientas.tipo'), sortable: true, width: '15%', minWidth: '140px' },
    { field: 'ubicacion', header: t('tabla_herramientas.ubicacion'), sortable: true, width: '15%', minWidth: '140px' },
    { field: 'cantidadMinima', header: t('tabla_herramientas.stock_min'), sortable: true, width: '10%', minWidth: '120px' },
    { field: 'cantidadMaxima', header: t('tabla_herramientas.stock_max', 'Stock Máx'), sortable: true, width: '10%', minWidth: '120px' },
    { field: 'cantidadDisponible', header: t('tabla_herramientas.stock_fisico'), sortable: true, width: '15%', minWidth: '130px', slotName: 'stock' },
    { width: '5%', minWidth: '70px', slotName: 'acciones' }
]);

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
        :mensajeVacio="mensajeVacio || t('tabla_herramientas.mensaje_vacio')"
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
            <!-- La clase .btn-ver ya está en el main.css -->
            <Button 
                icon="pi pi-eye" 
                class="p-button-rounded p-button-text p-button-info btn-ver" 
                @click.stop="emit('doble-click', data)" 
            />
        </template>
    </TablaGenerica>
</template>

<style scoped>
.badge-stock { padding: 0.35rem 0.75rem; border-radius: 6px; font-weight: 800; display: inline-block; }
.optimo { background-color: rgba(74, 222, 128, 0.15); color: #4ade80; }
.alerta { background-color: rgba(250, 204, 21, 0.15); color: #facc15; }
.agotado { background-color: rgba(248, 113, 113, 0.15); color: #f87171; }
</style>