<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag'; 
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Select from 'primevue/select'; // <-- Nuevo import para el Dropdown/Select
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
const columnasCatalogo = computed(() => [
    { field: 'codigo', header: t('catalogo_herramientas.col_codigo'), width: esMovil.value ? undefined : '20%', minWidth: '120px' },
    { field: 'nombre', header: t('catalogo_herramientas.col_nombre'), width: esMovil.value ? undefined : '40%', minWidth: '200px' },
    { field: 'cantidadDisponible', header: t('catalogo_herramientas.col_stock'), width: esMovil.value ? undefined : '20%', minWidth: '90px' },
    { header: t('catalogo_herramientas.col_accion'), width: esMovil.value ? undefined : '20%', minWidth: '120px', slotName: 'accion' }
]);

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

// =====================================================
// NUEVA LÓGICA: MOTIVO DE SALIDA
// =====================================================
const mostrarModalMotivo = ref(false);
const herramientaParaAgregar = ref(null);
const motivoSeleccionado = ref(null);

// Opciones dinámicas con i18n para el motivo
const opcionesMotivo = computed(() => [
    { label: t('catalogo_herramientas.motivos.prestamo'), value: 'Préstamo' },
    { label: t('catalogo_herramientas.motivos.consumo'), value: 'Consumo' },
    { label: t('catalogo_herramientas.motivos.mantenimiento'), value: 'Mantenimiento' },
    { label: t('catalogo_herramientas.motivos.merma'), value: 'Merma / Daño' }
]);

// Intercepta el click en "+" para pedir el motivo primero
const prepararAgregar = (herramienta) => {
    herramientaParaAgregar.value = herramienta;
    motivoSeleccionado.value = null; // Reiniciamos el select
    mostrarModalMotivo.value = true;
};

// Emite el evento agregando el motivo al objeto
const confirmarAgregar = () => {
    if (!motivoSeleccionado.value) return;

    // Clonamos el objeto y le añadimos el motivo de salida
    const itemConMotivo = {
        ...herramientaParaAgregar.value,
        motivoSalida: motivoSeleccionado.value
    };

    emit('agregar', itemConMotivo);
    
    // Cerramos ambos modales
    mostrarModalMotivo.value = false;
    mostrarDetalles.value = false; 
};

// --- Lógica de Stock ---
const obtenerSeveridadStock = (h) => {
    if (!h) return 'success';
    if (h.cantidadDisponible <= 0) return 'danger'; 
    if (h.cantidadDisponible < h.cantidadMinima) return 'danger';
    if (h.cantidadDisponible === h.cantidadMinima) return 'warning';
    return 'success';
};

const obtenerTextoStock = (h) => {
    if (!h) return '';
    if (h.cantidadDisponible <= 0) return t('catalogo_herramientas.estado_agotado');
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
                        @click.stop="prepararAgregar(data)" 
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
            <div v-if="herramientaActual" class="p-2 md:p-4">
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
                    <!-- CAMBIO: Ahora llama a prepararAgregar -->
                    <Button 
                        :label="t('catalogo_herramientas.btn_anadir')" 
                        icon="pi pi-plus" 
                        class="boton-anadir-verde w-full sm:w-auto" 
                        @click="prepararAgregar(herramientaActual)" 
                        :disabled="!herramientaActual || herramientaActual.cantidadDisponible <= 0"
                        autofocus 
                    />
                </div>
            </template>
        </Dialog>

        <!-- NUEVO: Modal para Seleccionar Motivo -->
        <Dialog 
            v-model:visible="mostrarModalMotivo" 
            :header="t('catalogo_herramientas.modal_motivo_titulo')" 
            :style="{ width: '400px' }" 
            :breakpoints="{ '575px': '90vw' }"
            :modal="true"
            class="modal-oscuro"
        >
            <div class="flex flex-column gap-3 pt-3">
                <label for="motivo" class="text-300">
                    {{ t('catalogo_herramientas.lbl_seleccione_motivo') }}
                </label>
                <Select 
                    id="motivo"
                    v-model="motivoSeleccionado" 
                    :options="opcionesMotivo" 
                    optionLabel="label" 
                    optionValue="value"
                    :placeholder="t('catalogo_herramientas.ph_motivo')" 
                    class="w-full input-oscuro" 
                />
            </div>
            
            <template #footer>
                <div class="flex justify-content-end gap-2 mt-4">
                    <Button 
                        :label="t('catalogo_herramientas.btn_cancelar')" 
                        icon="pi pi-times" 
                        class="p-button-text p-button-secondary" 
                        @click="mostrarModalMotivo = false" 
                    />
                    <Button 
                        :label="t('catalogo_herramientas.btn_confirmar')" 
                        icon="pi pi-check" 
                        class="boton-anadir-verde" 
                        :disabled="!motivoSeleccionado" 
                        @click="confirmarAgregar" 
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.subtitulo { margin-top: 0; margin-bottom: 1.5rem; }
:deep(.surface-100) { background-color: #313a46 !important; border: 1px solid #3f4b5b !important; }
:deep(.surface-200) { background-color: #1e252d !important; }
:deep(.text-500) { color: #94a3b8 !important; }
:deep(.text-300) { color: #cbd5e1 !important; }
</style>