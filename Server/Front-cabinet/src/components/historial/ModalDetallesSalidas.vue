<script setup>
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import { formatearFecha } from '@/utils/dateHelper';
import { useI18n } from 'vue-i18n';

defineProps({
    mostrar: Boolean,
    pedido: Object
});

const emit = defineEmits(['cerrar']);
const { t } = useI18n();

// =====================================================================
// Funciones de ayuda para mantener limpio el template
// =====================================================================
const obtenerNombreReceptor = (pedido) => {
    if (!pedido.receptorNombre) return t('modal_detalles_pedido.sin_entregas');
    if (pedido.receptorNombre === 'Pendiente / En curso') return t('modal_detalles_pedido.pendiente_curso');
    return pedido.receptorNombre;
};

const obtenerFechaDevolucion = (pedido) => {
    if (!pedido.fechaDevolucion) return t('modal_detalles_pedido.pendiente_fecha');
    
    const fecha = formatearFecha(pedido.fechaDevolucion);
    return fecha.includes('Pendiente') ? t('modal_detalles_pedido.pendiente_fecha') : fecha;
};

const obtenerMotivoSalida = (pedido) => {
    if (!pedido.motivo) return t('modal_detalles_pedido.no_especificado');
    
    const motivoLower = pedido.motivo.toLowerCase();
    if ((motivoLower === 'otro' || motivoLower === 'other') && pedido.motivoOtro) {
        return `${t('modal_detalles_pedido.otro_motivo')}: ${pedido.motivoOtro}`;
    }
    
    return pedido.motivo;
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
        <div v-if="pedido" class="p-2 md:p-3">
            <div class="grid mb-4">
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-color-secondary block">{{ t('modal_detalles_pedido.folio_pedido') }}</span>
                    <span class="text-xl font-bold text-color">#{{ pedido.id }}</span>
                </div>
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-color-secondary block">{{ t('modal_detalles_pedido.estado_actual') }}</span>
                    <Tag 
                        :severity="pedido.estado === 'DEVUELTO' ? 'success' : 'danger'" 
                        :value="pedido.estado === 'DEVUELTO' ? t('modal_detalles_pedido.estado_devuelto') : t('modal_detalles_pedido.estado_pendiente')" 
                    />
                </div>
                
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-color-secondary block">{{ t('modal_detalles_pedido.empleado') }}</span>
                    <span class="font-bold text-color">{{ pedido.trabajadorNumero }} - {{ pedido.trabajadorNombre }}</span>
                </div>
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-color-secondary block">{{ t('modal_detalles_pedido.almacenista_salida') }}</span>
                    <span class="font-bold text-color">{{ pedido.prestadorNombre }}</span>
                </div>

                <div class="col-12 md:col-6 mb-3">
                    <span class="text-color-secondary block">{{ t('modal_detalles_pedido.motivo_salida') }}</span>
                    <span class="font-bold text-color">
                        {{ obtenerMotivoSalida(pedido) }}
                    </span>
                </div>
                
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-color-secondary block">{{ t('modal_detalles_pedido.fecha_prestamo') }}</span>
                    <span class="text-color">{{ formatearFecha(pedido.fechaSalida) }}</span>
                </div>
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-color-secondary block">{{ t('modal_detalles_pedido.almacenista_entrada') }}</span>
                    <span class="font-bold text-primary">
                        {{ obtenerNombreReceptor(pedido) }}
                    </span>
                </div>
                
                <div class="col-12 mb-2">
                    <span class="text-color-secondary block">{{ t('modal_detalles_pedido.fecha_devolucion') }}</span>
                    <span class="text-color">
                        {{ obtenerFechaDevolucion(pedido) }}
                    </span>
                </div>
            </div>

            <div class="border-top-1 surface-border pt-3">
                <h3 class="text-lg font-bold mb-3 text-primary">{{ t('modal_detalles_pedido.desglose_titulo') }}</h3>
                <ul class="list-none p-0 m-0">
                    <li v-for="(h, index) in pedido.herramientas" :key="index" class="surface-card p-3 md:p-4 mb-3 border-round border-1 surface-border shadow-1">
                        
                        <div class="flex flex-column sm:flex-row justify-content-between mb-2 border-bottom-1 surface-border pb-2 gap-3 sm:gap-0">
                            <div>
                                <span class="font-bold text-color block text-lg">{{ h.nombre }}</span>
                                <span class="text-color-secondary text-sm">{{ t('modal_detalles_pedido.codigo') }}: {{ h.codigo }}</span>
                            </div>
                            <div class="text-left sm:text-right text-lg">
                                <span class="block text-color">{{ t('modal_detalles_pedido.prestadas') }}: <b>{{ h.cantidadPrestada }}</b></span>
                                <span :class="h.cantidadRegresada >= h.cantidadPrestada ? 'text-green-500' : 'text-orange-500'">
                                    {{ t('modal_detalles_pedido.regresadas') }}: <b>{{ h.cantidadRegresada }}</b>
                                </span>
                            </div>
                        </div>

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
                    </li>
                </ul>
            </div>
        </div>
        
        <template #footer>
            <Button :label="t('modal_detalles_pedido.btn_cerrar')" icon="pi pi-times" @click="emit('cerrar')" class="btn-cancelar font-bold w-full sm:w-auto" />
        </template>
    </Dialog>
</template>

<style scoped>
.last-border-none:last-child { border-bottom: none !important; }
</style>