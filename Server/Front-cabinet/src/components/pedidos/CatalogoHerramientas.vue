<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag'; 
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { FilterMatchMode } from '@primevue/core/api';
import TablaGenerica from '@/components/TablaGenerica.vue';

const props = defineProps({
    inventario: {
        type: Array,
        required: true
    }
});

const emit = defineEmits(['agregar']);

// =========================================================
// LÓGICA RESPONSIVA DINÁMICA
// =========================================================
const esMovil = ref(window.innerWidth <= 992);

const actualizarVista = () => {
    esMovil.value = window.innerWidth <= 992;
};

onMounted(() => window.addEventListener('resize', actualizarVista));
onUnmounted(() => window.removeEventListener('resize', actualizarVista));

// =====================================================
// DEFINICIÓN DINÁMICA DE COLUMNAS
// =====================================================
const columnasCatalogo = computed(() => [
    { field: 'codigo', header: 'Código', width: esMovil.value ? undefined : '20%', minWidth: '120px' },
    { field: 'nombre', header: 'Nombre', width: esMovil.value ? undefined : '40%', minWidth: '200px' },
    { field: 'cantidadDisponible', header: 'Stock', width: esMovil.value ? undefined : '20%', minWidth: '90px' },
    { header: 'Acción', width: esMovil.value ? undefined : '20%', minWidth: '120px', slotName: 'accion' }
]);

// Filtros nativos en lugar del filtrado manual
const filtros = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// --- Lógica del Modal de Detalles ---
const mostrarDetalles = ref(false);
const herramientaActual = ref({});

const abrirDetalles = (data) => {
    herramientaActual.value = data;
    mostrarDetalles.value = true;
};

const emitirAgregar = (herramienta) => {
    emit('agregar', herramienta);
};

// --- Lógica de Stock ---
const obtenerSeveridadStock = (h) => {
    if (!h) return 'success';
    if (h.cantidadDisponible < h.cantidadMinima) return 'danger';
    if (h.cantidadDisponible === h.cantidadMinima) return 'warning';
    return 'success';
};

const obtenerTextoStock = (h) => {
    if (!h) return '';
    if (h.cantidadDisponible < h.cantidadMinima) return 'CRÍTICO';
    if (h.cantidadDisponible === h.cantidadMinima) return 'ALERTA';
    return 'NORMAL';
};
</script>

<template>
    <div class="panel-inventario p-3 md:p-4 border-round-xl shadow-1">
        <h3 class="subtitulo text-xl md:text-2xl font-bold" style="color: #5ab1ce;">Herramientas Disponibles</h3>
        
        <!-- Buscador -->
        <div class="buscador-container mb-4">
            <IconField iconPosition="left" class="w-full">
                <InputIcon class="pi pi-search" />
                <InputText 
                    id="buscadorHerramientas"
                    name="buscadorHerramientas"
                    aria-label="Buscar herramienta"
                    v-model="filtros['global'].value" 
                    placeholder="Buscar por código o nombre..." 
                    class="w-full input-oscuro" 
                    autocomplete="off"
                />
            </IconField>
        </div>
        <TablaGenerica
            :datos="inventario"
            :columnas="columnasCatalogo"
            :filtros="filtros"
            :globalFilterFields="['codigo', 'nombre']"
            llaveMemoria="catalogo_herramientas"
            dataKey="id"
            iconoVacio="pi-box"
            mensajeVacio="No hay herramientas disponibles en el catálogo."
            @doble-click="abrirDetalles"
        >
            <!-- Slot Personalizado: Acción -->
            <template #accion="{ data }">
                <div class="flex gap-2">
                    <Button 
                        v-if="esMovil"
                        icon="pi pi-eye" 
                        class="p-button-rounded p-button-info p-button-sm btn-ojito" 
                        @click.stop="abrirDetalles(data)" 
                        aria-label="Ver detalles"
                    />
                    
                    <Button 
                        icon="pi pi-plus" 
                        class="p-button-rounded p-button-success p-button-sm" 
                        @click.stop="emitirAgregar(data)" 
                        :disabled="data.cantidadDisponible <= 0"
                        aria-label="Agregar al pedido"
                    />
                </div>
            </template>
        </TablaGenerica>

        <!-- Modal de Detalles -->
        <Dialog 
            v-model:visible="mostrarDetalles" 
            :style="{width: '700px'}" 
            :breakpoints="{ '1199px': '75vw', '768px': '90vw', '575px': '95vw' }"
            header="Detalles de la Herramienta" 
            :modal="true"
            dismissableMask
            class="modal-oscuro-primeflex"
        >
            <!-- Padding adaptativo -->
            <div v-if="herramientaActual" class="p-2 md:p-4">
                
                <!-- Imagen y Badge dinámicos -->
                <div class="flex flex-column align-items-center mb-5">
                    <img 
                        v-if="herramientaActual.imagen" 
                        :src="herramientaActual.imagen" 
                        @error="$event.target.src='https://via.placeholder.com/250x150/1e252d/ffffff?text=Error'"
                        class="shadow-3 border-round" 
                        style="max-width: 100%; max-height: 300px; object-fit: contain;" 
                    />
                    <div v-else class="flex align-items-center justify-content-center surface-200 border-round shadow-1" style="width: 100%; max-width: 200px; height: 200px;">
                        <i class="pi pi-image text-7xl text-400"></i>
                    </div>
                    
                    <div class="mt-4">
                        <Tag class="text-lg md:text-xl px-4 py-2" :severity="obtenerSeveridadStock(herramientaActual)" :value="obtenerTextoStock(herramientaActual)" />
                    </div>
                </div>

                <!-- Grid de Datos -->
                <div class="grid">
                    <div class="col-12 md:col-6 mb-3">
                        <span class="text-500 block mb-1">Código</span>
                        <span class="text-xl font-bold" style="color: #2b7a8f;">{{ herramientaActual.codigo }}</span>
                    </div>
                    <div class="col-12 md:col-6 mb-3">
                        <span class="text-500 block mb-1">Nombre</span>
                        <span class="text-xl font-bold text-white">{{ herramientaActual.nombre }}</span>
                    </div>
                    
                    <div class="col-12 md:col-6 mb-3">
                        <span class="text-500 block mb-1">Tipo / Categoría</span>
                        <span class="text-lg text-white">{{ herramientaActual.tipo || 'N/A' }}</span>
                    </div>
                    <div class="col-12 md:col-6 mb-3">
                        <span class="text-500 block mb-1">Ubicación Física</span>
                        <span class="text-lg text-white">{{ herramientaActual.ubicacion || 'N/A' }}</span>
                    </div>
                    
                    <div class="col-12 md:col-6 mb-3">
                        <span class="text-500 block mb-1">Marca / Proveedor</span>
                        <span class="text-lg text-white">{{ herramientaActual.marca || 'N/A' }}</span>
                    </div>
                    <div class="col-12 md:col-6 mb-3">
                        <span class="text-500 block mb-1">Stock Actual vs Mínimo</span>
                        <span class="text-lg font-bold text-white">{{ herramientaActual.cantidadDisponible }} / {{ herramientaActual.cantidadMinima }} unidades</span>
                    </div>
                    
                    <div class="col-12 mb-3">
                        <span class="text-500 block mb-1">Descripción y Notas</span>
                        <div class="surface-100 p-3 border-round text-base md:text-lg line-height-3 text-300">
                            {{ herramientaActual.descripcion || 'Sin descripción disponible.' }}
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex flex-column-reverse sm:flex-row justify-content-end gap-2 mt-2 md:mt-3">
                    <Button 
                        label="Cerrar" 
                        icon="pi pi-times" 
                        class="p-button-text text-500 hover:text-white w-full sm:w-auto" 
                        @click="mostrarDetalles = false" 
                    />
                    <Button 
                        label="Añadir al Pedido" 
                        icon="pi pi-plus" 
                        class="boton-anadir-verde w-full sm:w-auto" 
                        @click="() => { emitirAgregar(herramientaActual); mostrarDetalles = false; }" 
                        :disabled="!herramientaActual || herramientaActual.cantidadDisponible <= 0"
                        autofocus 
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
/* =========================================================
   ESTILOS LOCALES (Casi todo el CSS de tabla desapareció)
   ========================================================= */
.panel-inventario { background-color: #2a323d; height: 100%; }
.subtitulo { color: #ffffff; margin-top: 0; margin-bottom: 1.5rem; }

:deep(.input-oscuro) { background-color: #121820 !important; color: #ffffff !important; border: 1px solid #4a5568 !important; }
:deep(.input-oscuro:focus) { border-color: #5ab1ce !important; box-shadow: 0 0 0 1px #5ab1ce !important; }

:deep(.surface-100) { background-color: #313a46 !important; border: 1px solid #3f4b5b !important; }
:deep(.surface-200) { background-color: #1e252d !important; }
:deep(.text-500) { color: #94a3b8 !important; }
:deep(.text-300) { color: #cbd5e1 !important; }

/* Modal y Botones */
:deep(.modal-oscuro-primeflex .p-dialog-header),
:deep(.modal-oscuro-primeflex .p-dialog-content),
:deep(.modal-oscuro-primeflex .p-dialog-footer) {
    background-color: #1e252d !important;
    color: #ffffff !important;
    border: none;
    padding-left: 1rem !important; 
    padding-right: 1rem !important;
}

@media (min-width: 768px) {
    :deep(.modal-oscuro-primeflex .p-dialog-header),
    :deep(.modal-oscuro-primeflex .p-dialog-content),
    :deep(.modal-oscuro-primeflex .p-dialog-footer) {
        padding-left: 1.5rem !important;
        padding-right: 1.5rem !important;
    }
}

:deep(.modal-oscuro-primeflex .p-dialog-header) { border-bottom: 1px solid #2a323d !important; }
:deep(.modal-oscuro-primeflex .p-dialog-footer) { border-top: 1px solid #2a323d !important; }

/* Efecto hover en el ícono de cerrar modal (X) */
:deep(.modal-oscuro-primeflex .p-dialog-header-icon) { color: #94a3b8 !important; }
:deep(.modal-oscuro-primeflex .p-dialog-header-icon:hover) { background-color: rgba(255, 255, 255, 0.05) !important; color: #ffffff !important; }

.boton-anadir-verde {
    background-color: #34d399 !important; 
    color: #064e3b !important; 
    border: none !important;
    font-weight: 700 !important;
    padding: 0.8rem 1.5rem !important;
    border-radius: 6px !important;
    transition: filter 0.2s;
}
.boton-anadir-verde:hover { filter: brightness(1.1); }
.boton-anadir-verde:disabled {
    background-color: #4a5568 !important;
    color: #94a3b8 !important;
    cursor: not-allowed !important;
}

/* Color azul para el ojito */
:deep(.btn-ojito) {
    background-color: #3b82f6 !important; 
    border: none !important;
}
:deep(.btn-ojito:hover) {
    background-color: #2563eb !important;
}
</style>