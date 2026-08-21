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
import { useI18n } from 'vue-i18n'; 

const props = defineProps({
    inventario: {
        type: Array,
        required: true
    }
});

const emit = defineEmits(['agregar']);
const { t } = useI18n(); 

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
// Aplicamos la traducción a todos los encabezados
const columnasCatalogo = computed(() => [
    { field: 'codigo', header: t('catalogo_herramientas.col_codigo'), width: esMovil.value ? undefined : '20%', minWidth: '120px' },
    { field: 'nombre', header: t('catalogo_herramientas.col_nombre'), width: esMovil.value ? undefined : '40%', minWidth: '200px' },
    { field: 'cantidadDisponible', header: t('catalogo_herramientas.col_stock'), width: esMovil.value ? undefined : '20%', minWidth: '90px' },
    { header: t('catalogo_herramientas.col_accion'), width: esMovil.value ? undefined : '20%', minWidth: '120px', slotName: 'accion' }
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
    if (h.cantidadDisponible <= 0) return 'danger'; // Mejora: Si es 0 o menor, es peligro.
    if (h.cantidadDisponible < h.cantidadMinima) return 'danger';
    if (h.cantidadDisponible === h.cantidadMinima) return 'warning';
    return 'success';
};

// Traducimos los estados del Stock
const obtenerTextoStock = (h) => {
    if (!h) return '';
    if (h.cantidadDisponible <= 0) return t('catalogo_herramientas.estado_agotado'); // Nueva posible traducción
    if (h.cantidadDisponible < h.cantidadMinima) return t('catalogo_herramientas.estado_critico');
    if (h.cantidadDisponible === h.cantidadMinima) return t('catalogo_herramientas.estado_alerta');
    return t('catalogo_herramientas.estado_normal');
};
</script>

<template>
    <div class="panel-inventario p-3 md:p-4 border-round-xl shadow-1">
        <h3 class="subtitulo text-xl md:text-2xl font-bold" style="color: #5ab1ce;">
            {{ t('catalogo_herramientas.titulo') }}
        </h3>
        
        <!-- Buscador -->
        <div class="buscador-container mb-4">
            <IconField iconPosition="left" class="w-full">
                <InputIcon class="pi pi-search" />
                <InputText 
                    id="buscadorHerramientas"
                    name="buscadorHerramientas"
                    :aria-label="t('catalogo_herramientas.aria_buscar')"
                    v-model="filtros['global'].value" 
                    :placeholder="t('catalogo_herramientas.ph_buscar')" 
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
            :mensajeVacio="t('catalogo_herramientas.mensaje_vacio')"
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
                        :aria-label="t('catalogo_herramientas.aria_ver_detalles')"
                    />
                    
                    <Button 
                        icon="pi pi-plus" 
                        class="p-button-rounded p-button-success p-button-sm" 
                        @click.stop="emitirAgregar(data)" 
                        :disabled="data.cantidadDisponible <= 0"
                        :aria-label="t('catalogo_herramientas.aria_agregar')"
                    />
                </div>
            </template>
        </TablaGenerica>

        <!-- Modal de Detalles -->
        <Dialog 
            v-model:visible="mostrarDetalles" 
            :style="{width: '700px'}" 
            :breakpoints="{ '1199px': '75vw', '768px': '90vw', '575px': '95vw' }"
            :header="t('catalogo_herramientas.modal_titulo')" 
            :modal="true"
            dismissableMask
            class="modal-oscuro"
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
                        <span class="text-500 block mb-1">{{ t('catalogo_herramientas.col_codigo') }}</span>
                        <span class="text-xl font-bold" style="color: #2b7a8f;">{{ herramientaActual.codigo }}</span>
                    </div>
                    <div class="col-12 md:col-6 mb-3">
                        <span class="text-500 block mb-1">{{ t('catalogo_herramientas.col_nombre') }}</span>
                        <span class="text-xl font-bold text-white">{{ herramientaActual.nombre }}</span>
                    </div>
                    
                    <div class="col-12 md:col-6 mb-3">
                        <span class="text-500 block mb-1">{{ t('catalogo_herramientas.modal_tipo') }}</span>
                        <span class="text-lg text-white">{{ herramientaActual.tipo || t('catalogo_herramientas.no_aplica') }}</span>
                    </div>
                    <div class="col-12 md:col-6 mb-3">
                        <span class="text-500 block mb-1">{{ t('catalogo_herramientas.modal_ubicacion') }}</span>
                        <span class="text-lg text-white">{{ herramientaActual.ubicacion || t('catalogo_herramientas.no_aplica') }}</span>
                    </div>
                    
                    <div class="col-12 md:col-6 mb-3">
                        <span class="text-500 block mb-1">{{ t('catalogo_herramientas.modal_marca') }}</span>
                        <span class="text-lg text-white">{{ herramientaActual.marca || t('catalogo_herramientas.no_aplica') }}</span>
                    </div>
                    <div class="col-12 md:col-6 mb-3">
                        <span class="text-500 block mb-1">{{ t('catalogo_herramientas.modal_stock_vs') }}</span>
                        <span class="text-lg font-bold text-white">{{ herramientaActual.cantidadDisponible }} / {{ herramientaActual.cantidadMinima }} {{ t('catalogo_herramientas.modal_unidades') }}</span>
                    </div>
                    
                    <div class="col-12 mb-3">
                        <span class="text-500 block mb-1">{{ t('catalogo_herramientas.modal_descripcion') }}</span>
                        <div class="surface-100 p-3 border-round text-base md:text-lg line-height-3 text-300">
                            {{ herramientaActual.descripcion || t('catalogo_herramientas.modal_sin_descripcion') }}
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex flex-column-reverse sm:flex-row justify-content-end gap-2 mt-2 md:mt-3">
                    <Button 
                        :label="t('catalogo_herramientas.btn_cerrar')" 
                        icon="pi pi-times" 
                        class="btn-cancelar w-full sm:w-auto" 
                        @click="mostrarDetalles = false" 
                    />
                    <Button 
                        :label="t('catalogo_herramientas.btn_anadir')" 
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
/* Solo conservamos los fondos específicos de las tarjetas internas */
.subtitulo { margin-top: 0; margin-bottom: 1.5rem; }
:deep(.surface-100) { background-color: #313a46 !important; border: 1px solid #3f4b5b !important; }
:deep(.surface-200) { background-color: #1e252d !important; }
:deep(.text-500) { color: #94a3b8 !important; }
:deep(.text-300) { color: #cbd5e1 !important; }
</style>