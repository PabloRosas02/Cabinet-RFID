<script setup>
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import { useI18n } from 'vue-i18n';

const props = defineProps({
    mostrar: Boolean,
    pedido: Object,
    procesando: Boolean
});

const emit = defineEmits(['cerrar', 'confirmar']);
const { t } = useI18n();

const pedidoLocal = ref(null);

watch(() => props.pedido, (nuevoPedido) => {
    if (nuevoPedido) {
        pedidoLocal.value = { 
            ...nuevoPedido,
            herramientas: nuevoPedido.herramientas.map(h => ({
                ...h,
                cantidadARegresar: h.cantidadPrestada - (h.cantidadRegresada || 0)
            }))
        };
    }
}, { immediate: true });

const totalHerramientasARegresar = computed(() => {
    if (!pedidoLocal.value || !pedidoLocal.value.herramientas) return 0;
    return pedidoLocal.value.herramientas.reduce((total, item) => {
        return total + (item.cantidadARegresar || 0);
    }, 0);
});
</script>

<template>
    <Dialog 
        :visible="mostrar" 
        @update:visible="emit('cerrar')"
        :style="{width: '600px'}" 
        :breakpoints="{ '1199px': '75vw', '768px': '90vw', '575px': '95vw' }"
        :header="t('modal_devolucion.titulo')" 
        :modal="true"
        class="modal-oscuro"
        dismissableMask
    >
        <div v-if="pedidoLocal" class="p-2 md:p-3">
            <div class="mb-4 p-3 border-round surface-ground-custom">
                <p class="m-0 mb-2">
                    <span class="text-500 font-bold">{{ t('modal_devolucion.empleado') }}</span> 
                    {{ pedidoLocal.trabajadorNumero }} - {{ pedidoLocal.trabajadorNombre }}
                </p>
                <p class="m-0 mb-2">
                    <span class="text-500 font-bold">{{ t('modal_devolucion.folio') }}</span> 
                    #{{ pedidoLocal.id }}
                </p>
                <p class="m-0 capitalize">
                    <span class="text-500 font-bold">{{ t('tabla_devoluciones.motivo', 'Motivo') }}:</span> 
                    {{ pedidoLocal.motivo === 'otro' && pedidoLocal.motivoOtro ? `Otro (${pedidoLocal.motivoOtro})` : (pedidoLocal.motivo || 'N/A') }}
                </p>
            </div>

            <h3 class="text-lg font-bold mb-3" style="color: #5ab1ce;">{{ t('modal_devolucion.herramientas_regresar') }}</h3>
            
            <ul class="lista-herramientas p-0 m-0">
                <!-- Usamos flex-1 para el texto y flex-shrink-0 para el input -->
                <li v-for="item in pedidoLocal.herramientas" :key="item.detalleId" class="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center p-3 mb-2 border-round item-herramienta gap-3">
                    
                    <!-- Info de la herramienta (toma todo el espacio sobrante) -->
                    <div class="flex-1 min-w-0 pr-0 sm:pr-3 w-full">
                        <span class="font-bold block text-lg white-space-nowrap overflow-hidden text-overflow-ellipsis">{{ item.nombre }}</span>
                        <span class="text-sm text-500 block mt-1">
                            {{ t('modal_devolucion.prestadas') }} <b>{{ item.cantidadPrestada }}</b> 
                            <span v-if="item.cantidadRegresada > 0" class="text-green-400"> ({{ t('modal_devolucion.ya_devueltas') }} {{ item.cantidadRegresada }})</span> 
                            <br class="block sm:hidden" />
                            <span class="hidden sm:inline"> | </span>
                            {{ t('modal_devolucion.codigo') }} {{ item.codigo }}
                        </span>
                    </div>
                    
                    <!-- Control de cantidad (tamaño fijo que no se encoge ni estira) -->
                    <div class="flex-shrink-0 flex flex-column align-items-start sm:align-items-end w-full sm:w-auto">
                        <label class="text-xs text-400 mb-1">{{ t('modal_devolucion.cantidad_devolver') }}</label>
                        <InputNumber 
                            v-model="item.cantidadARegresar" 
                            :min="0" 
                            :max="item.cantidadPrestada - (item.cantidadRegresada || 0)" 
                            showButtons 
                            class="input-devolucion"
                            inputClass="input-oscuro text-center"
                        />
                    </div>
                </li>
            </ul>

            <div v-if="totalHerramientasARegresar === 0" class="mt-3 text-red-400 text-sm text-right">
                <i class="pi pi-info-circle mr-1"></i> {{ t('modal_devolucion.advertencia') }}
            </div>
        </div>
        
        <template #footer>
            <div class="flex flex-column-reverse sm:flex-row justify-content-end gap-2 mt-2 md:mt-3">
                <Button 
                    :label="t('modal_devolucion.btn_cancelar')" 
                    icon="pi pi-times" 
                    class="btn-limpiar w-full sm:w-auto" 
                    @click="emit('cerrar')" 
                    :disabled="procesando" 
                />
                
                <Button 
                    :label="t('modal_devolucion.btn_confirmar')" 
                    icon="pi pi-check" 
                    class="btn-registrar w-full sm:w-auto" 
                    @click="emit('confirmar', pedidoLocal)" 
                    :loading="procesando" 
                    :disabled="procesando || totalHerramientasARegresar === 0"
                />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.btn-registrar { background-color: #22c55e !important; border: none !important; color: #000000 !important; font-weight: bold; transition: opacity 0.3s; }
.btn-registrar:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-registrar:hover:not(:disabled) { background-color: #16a34a !important; }

.btn-limpiar { background-color: #4a5568 !important; border: none !important; color: white !important; }
.btn-limpiar:hover:not(:disabled) { background-color: #3f4b5b !important; }

.surface-ground-custom { background-color: #121820; border: 1px solid #3f4b5b; }
.lista-herramientas { list-style: none; overflow-x: hidden; }
.item-herramienta { background-color: #2a323d; border: 1px solid #3f4b5b; }

.capitalize { text-transform: capitalize; }

/* =======================================================
   CORRECCIÓN DEL BUG DEL INPUT NUMBER
   ======================================================= */
:deep(.input-devolucion) { 
    width: 120px !important; /* Forzamos a que el contenedor principal nunca crezca de más */
    display: inline-flex !important;
}
:deep(.input-devolucion .p-inputtext) { 
    width: 100% !important; /* Forzamos al input interno a respetar la caja de arriba */
    text-align: center; 
    padding: 0.5rem; 
}
:deep(.input-devolucion .p-inputnumber-button) { 
    background-color: #3f4b5b !important; 
    border: 1px solid #4a5568 !important; 
    color: #ffffff !important; 
}
:deep(.input-devolucion .p-inputnumber-button:hover) { 
    background-color: #4a5568 !important; 
}

@media (max-width: 575px) {
    :deep(.input-devolucion) { 
        width: 100% !important; 
        max-width: 200px; 
    }
}
</style>