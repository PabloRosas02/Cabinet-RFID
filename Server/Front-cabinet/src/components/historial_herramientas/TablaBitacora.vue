<script setup>
import Button from 'primevue/button';
import TablaGenerica from '@/components/TablaGenerica.vue';
import { formatearFecha } from '@/utils/dateHelper'; 

const props = defineProps({
    bitacora: {
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
    },
    mensajeVacio: {
        type: String,
        default: 'No hay movimientos en la bitácora con estos filtros.'
    },
    iconoVacio: {
        type: String,
        default: 'pi-list'
    }
});

const emit = defineEmits(['doble-click']);

// =====================================================
// DEFINICIÓN DINÁMICA DE COLUMNAS
// =====================================================
const columnasBitacora = [
    { header: 'Fecha / Hora', width: '15%', minWidth: '140px', slotName: 'fecha' },
    { header: 'Acción', width: '12%', minWidth: '130px', slotName: 'accion' },
    { header: 'Herramienta', width: '23%', minWidth: '200px', slotName: 'herramienta' },
    { header: 'Detalle Breve (Doble clic para ver más)', width: '30%', minWidth: '250px', slotName: 'detalle' },
    { header: 'Usuario Responsable', width: '20%', minWidth: '180px', slotName: 'usuario' }
];

const getBadgeClase = (accion) => {
    if (accion === 'CREACION') return 'badge-creacion';
    if (accion === 'MODIFICACION') return 'badge-modificacion';
    if (accion === 'ELIMINACION') return 'badge-eliminacion';
    return 'badge-default';
};

const abrirDetalles = (data) => {
    emit('doble-click', data);
};
</script>

<template>
    <TablaGenerica
        :datos="bitacora"
        :columnas="columnasBitacora"
        :cargando="cargando"
        :filtros="filtros"
        llaveMemoria="vista_bitacora"
        dataKey="id"
        :iconoVacio="iconoVacio"
        :mensajeVacio="mensajeVacio"
        @doble-click="abrirDetalles"
    >
        <!-- Slot Personalizado: Fecha -->
        <template #fecha="{ data }">
            {{ formatearFecha(data.fecha) }}
        </template>

        <!-- Slot Personalizado: Acción -->
        <template #accion="{ data }">
            <span :class="['badge-accion', getBadgeClase(data.accion)]">{{ data.accion }}</span>
        </template>

        <!-- Slot Personalizado: Herramienta -->
        <template #herramienta="{ data }">
            <div class="font-bold text-blue-300">{{ data.herramienta?.codigo || 'N/A' }}</div>
            <div class="text-sm text-gray-400">{{ data.herramienta?.nombre || 'Herramienta eliminada' }}</div>
        </template>

        <!-- Slot Personalizado: Detalle -->
        <template #detalle="{ data }">
            <div class="flex align-items-center gap-2">
                <Button 
                    icon="pi pi-eye" 
                    class="p-button-rounded p-button-text p-button-info p-0 m-0" 
                    style="height: 2rem; width: 2rem;" 
                    @click.stop="abrirDetalles(data)" 
                />
                <span class="text-sm text-gray-400 overflow-hidden text-overflow-ellipsis white-space-nowrap" style="max-width: 200px;">
                    {{ data.detalle || 'Registro estándar' }}
                </span>
            </div>
        </template>

        <!-- Slot Personalizado: Usuario -->
        <template #usuario="{ data }">
            <div class="font-bold"><i class="pi pi-user mr-2 text-gray-400"></i>{{ data.usuario?.nombre || 'Sistema' }}</div>
            <div class="text-sm text-gray-400">{{ data.usuario?.rol || 'N/A' }}</div>
        </template>
    </TablaGenerica>
</template>

<style scoped>
/* Badges de Acción específicos para la bitácora */
.badge-accion { padding: 0.35rem 0.75rem; border-radius: 6px; font-weight: 800; display: inline-block; font-size: 0.85rem; text-align: center;}
.badge-creacion { background-color: rgba(74, 222, 128, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); }
.badge-modificacion { background-color: rgba(96, 165, 250, 0.15); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.3); }
.badge-eliminacion { background-color: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }
.badge-default { background-color: rgba(148, 163, 184, 0.15); color: #94a3b8; }
</style>