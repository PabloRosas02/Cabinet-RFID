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
                    <span class="text-500 block">{{ t('modal_detalles_pedido.folio_pedido') }}</span>
                    <span class="text-xl font-bold text-white">#{{ pedido.id }}</span>
                </div>
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-500 block">{{ t('modal_detalles_pedido.estado_actual') }}</span>
                    <!-- Interceptamos el estado de la BD para traducirlo -->
                    <Tag 
                        :severity="pedido.estado === 'DEVUELTO' ? 'success' : 'danger'" 
                        :value="pedido.estado === 'DEVUELTO' ? t('modal_detalles_pedido.estado_devuelto') : t('modal_detalles_pedido.estado_pendiente')" 
                    />
                </div>
                
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-500 block">{{ t('modal_detalles_pedido.empleado') }}</span>
                    <span class="font-bold text-white">{{ pedido.trabajadorNumero }} - {{ pedido.trabajadorNombre }}</span>
                </div>
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-500 block">{{ t('modal_detalles_pedido.almacenista_salida') }}</span>
                    <span class="font-bold text-white">{{ pedido.prestadorNombre }}</span>
                </div>
                
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-500 block">{{ t('modal_detalles_pedido.fecha_prestamo') }}</span>
                    <!-- CORRECCIÓN: Se cambió fechaPedido a fechaSalida para coincidir con el backend -->
                    <span class="text-white">{{ formatearFecha(pedido.fechaSalida) }}</span>
                </div>
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-500 block">{{ t('modal_detalles_pedido.almacenista_entrada') }}</span>
                    <span class="font-bold" style="color: #38bdf8;">
                        {{ obtenerNombreReceptor(pedido) }}
                    </span>
                </div>
                
                <div class="col-12 mb-2">
                    <span class="text-500 block">{{ t('modal_detalles_pedido.fecha_devolucion') }}</span>
                    <span class="text-white">
                        {{ obtenerFechaDevolucion(pedido) }}
                    </span>
                </div>
            </div>

            <div class="border-top-1 border-gray-600 pt-3">
                <h3 class="text-lg font-bold mb-3" style="color: #5ab1ce;">{{ t('modal_detalles_pedido.desglose_titulo') }}</h3>
                <ul class="list-none p-0 m-0">
                    <li v-for="(h, index) in pedido.herramientas" :key="index" class="surface-100 p-3 md:p-4 mb-3 border-round shadow-1">
                        
                        <div class="flex flex-column sm:flex-row justify-content-between mb-2 border-bottom-1 border-gray-700 pb-2 gap-3 sm:gap-0">
                            <div>
                                <span class="font-bold text-white block text-lg">{{ h.nombre }}</span>
                                <span class="text-400 text-sm">{{ t('modal_detalles_pedido.codigo') }}: {{ h.codigo }}</span>
                            </div>
                            <div class="text-left sm:text-right text-lg">
                                <span class="block text-white">{{ t('modal_detalles_pedido.prestadas') }}: <b>{{ h.cantidadPrestada }}</b></span>
                                <span :class="h.cantidadRegresada >= h.cantidadPrestada ? 'text-green-400' : 'text-orange-400'">
                                    {{ t('modal_detalles_pedido.regresadas') }}: <b>{{ h.cantidadRegresada }}</b>
                                </span>
                            </div>
                        </div>

                        <div v-if="h.historialDevoluciones && h.historialDevoluciones.filter(d => d.cantidad > 0).length > 0" class="mt-3 p-3 surface-200 border-round border-1 border-gray-700">
                            <span class="text-xs text-400 font-bold uppercase mb-2 block tracking-wide">{{ t('modal_detalles_pedido.rastreo_recepciones') }}</span>
                            
                            <template v-for="(dev, i) in h.historialDevoluciones" :key="i">
                                <div v-if="dev.cantidad > 0" class="text-sm text-300 flex flex-column sm:flex-row justify-content-between py-2 border-bottom-1 border-gray-700 last-border-none align-items-start sm:align-items-center gap-1 sm:gap-0">
                                    <span>
                                        <i class="pi pi-check-circle text-green-500 mr-2" style="font-size: 0.9rem;"></i>
                                        <b class="text-white">{{ dev.cantidad }}x</b> {{ t('modal_detalles_pedido.piezas_recibidas_por') }} <b class="text-white">{{ dev.receptorNombre }}</b>
                                    </span>
                                    <span class="text-500 mt-1 sm:mt-0"><i class="pi pi-calendar mr-1"></i>{{ formatearFecha(dev.fecha) }}</span>
                                </div>
                            </template>
                        </div>
                        <div v-else-if="h.cantidadPrestada > h.cantidadRegresada" class="mt-3 text-sm text-red-400 flex align-items-center">
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
.surface-100 { background-color: #313a46 !important; }
.surface-200 { background-color: #242b35 !important; }
.last-border-none:last-child { border-bottom: none !important; }
</style>