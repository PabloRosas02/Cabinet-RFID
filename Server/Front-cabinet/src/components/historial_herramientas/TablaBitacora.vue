<script setup>
import { computed } from 'vue'; 
import Button from 'primevue/button';
import TablaGenerica from '@/components/TablaGenerica.vue';
import { formatearFecha } from '@/utils/dateHelper'; 
import { useI18n } from 'vue-i18n'; 

const { t, locale } = useI18n(); 

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
        default: null 
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
const columnasBitacora = computed(() => [
    { header: t('tabla_bitacora.fecha_hora'), width: '15%', minWidth: '140px', slotName: 'fecha' },
    { header: t('tabla_bitacora.accion'), width: '12%', minWidth: '130px', slotName: 'accion' },
    { header: t('tabla_bitacora.herramienta'), width: '23%', minWidth: '200px', slotName: 'herramienta' },
    { header: t('tabla_bitacora.detalle_breve'), width: '30%', minWidth: '250px', slotName: 'detalle' },
    { header: t('tabla_bitacora.usuario_responsable'), width: '20%', minWidth: '180px', slotName: 'usuario' }
]);

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
        :mensajeVacio="mensajeVacio || t('tabla_bitacora.mensaje_vacio')"
        @doble-click="abrirDetalles"
    >
        <!-- Slot Personalizado: Fecha (Pasando 'locale') -->
        <template #fecha="{ data }">
            {{ formatearFecha(data.fecha, locale) }}
        </template>

        <!-- Slot Personalizado: Acción (Interceptando valores de BD) -->
        <template #accion="{ data }">
            <span :class="['badge-accion', getBadgeClase(data.accion)]">
                {{ 
                    data.accion === 'CREACION' ? t('tabla_bitacora.accion_creacion') :
                    data.accion === 'MODIFICACION' ? t('tabla_bitacora.accion_modificacion') :
                    data.accion === 'ELIMINACION' ? t('tabla_bitacora.accion_eliminacion') : data.accion
                }}
            </span>
        </template>

        <!-- Slot Personalizado: Herramienta -->
        <template #herramienta="{ data }">
            <div class="font-bold text-blue-300">{{ data.herramienta?.codigo || t('tabla_bitacora.no_aplica') }}</div>
            <div class="text-sm text-gray-400">{{ data.herramienta?.nombre || t('tabla_bitacora.herramienta_eliminada') }}</div>
        </template>

        <!-- Slot Personalizado: Detalle -->
        <template #detalle="{ data }">
            <div class="flex align-items-center gap-2">
                <Button 
                    icon="pi pi-eye" 
                    class="p-button-rounded p-button-text p-button-info btn-ver p-0 m-0" 
                    style="height: 2rem; width: 2rem;" 
                    :aria-label="t('tabla_bitacora.aria_ver_detalles')"
                    @click.stop="abrirDetalles(data)" 
                />
                <span class="text-sm text-gray-400 overflow-hidden text-overflow-ellipsis white-space-nowrap" style="max-width: 200px;">
                    {{ data.detalle || t('tabla_bitacora.registro_estandar') }}
                </span>
            </div>
        </template>

        <!-- Slot Personalizado: Usuario -->
        <template #usuario="{ data }">
            <div class="font-bold"><i class="pi pi-user mr-2 text-gray-400"></i>{{ data.usuario?.nombre || t('tabla_bitacora.sistema') }}</div>
            <div class="text-sm text-gray-400">{{ data.usuario?.rol || t('tabla_bitacora.no_aplica') }}</div>
        </template>
    </TablaGenerica>
</template>