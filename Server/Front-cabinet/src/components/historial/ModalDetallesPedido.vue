<script setup>
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Button from 'primevue/button';

defineProps({
    mostrar: Boolean,
    pedido: Object
});

const emit = defineEmits(['cerrar']);

// Reutilizamos la función de fecha solo para el modal
const formatearFecha = (fechaString) => {
    if (!fechaString) return 'Pendiente';
    return new Date(fechaString).toLocaleDateString('es-MX', { 
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
};
</script>

<template>
    <Dialog 
        :visible="mostrar" 
        @update:visible="emit('cerrar')"
        modal 
        header="Detalles de los Movimientos" 
        :style="{ width: '55rem' }"
        :breakpoints="{ '1199px': '75vw', '768px': '90vw', '575px': '95vw' }" 
        class="modal-oscuro"
        dismissableMask
    >
        <div v-if="pedido" class="p-2 md:p-3">
            <div class="grid mb-4">
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-500 block">Folio del Pedido</span>
                    <span class="text-xl font-bold text-white">#{{ pedido.id }}</span>
                </div>
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-500 block">Estado Actual</span>
                    <Tag :severity="pedido.estado === 'DEVUELTO' ? 'success' : 'danger'" :value="pedido.estado" />
                </div>
                
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-500 block">Solicitó (Empleado)</span>
                    <span class="font-bold text-white">{{ pedido.trabajadorNumero }} - {{ pedido.trabajadorNombre }}</span>
                </div>
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-500 block">Autorizó Salida (Almacenista)</span>
                    <span class="font-bold text-white">{{ pedido.prestadorNombre }}</span>
                </div>
                
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-500 block">Fecha de Préstamo</span>
                    <span class="text-white">{{ formatearFecha(pedido.fechaPedido) }}</span>
                </div>
                <div class="col-12 md:col-6 mb-3">
                    <span class="text-500 block">Último en Recibir (Almacenista)</span>
                    <span class="font-bold" style="color: #38bdf8;">{{ pedido.receptorNombre || 'Aún no se reciben entregas' }}</span>
                </div>
                
                <div class="col-12 mb-2">
                    <span class="text-500 block">Última Fecha de Devolución General</span>
                    <span class="text-white">{{ formatearFecha(pedido.fechaDevolucion) }}</span>
                </div>
            </div>

            <div class="border-top-1 border-gray-600 pt-3">
                <h3 class="text-lg font-bold mb-3" style="color: #5ab1ce;">Desglose de Herramientas y Devoluciones</h3>
                <ul class="list-none p-0 m-0">
                    <li v-for="h in pedido.herramientas" :key="h.codigo" class="surface-100 p-3 md:p-4 mb-3 border-round shadow-1">
                        
                        <div class="flex flex-column sm:flex-row justify-content-between mb-2 border-bottom-1 border-gray-700 pb-2 gap-3 sm:gap-0">
                            <div>
                                <span class="font-bold text-white block text-lg">{{ h.nombre }}</span>
                                <span class="text-400 text-sm">Código: {{ h.codigo }}</span>
                            </div>
                            <div class="text-left sm:text-right text-lg">
                                <span class="block text-white">Prestadas: <b>{{ h.cantidadPrestada }}</b></span>
                                <span :class="h.cantidadRegresada >= h.cantidadPrestada ? 'text-green-400' : 'text-orange-400'">
                                    Regresadas: <b>{{ h.cantidadRegresada }}</b>
                                </span>
                            </div>
                        </div>

                        <!-- HISTORIAL DE RECEPCIONES PARCIALES -->
                        <div v-if="h.historialDevoluciones && h.historialDevoluciones.filter(d => d.cantidad > 0).length > 0" class="mt-3 p-3 surface-200 border-round border-1 border-gray-700">
                            <span class="text-xs text-400 font-bold uppercase mb-2 block tracking-wide">Rastreo de Recepciones Parciales:</span>
                            
                            <template v-for="(dev, i) in h.historialDevoluciones" :key="i">
                                <!-- En móviles, la fecha de devolución y quién lo recibió se apilarán -->
                                <div v-if="dev.cantidad > 0" class="text-sm text-300 flex flex-column sm:flex-row justify-content-between py-2 border-bottom-1 border-gray-700 last-border-none align-items-start sm:align-items-center gap-1 sm:gap-0">
                                    <span>
                                        <i class="pi pi-check-circle text-green-500 mr-2" style="font-size: 0.9rem;"></i>
                                        <b class="text-white">{{ dev.cantidad }}x</b> piezas recibidas por <b class="text-white">{{ dev.receptorNombre }}</b>
                                    </span>
                                    <span class="text-500 mt-1 sm:mt-0"><i class="pi pi-calendar mr-1"></i>{{ formatearFecha(dev.fecha) }}</span>
                                </div>
                            </template>
                        </div>
                        <div v-else-if="h.cantidadPrestada > h.cantidadRegresada" class="mt-3 text-sm text-red-400 flex align-items-center">
                            <i class="pi pi-clock mr-2"></i> Aún no se registra ninguna devolución válida de este artículo.
                        </div>
                    </li>
                </ul>
            </div>
        </div>
        
        <template #footer>
            <Button label="Cerrar Detalles" icon="pi pi-times" @click="emit('cerrar')" class="p-button-text text-white hover:text-blue-300 transition-colors w-full sm:w-auto" />
        </template>
    </Dialog>
</template>

<style scoped>
/* Paddings adaptables para el modal completo */
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

/* Efecto hover en el ícono de cerrar modal */
:deep(.modal-oscuro .p-dialog-header-icon) { color: #94a3b8 !important; }
:deep(.modal-oscuro .p-dialog-header-icon:hover) { background-color: rgba(255, 255, 255, 0.05) !important; color: #ffffff !important; }

.surface-100 { background-color: #313a46 !important; }
.surface-200 { background-color: #242b35 !important; }
.last-border-none:last-child { border-bottom: none !important; }
</style>