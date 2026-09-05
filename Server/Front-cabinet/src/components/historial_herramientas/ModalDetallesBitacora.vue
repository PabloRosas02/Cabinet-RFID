<script setup>
import { computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { formatearFecha } from '@/utils/dateHelper';
import { traducirDetalleBitacora } from '@/utils/bitacoraFormatter';
import { useI18n } from 'vue-i18n';

const props = defineProps({
    mostrar: {
        type: Boolean,
        default: false
    },
    registro: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['cerrar', 'update:mostrar']);
const { t, locale } = useI18n();

const visibleModal = computed({
    get: () => props.mostrar,
    set: (valor) => {
        if (!valor) emit('cerrar');
        emit('update:mostrar', valor);
    }
});

const getBadgeClase = (accion) => {
    if (accion === 'CREACION') return 'badge-creacion';
    if (accion === 'MODIFICACION') return 'badge-modificacion';
    if (accion === 'ELIMINACION') return 'badge-eliminacion';
    return 'badge-default';
};

const obtenerListaDetalles = (texto) => {
    if (!texto) return [];
    return texto.split('\n');
};
</script>

<template>
    <Dialog 
        v-model:visible="visibleModal" 
        :header="t('modal_detalles_bitacora.titulo')" 
        modal
        :style="{ width: '55rem' }" 
        :breakpoints="{ '1199px': '75vw', '768px': '90vw', '575px': '95vw' }"
        dismissableMask
    >
        <div v-if="registro" class="p-2 md:p-3">
            
            <div class="grid mb-4">
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-color-secondary block">{{ t('modal_detalles_bitacora.herramienta_afectada') }}</span>
                    <span class="text-xl font-bold text-primary">{{ registro.herramienta?.codigo || t('modal_detalles_bitacora.no_aplica') }}</span>
                    <div class="text-color">{{ registro.herramienta?.nombre || t('modal_detalles_bitacora.desconocida_eliminada') }}</div>
                </div>
                
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-color-secondary block">{{ t('modal_detalles_bitacora.tipo_accion') }}</span>
                    <span :class="['badge-accion mt-1', getBadgeClase(registro.accion)]">
                        {{ 
                            registro.accion === 'CREACION' ? t('modal_detalles_bitacora.accion_creacion') :
                            registro.accion === 'MODIFICACION' ? t('modal_detalles_bitacora.accion_modificacion') :
                            registro.accion === 'ELIMINACION' ? t('modal_detalles_bitacora.accion_eliminacion') : registro.accion
                        }}
                    </span>
                </div>
                
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-color-secondary block">{{ t('modal_detalles_bitacora.ejecutado_por') }}</span>
                    <span class="font-bold text-color">
                        <i class="pi pi-user mr-2 text-color-secondary"></i>
                        {{ registro.usuario?.nombre || t('modal_detalles_bitacora.sistema') }}
                    </span>
                </div>

                <div class="col-12 md:col-6 mb-3">
                    <span class="text-color-secondary block">{{ t('modal_detalles_bitacora.fecha_transaccion') }}</span>
                    <span class="text-color">
                        <i class="pi pi-clock mr-2 text-color-secondary"></i>
                        {{ formatearFecha(registro.fecha, locale) }}
                    </span>
                </div>
            </div>

            <div class="border-top-1 surface-border pt-3">
                <h3 class="text-lg font-bold mb-3 text-primary">{{ t('modal_detalles_bitacora.detalles_accion') }}</h3>
                
                <!-- Historial de Modificaciones -->
                <div v-if="registro.accion === 'MODIFICACION' && registro.detalle" class="surface-card p-3 md:p-4 mb-3 border-round border-1 surface-border shadow-1">
                    <span class="text-xs text-color-secondary font-bold uppercase mb-3 block tracking-wide">
                        <i class="pi pi-file-edit mr-2"></i>{{ t('modal_detalles_bitacora.historial_modificaciones') }}
                    </span>
                    
                    <ul class="m-0 pl-0 list-none flex flex-column gap-3">
                        <li v-for="(linea, index) in obtenerListaDetalles(registro.detalle)" :key="index" class="p-3 surface-ground border-round border-1 surface-border">
                            <template v-if="linea.includes('➔')">
                                <div class="text-sm font-bold text-color-secondary mb-2 uppercase" style="font-size: 0.75rem; letter-spacing: 0.05em;">
                                    {{ traducirDetalleBitacora(linea.split(':')[0], t) }}
                                </div>
                                <div class="flex flex-column sm:flex-row align-items-start sm:align-items-center gap-2">
                                    <span class="text-white line-through text-sm bg-red-500 px-2 py-1 border-round">
                                        {{ traducirDetalleBitacora(linea.substring(linea.indexOf(':') + 1).split('➔')[0].trim(), t) }}
                                    </span>
                                    <i class="pi pi-arrow-right text-color-secondary text-xs hidden sm:block"></i>
                                    <i class="pi pi-arrow-down text-color-secondary text-xs sm:hidden block mt-1 mb-1"></i>
                                    <span class="text-white font-bold text-sm bg-green-500 px-2 py-1 border-round">
                                        {{ traducirDetalleBitacora(linea.split('➔')[1].trim(), t) }}
                                    </span>
                                </div>
                            </template>
                            <template v-else>
                                <span class="text-sm text-color">{{ traducirDetalleBitacora(linea, t) }}</span>
                            </template>
                        </li>
                    </ul>
                </div>

                <!-- Creación, Eliminación u otros -->
                <div v-else class="surface-card p-3 md:p-4 mb-3 border-round border-1 surface-border shadow-1 text-color text-sm flex align-items-center">
                    
                    <div v-if="registro.accion === 'CREACION'" class="w-full">
                        <p class="m-0 text-base">
                            <i class="pi pi-plus-circle text-green-500 mr-2 text-lg"></i>
                            {{ t('modal_detalles_bitacora.msj_creacion') }}
                        </p>
                        <p v-if="registro.detalle" class="m-0 mt-2 text-color-secondary text-sm italic">
                            {{ traducirDetalleBitacora(registro.detalle, t) }}
                        </p>
                    </div>
                    
                    <div v-else-if="registro.accion === 'ELIMINACION'" class="w-full">
                        <p class="m-0 text-base">
                            <i class="pi pi-trash text-red-500 mr-2 text-lg"></i>
                            {{ t('modal_detalles_bitacora.msj_eliminacion') }}
                        </p>
                        <div v-if="registro.detalle" class="mt-3 p-3 surface-ground border-round border-1 border-left-3 border-red-500 surface-border flex align-items-start gap-2">
                            <i class="pi pi-info-circle text-red-500 mt-1"></i>
                            <div>
                                <span class="block text-red-500 font-bold mb-1 text-xs uppercase tracking-wide">
                                    {{ t('modal_detalles_bitacora.registro_motivo') }}
                                </span>
                                <span class="text-color">{{ traducirDetalleBitacora(registro.detalle, t) }}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div v-else class="w-full">
                        <p class="m-0">{{ traducirDetalleBitacora(registro.detalle, t) || t('modal_detalles_bitacora.msj_sin_detalles') }}</p>
                    </div>

                </div>
            </div>

        </div>
        <template #footer>
            <Button 
                :label="t('modal_detalles_bitacora.btn_cerrar')" 
                icon="pi pi-times" 
                @click="emit('cerrar')" 
                class="btn-cancelar font-bold w-full sm:w-auto" 
            />
        </template>
    </Dialog>
</template>