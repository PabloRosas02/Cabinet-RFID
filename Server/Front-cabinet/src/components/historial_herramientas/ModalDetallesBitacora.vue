<script setup>
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { formatearFecha } from '@/utils/dateHelper';

defineProps({
    mostrar: Boolean,
    registro: Object
});

const emit = defineEmits(['cerrar']);

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
        :visible="mostrar" 
        @update:visible="emit('cerrar')"
        header="Desglose de Auditoría" 
        modal
        :style="{ width: '55rem' }" 
        :breakpoints="{ '1199px': '75vw', '768px': '90vw', '575px': '95vw' }"
        class="modal-oscuro"
        dismissableMask
    >
        <div v-if="registro" class="p-2 md:p-3">
            
            <div class="grid mb-4">
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-500 block">Herramienta Afectada</span>
                    <span class="text-xl font-bold text-blue-300">{{ registro.herramienta?.codigo || 'N/A' }}</span>
                    <div class="text-white">{{ registro.herramienta?.nombre || 'Desconocida / Eliminada' }}</div>
                </div>
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-500 block">Tipo de Acción</span>
                    <span :class="['badge-accion mt-1', getBadgeClase(registro.accion)]">{{ registro.accion }}</span>
                </div>
                
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-500 block">Ejecutado por (Usuario)</span>
                    <span class="font-bold text-white"><i class="pi pi-user mr-2 text-gray-400"></i>{{ registro.usuario?.nombre || 'Sistema' }}</span>
                </div>
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-500 block">Fecha de la transacción</span>
                    <span class="text-white"><i class="pi pi-clock mr-2 text-gray-400"></i>{{ formatearFecha(registro.fecha) }}</span>
                </div>
            </div>

            <div class="border-top-1 border-gray-600 pt-3">
                <h3 class="text-lg font-bold mb-3" style="color: #5ab1ce;">Detalles de la Acción</h3>
                
                <!-- Historial de Modificaciones -->
                <div v-if="registro.accion === 'MODIFICACION' && registro.detalle" class="surface-100 p-3 md:p-4 mb-3 border-round shadow-1">
                    <span class="text-xs text-400 font-bold uppercase mb-3 block tracking-wide"><i class="pi pi-file-edit mr-2"></i>Historial de Modificaciones (Antes ➔ Después):</span>
                    
                    <ul class="m-0 pl-0 list-none flex flex-column gap-3">
                        <li v-for="(linea, index) in obtenerListaDetalles(registro.detalle)" :key="index" class="p-3 surface-200 border-round border-1 border-gray-700">
                            <template v-if="linea.includes('➔')">
                                <div class="text-sm font-bold text-gray-400 mb-2 uppercase" style="font-size: 0.75rem; letter-spacing: 0.05em;">
                                    {{ linea.split(':')[0] }}
                                </div>
                                <div class="flex flex-column sm:flex-row align-items-start sm:align-items-center gap-2">
                                    <span class="text-red-400 line-through text-sm bg-red-900 px-2 py-1 border-round">{{ linea.substring(linea.indexOf(':') + 1).split('➔')[0].trim() }}</span>
                                    <i class="pi pi-arrow-right text-gray-500 text-xs hidden sm:block"></i>
                                    <i class="pi pi-arrow-down text-gray-500 text-xs sm:hidden block mt-1 mb-1"></i>
                                    <span class="text-green-400 font-bold text-sm bg-green-900 px-2 py-1 border-round">{{ linea.split('➔')[1].trim() }}</span>
                                </div>
                            </template>
                            <template v-else>
                                <span class="text-sm text-gray-300">{{ linea }}</span>
                            </template>
                        </li>
                    </ul>
                </div>

                <!-- Creación, Eliminación u otros -->
                <div v-else class="surface-100 p-3 md:p-4 mb-3 border-round shadow-1 text-gray-300 text-sm flex align-items-center">
                    <p v-if="registro.accion === 'CREACION'" class="m-0 text-base"><i class="pi pi-plus-circle text-green-400 mr-2 text-lg"></i>La herramienta fue dada de alta en el sistema.</p>
                    <p v-else-if="registro.accion === 'ELIMINACION'" class="m-0 text-base"><i class="pi pi-trash text-red-400 mr-2 text-lg"></i>La herramienta fue dada de baja y eliminada del inventario.</p>
                    <p v-else class="m-0">{{ registro.detalle || 'Sin detalles registrados para esta acción.' }}</p>
                </div>
            </div>

        </div>
        <template #footer>
            <Button label="Cerrar Detalles" icon="pi pi-times" @click="emit('cerrar')" class="btn-cancelar font-bold w-full sm:w-auto" />
        </template>
    </Dialog>
</template>

<style scoped>
/* =========================================================
   FONDOS OSCUROS ESPECÍFICOS PARA LAS CAJAS DE DETALLE
   ========================================================= */
.surface-100 { background-color: #313a46 !important; }
.surface-200 { background-color: #242b35 !important; }
</style>