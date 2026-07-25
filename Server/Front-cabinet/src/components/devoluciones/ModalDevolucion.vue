<script setup>
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';

const props = defineProps({
    mostrar: Boolean,
    pedido: Object,
    procesando: Boolean
});

const emit = defineEmits(['cerrar', 'confirmar']);

// Variable reactiva local para editar sin afectar la tabla original
const pedidoLocal = ref(null);

// Cuando 'pedido' cambia (al abrir el modal), preparamos la data
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

// Calculamos en tiempo real si el usuario está regresando al menos 1 herramienta
const totalHerramientasARegresar = computed(() => {
    if (!pedidoLocal.value || !pedidoLocal.value.herramientas) return 0;
    
    // Sumamos la cantidadARegresar de todas las herramientas en la lista
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
        header="Revisión de Devolución" 
        :modal="true"
        class="modal-oscuro"
        dismissableMask
    >
        <!-- Padding adaptable -->
        <div v-if="pedidoLocal" class="p-2 md:p-3">
            <div class="mb-4 p-3 border-round surface-ground-custom">
                <p class="m-0 mb-2"><span class="text-500 font-bold">Empleado:</span> {{ pedidoLocal.trabajadorNumero }} - {{ pedidoLocal.trabajadorNombre }}</p>
                <p class="m-0"><span class="text-500 font-bold">Folio de Préstamo:</span> #{{ pedidoLocal.id }}</p>
            </div>

            <h3 class="text-lg font-bold mb-3" style="color: #5ab1ce;">Herramientas a regresar:</h3>
            
            <ul class="lista-herramientas p-0 m-0">
                <li v-for="item in pedidoLocal.herramientas" :key="item.detalleId" class="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center p-3 mb-2 border-round item-herramienta gap-3 sm:gap-0">
                    
                    <div class="flex-1 w-full sm:pr-3">
                        <span class="font-bold block text-lg">{{ item.nombre }}</span>
                        <span class="text-sm text-500 block mt-1">
                            Prestadas: <b>{{ item.cantidadPrestada }}</b> 
                            <span v-if="item.cantidadRegresada > 0" class="text-green-400"> (Ya devueltas: {{ item.cantidadRegresada }})</span> 
                            <br class="block sm:hidden" /> <!-- Salto de línea solo en celulares para el código -->
                            <span class="hidden sm:inline"> | </span> Código: {{ item.codigo }}
                        </span>
                    </div>
                    
                    <div class="flex flex-column align-items-start sm:align-items-end w-full sm:w-auto">
                        <label class="text-xs text-400 mb-1">Cantidad a devolver:</label>
                        <InputNumber 
                            v-model="item.cantidadARegresar" 
                            :min="0" 
                            :max="item.cantidadPrestada - (item.cantidadRegresada || 0)" 
                            showButtons 
                            class="input-oscuro"
                        />
                    </div>
                </li>
            </ul>

            <!-- MENSAJE DE ADVERTENCIA -->
            <div v-if="totalHerramientasARegresar === 0" class="mt-3 text-red-400 text-sm text-right">
                <i class="pi pi-info-circle mr-1"></i> Debes devolver al menos 1 herramienta para continuar.
            </div>
        </div>
        
        <template #footer>
            <div class="flex flex-column-reverse sm:flex-row justify-content-end gap-2 mt-2 md:mt-3">
                <Button 
                    label="Cancelar" 
                    icon="pi pi-times" 
                    class="btn-limpiar w-full sm:w-auto" 
                    @click="emit('cerrar')" 
                    :disabled="procesando" 
                />
                
                <Button 
                    label="Confirmar Devolución" 
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
/* Paddings dinámicos del modal */
:deep(.modal-oscuro .p-dialog-header), 
:deep(.modal-oscuro .p-dialog-content), 
:deep(.modal-oscuro .p-dialog-footer) { 
    background-color: #1e252d !important; 
    color: #ffffff !important; 
    border: none;
    padding-left: 1rem !important; 
    padding-right: 1rem !important; 
}

@media (min-width: 768px) {
    :deep(.modal-oscuro .p-dialog-header), 
    :deep(.modal-oscuro .p-dialog-content), 
    :deep(.modal-oscuro .p-dialog-footer) {
        padding-left: 1.5rem !important;
        padding-right: 1.5rem !important;
    }
}

:deep(.modal-oscuro .p-dialog-header) { border-bottom: 1px solid #2a323d !important; }
:deep(.modal-oscuro .p-dialog-footer) { border-top: 1px solid #2a323d !important; }

/* Transición suave y efecto de opacidad cuando está deshabilitado */
.btn-registrar { background-color: #22c55e !important; border: none !important; color: #000000 !important; font-weight: bold; transition: opacity 0.3s; }
.btn-registrar:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-limpiar { background-color: #4a5568 !important; border: none !important; color: white !important; }
.surface-ground-custom { background-color: #121820; border: 1px solid #3f4b5b; }
.lista-herramientas { list-style: none; overflow-x: hidden; }
.item-herramienta { background-color: #2a323d; border: 1px solid #3f4b5b; }

/* Control del InputNumber */
:deep(.input-oscuro) { width: 120px; }
:deep(.input-oscuro .p-inputtext) { width: 100%; background-color: #121820 !important; color: #ffffff !important; border: 1px solid #4a5568 !important; text-align: center; padding: 0.5rem; }
:deep(.input-oscuro .p-inputnumber-button) { background-color: #3f4b5b !important; border: 1px solid #4a5568 !important; color: #ffffff !important; }
:deep(.input-oscuro .p-inputnumber-button:hover) { background-color: #4a5568 !important; }

/* En móviles, aseguramos que el input number sea fácil de tocar */
@media (max-width: 575px) {
    :deep(.input-oscuro) { width: 100%; max-width: 200px; }
}
</style>