<script setup>
import { computed } from 'vue';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import { formatearFecha } from '@/utils/dateHelper';
import { useI18n } from 'vue-i18n';
import { useMotivoTraductor } from '@/utils/formatters';

const props = defineProps({
    mostrar: Boolean,
    pedido: Object
});

const emit = defineEmits(['cerrar']);
const { t } = useI18n();
const { obtenerMotivoTraducido } = useMotivoTraductor();

const pedidoNormalizado = computed(() => {
    if (!props.pedido) return null;
    
    const herramientas = (props.pedido.herramientas || []).map(h => ({
        ...h,
        cantidadPrestada: h.pivot?.cantidad ?? h.cantidadPrestada ?? 0,
        cantidadRegresada: h.pivot?.cantidad_devuelta ?? h.cantidadRegresada ?? 0,
        esDesechable: h.esDesechable ?? h.es_desechable ?? false,
        historialDevoluciones: h.historialDevoluciones || []
    }));

    const hayReutilizables = herramientas.some(h => !h.esDesechable);
    const hayConsumibles = herramientas.some(h => h.esDesechable);
    const esSoloConsumible = hayConsumibles && !hayReutilizables;

    return {
        id: props.pedido.id,
        estado: props.pedido.estado,
        trabajadorNumero: props.pedido.empleado_numero || props.pedido.trabajadorNumero,
        trabajadorNombre: props.pedido.empleado_nombre || props.pedido.trabajadorNombre,
        prestadorNombre: props.pedido.almacenista_salida || props.pedido.prestadorNombre,
        receptorNombre: props.pedido.almacenista_entrada || props.pedido.receptorNombre,
        motivo: props.pedido.motivo_salida || props.pedido.motivo,
        motivoOtro: props.pedido.motivo_otro || props.pedido.motivoOtro,
        fechaSalida: props.pedido.fechaSalida || props.pedido.fecha_salida || props.pedido.created_at,
        fechaDevolucion: props.pedido.fechaDevolucion || props.pedido.fecha_devolucion,
        herramientas,
        hayReutilizables,
        hayConsumibles,
        esSoloConsumible
    };
});

// Ayudante para obtener la etiqueta de estado según el tipo de herramientas
const obtenerEtiquetaEstado = (pedidoNorm) => {
    if (pedidoNorm.estado === 'CONSUMIDO' || pedidoNorm.esSoloConsumible) {
        return t('modal_detalles_pedido.estado_consumido'); 
    }
    return pedidoNorm.estado === 'DEVUELTO' 
        ? t('modal_detalles_pedido.estado_devuelto') 
        : t('modal_detalles_pedido.estado_pendiente');
};

const obtenerSeveridadEstado = (pedidoNorm) => {
    if (pedidoNorm.estado === 'CONSUMIDO' || pedidoNorm.esSoloConsumible) {
        return 'info';
    }
    return pedidoNorm.estado === 'DEVUELTO' ? 'success' : 'danger';
};

const obtenerNombreReceptor = (pedidoNorm) => {
    if (pedidoNorm.esSoloConsumible) return t('modal_detalles_pedido.na_consumible'); 
    if (!pedidoNorm.receptorNombre) return t('modal_detalles_pedido.sin_entregas');
    if (pedidoNorm.receptorNombre === 'Pendiente / En curso') return t('modal_detalles_pedido.pendiente_curso');
    return pedidoNorm.receptorNombre;
};

const obtenerFechaDevolucion = (pedidoNorm) => {
    if (pedidoNorm.esSoloConsumible) return t('modal_detalles_pedido.na_no_requiere');
    if (!pedidoNorm.fechaDevolucion) return t('modal_detalles_pedido.pendiente_fecha');
    
    const fecha = formatearFecha(pedidoNorm.fechaDevolucion);
    return fecha.includes('Pendiente') ? t('modal_detalles_pedido.pendiente_fecha') : fecha;
};
</script>

<template>
    <Dialog 
        :visible="mostrar" 
        @update:visible="emit('cerrar')"
        modal 
        :header="t('modal_detalles_pedido.titulo')" 
        :style="{ width: '55rem' }"
        :breakpoints="{ '1199px': '75vw', '768px': '90vw', '575px': '95vw' }" 
        class="modal-oscuro"
        dismissableMask
    >
        <div v-if="pedidoNormalizado" class="p-2 md:p-3">
            <div class="grid mb-4">
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-color-secondary block">{{ t('modal_detalles_pedido.folio_pedido') }}</span>
                    <span class="text-xl font-bold text-color">#{{ pedidoNormalizado.id }}</span>
                </div>
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-color-secondary block">{{ t('modal_detalles_pedido.estado_actual') }}</span>
                    <Tag 
                        :severity="obtenerSeveridadEstado(pedidoNormalizado)" 
                        :value="obtenerEtiquetaEstado(pedidoNormalizado)" 
                    />
                </div>
                
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-color-secondary block">{{ t('modal_detalles_pedido.empleado') }}</span>
                    <span class="font-bold text-color">{{ pedidoNormalizado.trabajadorNumero }} - {{ pedidoNormalizado.trabajadorNombre }}</span>
                </div>
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-color-secondary block">{{ t('modal_detalles_pedido.almacenista_salida') }}</span>
                    <span class="font-bold text-color">{{ pedidoNormalizado.prestadorNombre }}</span>
                </div>

                <div class="col-12 md:col-6 mb-3">
                    <span class="text-color-secondary block">{{ t('modal_detalles_pedido.motivo_salida') }}</span>
                    <span class="font-bold text-color capitalize">
                        {{ obtenerMotivoTraducido(pedidoNormalizado.motivo, pedidoNormalizado.motivoOtro) }}
                    </span>
                </div>
                
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-color-secondary block">{{ t('modal_detalles_pedido.fecha_prestamo') }}</span>
                    <span class="text-color">{{ formatearFecha(pedidoNormalizado.fechaSalida) }}</span>
                </div>

                <!-- Ocultar o mostrar N/A si es solo consumible -->
                <div v-if="!pedidoNormalizado.esSoloConsumible" class="col-12 md:col-6 mb-3">
                    <span class="text-color-secondary block">{{ t('modal_detalles_pedido.almacenista_entrada') }}</span>
                    <span class="font-bold text-primary">
                        {{ obtenerNombreReceptor(pedidoNormalizado) }}
                    </span>
                </div>
                
                <div v-if="!pedidoNormalizado.esSoloConsumible" class="col-12 mb-2">
                    <span class="text-color-secondary block">{{ t('modal_detalles_pedido.fecha_devolucion') }}</span>
                    <span class="text-color">
                        {{ obtenerFechaDevolucion(pedidoNormalizado) }}
                    </span>
                </div>
            </div>

            <div class="border-top-1 surface-border pt-3">
                <h3 class="text-lg font-bold mb-3 text-primary">{{ t('modal_detalles_pedido.desglose_titulo') }}</h3>
                <ul class="list-none p-0 m-0">
                    <li v-for="(h, index) in pedidoNormalizado.herramientas" :key="index" class="surface-card p-3 md:p-4 mb-3 border-round border-1 surface-border shadow-1">
                        <div class="flex flex-column sm:flex-row justify-content-between mb-2 border-bottom-1 surface-border pb-2 gap-3 sm:gap-0">
                            <div>
                                <span class="font-bold text-color block text-lg">{{ h.nombre }}</span>
                                <span class="text-color-secondary text-sm">{{ t('modal_detalles_pedido.codigo') }}: {{ h.codigo }}</span>
                            </div>
                            
                            <!-- Cambios para consumibles a nivel individual de herramienta -->
                            <div class="text-left sm:text-right text-lg">
                                <span class="block text-color">
                                    {{ h.esDesechable ? t('modal_detalles_pedido.entregadas') : t('modal_detalles_pedido.prestadas') }}: <b>{{ h.cantidadPrestada }}</b>
                                </span>

                                <template v-if="!h.esDesechable">
                                    <span :class="h.cantidadRegresada >= h.cantidadPrestada ? 'text-green-500' : 'text-orange-500'">
                                        {{ t('modal_detalles_pedido.regresadas') }}: <b>{{ h.cantidadRegresada }}</b>
                                    </span>
                                </template>
                                <template v-else>
                                    <span class="text-blue-400 font-medium text-sm">
                                        {{ t('modal_detalles_pedido.consumible_sin_retorno') }} <!-- <-- Usar t() -->
                                    </span>
                                </template>
                            </div>
                        </div>

                        <!-- Historial de devoluciones solo para reutilizables -->
                        <template v-if="!h.esDesechable">
                            <div v-if="h.historialDevoluciones && h.historialDevoluciones.filter(d => d.cantidad > 0).length > 0" class="mt-3 p-3 surface-ground border-round border-1 surface-border">
                                <span class="text-xs text-color-secondary font-bold uppercase mb-2 block tracking-wide">{{ t('modal_detalles_pedido.rastreo_recepciones') }}</span>
                                
                                <template v-for="(dev, i) in h.historialDevoluciones" :key="i">
                                    <div v-if="dev.cantidad > 0" class="text-sm text-color flex flex-column sm:flex-row justify-content-between py-2 border-bottom-1 surface-border last-border-none align-items-start sm:align-items-center gap-1 sm:gap-0">
                                        <span>
                                            <i class="pi pi-check-circle text-green-500 mr-2" style="font-size: 0.9rem;"></i>
                                            <b>{{ dev.cantidad }}x</b> {{ t('modal_detalles_pedido.piezas_recibidas_por') }} <b>{{ dev.receptorNombre }}</b>
                                        </span>
                                        <span class="text-color-secondary mt-1 sm:mt-0"><i class="pi pi-calendar mr-1"></i>{{ formatearFecha(dev.fecha) }}</span>
                                    </div>
                                </template>
                            </div>
                            <div v-else-if="h.cantidadPrestada > h.cantidadRegresada" class="mt-3 text-sm text-red-500 flex align-items-center">
                                <i class="pi pi-clock mr-2"></i> {{ t('modal_detalles_pedido.sin_devolucion_valida') }}
                            </div>
                        </template>
                    </li>
                </ul>
            </div>
        </div>
        
        <template #footer>
            <Button :label="t('modal_detalles_pedido.btn_cerrar')" icon="pi pi-times" @click="emit('cerrar')" class="btn-cancelar font-bold w-full sm:w-auto" />
        </template>
    </Dialog>
</template>