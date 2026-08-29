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
// ACCIÓN DE AGREGAR DIRECTA
// =====================================================
const agregarHerramienta = (herramienta) => {
    emit('agregar', herramienta);
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
    <div class="panel-inventario p-3 md:p-4 border-round-xl shadow-1 bg-white">
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
                    class="w-full" 
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
                        @click.stop="agregarHerramienta(data)" 
                        :disabled="data.cantidadDisponible <= 0"
                        :aria-label="t('catalogo_herramientas.aria_agregar')"
                    />
                </div>
            </template>
        </TablaGenerica>

        <!-- Modal de Detalles -->
        <Dialog 
            v-model:visible="mostrarDetalles" 
            :style="{ width: '600px' }" 
            :breakpoints="{ '1199px': '75vw', '768px': '90vw', '575px': '95vw' }"
            :header="t('catalogo_herramientas.modal_titulo')" 
            :modal="true"
            dismissableMask
            class="modal-oscuro-primeflex"
        >
            <div v-if="herramientaActual" class="pt-2 pb-1 px-2 md:px-3">
                
                <!-- Imagen y Badge -->
                <div class="flex flex-column align-items-center mb-5">
                    <img 
                        v-if="herramientaActual.imagen || herramientaActual.image" 
                        :src="herramientaActual.imagen || herramientaActual.image" 
                        @error="$event.target.src='https://via.placeholder.com/150x150/1e252d/ffffff?text=Error'"
                        class="border-round" 
                        style="width: 150px; height: 150px; object-fit: cover;" 
                    />
                    <div v-else class="flex align-items-center justify-content-center border-round fondo-imagen-vacia" style="width: 150px; height: 150px;">
                        <i class="pi pi-image text-5xl icono-vacio"></i>
                    </div>
                    
                    <div class="mt-4">
                        <Tag class="text-sm font-bold px-3 py-2 uppercase tracking-wide" :severity="obtenerSeveridadStock(herramientaActual)" :value="obtenerTextoStock(herramientaActual)" />
                    </div>
                </div>

                <!-- Grid de Datos -->
                <div class="grid formgrid">
                    <!-- Código -->
                    <div class="col-12 md:col-6 mb-4">
                        <span class="label-gris block mb-1 text-sm">{{ t('catalogo_herramientas.col_codigo') }}</span>
                        <span class="text-lg font-bold" style="color: #38bdf8;">
                            {{ herramientaActual.codigo || herramientaActual.code || t('catalogo_herramientas.no_aplica') }}
                        </span>
                    </div>
                    
                    <!-- Nombre -->
                    <div class="col-12 md:col-6 mb-4">
                        <span class="label-gris block mb-1 text-sm">{{ t('catalogo_herramientas.col_nombre') }}</span>
                        <span class="text-lg font-bold texto-valor">
                            {{ herramientaActual.nombre || herramientaActual.name || t('catalogo_herramientas.no_aplica') }}
                        </span>
                    </div>
                    
                    <!-- Tipo / Categoría -->
                    <div class="col-12 md:col-6 mb-4">
                        <span class="label-gris block mb-1 text-sm">{{ t('catalogo_herramientas.modal_tipo') }}</span>
                        <span class="text-lg font-bold texto-valor">
                            {{ herramientaActual.tipo || herramientaActual.type || herramientaActual.category || t('catalogo_herramientas.no_aplica') }}
                        </span>
                    </div>
                    
                    <!-- Ubicación -->
                    <div class="col-12 md:col-6 mb-4">
                        <span class="label-gris block mb-1 text-sm">{{ t('catalogo_herramientas.modal_ubicacion') }}</span>
                        <span class="text-lg font-bold texto-valor">
                            {{ herramientaActual.ubicacion || herramientaActual.location || t('catalogo_herramientas.no_aplica') }}
                        </span>
                    </div>
                    
                    <!-- Marca / Proveedor -->
                    <div class="col-12 md:col-6 mb-4">
                        <span class="label-gris block mb-1 text-sm">{{ t('catalogo_herramientas.modal_marca') }}</span>
                        <span class="text-lg font-bold texto-valor">
                            {{ herramientaActual.marca || herramientaActual.brand || herramientaActual.supplier || t('catalogo_herramientas.no_aplica') }}
                        </span>
                    </div>
                    
                    <!-- Stock -->
                    <div class="col-12 md:col-6 mb-4">
                        <span class="label-gris block mb-1 text-sm">{{ t('catalogo_herramientas.modal_stock') }}</span>
                        <span class="text-lg font-bold texto-valor">
                            {{ herramientaActual.cantidadDisponible ?? herramientaActual.stock ?? 0 }} / 
                            {{ herramientaActual.cantidadMinima ?? herramientaActual.minStock ?? 0 }} / 
                            <template v-if="herramientaActual.cantidadMaxima || herramientaActual.maxStock">
                                {{ herramientaActual.cantidadMaxima ?? herramientaActual.maxStock }}
                            </template>
                            <template v-else>
                                N/A
                            </template>
                            {{ t('catalogo_herramientas.modal_unidades') }}
                        </span>
                    </div>
                    
                    <!-- Descripción -->
                    <div class="col-12 mb-2">
                        <span class="label-gris block mb-2 text-sm">{{ t('catalogo_herramientas.modal_descripcion') }}</span>
                        <div class="caja-descripcion p-3 border-round text-sm">
                            {{ herramientaActual.descripcion || herramientaActual.description || t('catalogo_herramientas.modal_sin_descripcion') }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <template #footer>
                <div class="flex justify-content-end align-items-center gap-3 pt-3 mt-1 footer-separador w-full">
                    <Button 
                        :label="t('catalogo_herramientas.btn_cerrar')" 
                        icon="pi pi-times" 
                        text 
                        class="btn-texto-gris" 
                        @click="mostrarDetalles = false" 
                    />
                    <Button 
                        :label="t('catalogo_herramientas.btn_anadir')" 
                        icon="pi pi-plus" 
                        class="btn-agregar font-bold px-4 py-2" 
                        @click="agregarHerramienta(herramientaActual)" 
                        :disabled="!herramientaActual || herramientaActual.cantidadDisponible <= 0"
                        autofocus 
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style>
.subtitulo { 
    margin-top: 0; 
    margin-bottom: 1.5rem; 
}

/* ========================================================
   TEMA OSCURO (Por defecto)
   ======================================================== */
.modal-oscuro-primeflex .label-gris {
    color: #94a3b8 !important;
}

.modal-oscuro-primeflex .texto-valor {
    color: #ffffff !important;
}

.modal-oscuro-primeflex .caja-descripcion {
    background-color: #2a323d !important;
    border: 1px solid #3f4b5b !important;
    color: #cbd5e1 !important;
}

.modal-oscuro-primeflex .fondo-imagen-vacia {
    background-color: #1a222b !important;
}

.modal-oscuro-primeflex .icono-vacio {
    color: #4a5568 !important;
}

.modal-oscuro-primeflex .footer-separador {
    border-top: 1px solid #2a323d !important;
}

.modal-oscuro-primeflex .btn-texto-gris {
    color: #94a3b8 !important;
}
.modal-oscuro-primeflex .btn-texto-gris:hover {
    color: #ffffff !important;
    background: rgba(255, 255, 255, 0.05) !important;
}

.modal-oscuro-primeflex .btn-agregar {
    background-color: #22c55e !important;
    color: #121820 !important;
    border: none !important;
    border-radius: 6px !important;
}
.modal-oscuro-primeflex .btn-agregar:hover {
    background-color: #16a34a !important;
}

.modal-oscuro-primeflex .tracking-wide {
    letter-spacing: 0.025em;
}

/* ========================================================
   TEMA CLARO (Sobreescrituras dinámicas)
   ======================================================== */
html.light-theme .modal-oscuro-primeflex .label-gris {
    color: #64748b !important;
}

html.light-theme .modal-oscuro-primeflex .texto-valor {
    color: #334155 !important; 
}

html.light-theme .modal-oscuro-primeflex .caja-descripcion {
    background-color: #f8fafc !important;
    border: 1px solid #cbd5e1 !important;
    color: #334155 !important;
}

html.light-theme .modal-oscuro-primeflex .fondo-imagen-vacia {
    background-color: #f1f5f9 !important;
}

html.light-theme .modal-oscuro-primeflex .icono-vacio {
    color: #94a3b8 !important;
}

html.light-theme .modal-oscuro-primeflex .footer-separador {
    border-top: 1px solid #e2e8f0 !important;
}

html.light-theme .modal-oscuro-primeflex .btn-texto-gris {
    color: #64748b !important;
}
html.light-theme .modal-oscuro-primeflex .btn-texto-gris:hover {
    color: #0f172a !important;
    background: rgba(0, 0, 0, 0.05) !important;
}
</style>