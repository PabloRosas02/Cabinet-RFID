<script setup>
import { ref, computed } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag'; 

// Importaciones para el buscador de PrimeVue
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

const props = defineProps({
    inventario: {
        type: Array,
        required: true
    }
});

const emit = defineEmits(['agregar']);

const busqueda = ref('');

// --- Lógica del Modal de Detalles ---
const mostrarDetalles = ref(false);
const herramientaActual = ref({});

const onRowDoubleClick = (event) => {
    herramientaActual.value = event.data;
    mostrarDetalles.value = true;
};

// --- Lógica de Filtrado (Buscador) ---
const herramientasDisponibles = computed(() => {
    if (!busqueda.value) return props.inventario;
    
    const termino = busqueda.value.toLowerCase();
    return props.inventario.filter(h => 
        h.nombre.toLowerCase().includes(termino) || 
        h.codigo.toLowerCase().includes(termino)
    );
});

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
    <div class="panel-inventario p-4 border-round-xl shadow-1">
        <h3 class="subtitulo">Herramientas Disponibles</h3>
        
        <!-- Buscador -->
        <div class="buscador-container mb-4">
            <IconField iconPosition="left" class="w-full">
                <InputIcon class="pi pi-search" />
                <InputText 
                    id="buscadorHerramientas"
                    name="buscadorHerramientas"
                    aria-label="Buscar herramienta"
                    v-model="busqueda" 
                    placeholder="Buscar por código o nombre..." 
                    class="w-full input-oscuro" 
                />
            </IconField>
        </div>

        <!-- Tabla de Inventario -->
        <DataTable 
            :value="herramientasDisponibles" 
            :paginator="true" 
            :rows="5" 
            dataKey="id"
            class="tabla-oscura"
            emptyMessage="No se encontraron herramientas."
            @row-dblclick="onRowDoubleClick" 
            selectionMode="single" 
        >
            <Column field="codigo" header="Código" style="width: 20%"></Column>
            <Column field="nombre" header="Nombre" style="width: 40%"></Column>
            <Column field="cantidadDisponible" header="Stock" style="width: 20%"></Column>
            <Column header="Acción" style="width: 20%">
                <template #body="slotProps">
                    <Button 
                        icon="pi pi-plus" 
                        class="p-button-rounded p-button-success p-button-sm" 
                        @click="emitirAgregar(slotProps.data)" 
                        :disabled="slotProps.data.cantidadDisponible <= 0"
                        tooltip="Agregar al pedido"
                    />
                </template>
            </Column>
        </DataTable>

        <!-- Modal de Detalles -->
        <Dialog 
            v-model:visible="mostrarDetalles" 
            :style="{width: '700px'}" 
            header="Detalles de la Herramienta" 
            :modal="true"
            dismissableMask
            class="modal-oscuro-primeflex"
        >
            <div v-if="herramientaActual" class="p-4">
                
                <!-- Imagen y Badge dinámicos -->
                <div class="flex flex-column align-items-center mb-5">
                    <img 
                        v-if="herramientaActual.imagen" 
                        :src="herramientaActual.imagen" 
                        class="shadow-3 border-round" 
                        style="max-width: 100%; max-height: 300px; object-fit: contain;" 
                    />
                    <div v-else class="flex align-items-center justify-content-center surface-200 border-round shadow-1" style="width: 200px; height: 200px;">
                        <i class="pi pi-image text-7xl text-400"></i>
                    </div>
                    
                    <div class="mt-4">
                        <Tag class="text-xl px-4 py-2" :severity="obtenerSeveridadStock(herramientaActual)" :value="obtenerTextoStock(herramientaActual)" />
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
                        <div class="surface-100 p-3 border-round text-lg line-height-3 text-300">
                            {{ herramientaActual.descripcion || 'Sin descripción disponible.' }}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Footer con Botones -->
            <template #footer>
                <div class="flex justify-content-end gap-3 mt-3">
                    <Button 
                        label="Cerrar" 
                        icon="pi pi-times" 
                        class="p-button-text text-500 hover:text-white" 
                        @click="mostrarDetalles = false" 
                    />
                    <Button 
                        label="Añadir al Pedido" 
                        icon="pi pi-plus" 
                        class="boton-anadir-verde" 
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
.panel-inventario { background-color: #2a323d; height: 100%; }
.subtitulo { color: #ffffff; margin-top: 0; margin-bottom: 1.5rem; font-size: 1.25rem; }

:deep(.input-oscuro) { background-color: #1e252d !important; color: #ffffff !important; border: 1px solid #4a5568 !important; }
:deep(.input-oscuro:focus) { border-color: #5ab1ce !important; box-shadow: 0 0 0 1px #5ab1ce !important; }

/* Blindaje de la tabla PrimeVue (Modo Oscuro) */
:deep(.tabla-oscura),
:deep(.tabla-oscura .p-datatable-wrapper),
:deep(.tabla-oscura .p-datatable-table) {
    background-color: transparent !important;
}

:deep(.tabla-oscura .p-datatable-thead > tr > th) { 
    background-color: transparent !important; 
    color: #cbd5e1 !important; 
    border-bottom: 1px solid #4a5568 !important; 
}

:deep(.tabla-oscura .p-datatable-tbody > tr),
:deep(.tabla-oscura .p-datatable-tbody > tr > td) { 
    background-color: #1e252d !important; 
    color: #ffffff !important; 
    border-bottom: 1px solid #3f4b5b !important; 
    border-top: none !important;
    border-left: none !important;
    border-right: none !important;
}

:deep(.tabla-oscura .p-datatable-tbody > tr:hover),
:deep(.tabla-oscura .p-datatable-tbody > tr:hover > td) { 
    background-color: #36464d !important; 
}
:deep(.tabla-oscura .p-datatable-tbody > tr) { cursor: pointer; }

:deep(.tabla-oscura .p-datatable-tbody > tr.p-datatable-empty-message > td) {
    background-color: #1e252d !important;
    color: #94a3b8 !important;
    text-align: center;
    border-bottom: 1px solid #3f4b5b !important;
}

/* Paginador y utilidades */
:deep(.p-paginator) { background-color: transparent !important; border: none !important; margin-top: 1rem; }
:deep(.p-paginator .p-paginator-page) { color: #cbd5e1 !important; }
:deep(.p-paginator .p-paginator-page.p-highlight) { background-color: #5ab1ce !important; color: #ffffff !important; border-radius: 50%; }

:deep(.p-paginator .p-paginator-first),
:deep(.p-paginator .p-paginator-prev),
:deep(.p-paginator .p-paginator-next),
:deep(.p-paginator .p-paginator-last) {
    color: #94a3b8 !important;
    background-color: transparent !important;
}
:deep(.p-paginator .p-paginator-first:hover),
:deep(.p-paginator .p-paginator-prev:hover),
:deep(.p-paginator .p-paginator-next:hover),
:deep(.p-paginator .p-paginator-last:hover) {
    background-color: #36464d !important;
}

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
}
:deep(.modal-oscuro-primeflex .p-dialog-header) { border-bottom: 1px solid #2a323d !important; }
:deep(.modal-oscuro-primeflex .p-dialog-footer) { border-top: 1px solid #2a323d !important; }

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
</style>