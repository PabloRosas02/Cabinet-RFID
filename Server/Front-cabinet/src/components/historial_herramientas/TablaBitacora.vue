<script setup>
import { computed } from 'vue'; 
import Button from 'primevue/button';
import TablaGenerica from '@/components/TablaGenerica.vue';
import { formatearFecha } from '@/utils/dateHelper'; 
import { traducirDetalleBitacora } from '@/utils/bitacoraFormatter';
import { useI18n } from 'vue-i18n'; 

const { t, locale } = useI18n(); 

const props = defineProps({
    bitacora: { type: Array, required: true },
    cargando: { type: Boolean, default: false },
    filtros: { type: Object, required: true },
    totalRecords: { type: Number, default: 0 },
    paginaActual: { type: Number, default: 1 },
    filasPorPagina: { type: Number, default: 10 },
    mensajeVacio: { type: [String, null], default: null },
    iconoVacio: { type: String, default: 'pi-list' }
});

const formatearRol = (rol) => {
    if (!rol) return t('export.na');
    const rolNormalizado = String(rol).toUpperCase().replace(/\s+/g, '_');
    return t(`roles.${rolNormalizado}`, rol.replace('_', ' '));
};

const emit = defineEmits(['doble-click', 'cambio-pagina']);

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

const getTextoAccion = (accion) => {
    const mapaAcciones = {
        'CREACION': t('tabla_bitacora.accion_creacion'),
        'MODIFICACION': t('tabla_bitacora.accion_modificacion'),
        'ELIMINACION': t('tabla_bitacora.accion_eliminacion')
    };
    return mapaAcciones[accion] || accion;
};

const abrirDetalles = (data) => emit('doble-click', data);

const manejarCambioPagina = (evento) => {
    const nuevaPagina = (evento.page !== undefined ? evento.page + 1 : 1);
    const limite = evento.rows || props.filasPorPagina;
    
    emit('cambio-pagina', { page: nuevaPagina, limit: limite });
};
</script>

<template>
    <TablaGenerica
        :datos="bitacora"
        :columnas="columnasBitacora"
        :cargando="cargando"
        :filtros="filtros"
        :lazy="true"
        :totalRecords="totalRecords"
        :paginaActual="paginaActual"
        :filasPorPagina="filasPorPagina"
        llaveMemoria="vista_bitacora"
        dataKey="id"
        :iconoVacio="iconoVacio"
        :mensajeVacio="mensajeVacio || t('tabla_bitacora.mensaje_vacio')"
        @doble-click="abrirDetalles"
        @page="manejarCambioPagina"
    >
        <template #fecha="{ data }">
            {{ formatearFecha(data.fecha, locale) }}
        </template>

        <template #accion="{ data }">
            <span :class="['badge-accion', getBadgeClase(data.accion)]">
                {{ getTextoAccion(data.accion) }}
            </span>
        </template>

        <template #herramienta="{ data }">
            <div class="font-bold text-primary">{{ data.herramienta?.codigo || t('tabla_bitacora.no_aplica') }}</div>
            <div class="text-sm text-color-secondary">{{ data.herramienta?.nombre || t('tabla_bitacora.herramienta_eliminada') }}</div>
        </template>

        <template #detalle="{ data }">
            <div class="flex align-items-center gap-2">
                <Button 
                    icon="pi pi-eye" 
                    class="p-button-rounded p-button-text p-button-info btn-ver p-0 m-0" 
                    style="height: 2rem; width: 2rem;" 
                    :aria-label="t('tabla_bitacora.aria_ver_detalles')"
                    @click.stop="abrirDetalles(data)" 
                />
                <span class="text-sm text-color-secondary overflow-hidden text-overflow-ellipsis white-space-nowrap" style="max-width: 200px;">
                    {{ traducirDetalleBitacora(data.detalle, t) || t('tabla_bitacora.registro_estandar') }}
                </span>
            </div>
        </template>

        <!-- Reemplazar el slot #usuario en TablaBitacora.vue -->
        <template #usuario="{ data }">
            <div class="font-bold">
                <i class="pi pi-user mr-2 text-color-secondary"></i>
                {{ data.usuario?.nombre || t('tabla_bitacora.sistema') }}
            </div>
            <div class="text-sm text-color-secondary uppercase">
                {{ formatearRol(data.usuario?.rol) }}
            </div>
        </template>
    </TablaGenerica>
</template>