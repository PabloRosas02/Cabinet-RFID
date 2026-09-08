<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Chip from 'primevue/chip';
import { FilterMatchMode } from '@primevue/core/api';
import { useI18n } from 'vue-i18n'; 
import TablaGenerica from '@/components/TablaGenerica.vue';
import ModalDetalleHerramienta from '@/components/ModalDetalleHerramienta.vue';

const props = defineProps({
    inventario: {
        type: Array,
        required: true,
        default: () => [] 
    },
    categorias: {
        type: Array,
        default: () => []
    },
    totalRegistros: {
        type: Number,
        default: 0
    },
    cargando: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['agregar', 'page', 'filter']);
const { t } = useI18n(); 

const terminoLocal = ref('');
const categoriaSeleccionada = ref(null);
let searchTimer = null;

// Categorías/Campos de Búsqueda disponibles para el catálogo
const camposDisponibles = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Nombre' }
];

// Por defecto se buscan ambos campos
const camposSeleccionados = ref(['codigo', 'nombre']);

const toggleCampo = (key) => {
    const index = camposSeleccionados.value.indexOf(key);
    if (index > -1) {
        if (camposSeleccionados.value.length > 1) {
            camposSeleccionados.value.splice(index, 1);
        }
    } else {
        camposSeleccionados.value.push(key);
    }
    emitirFiltros();
};

const placeholderDinamico = computed(() => {
    if (camposSeleccionados.value.length === camposDisponibles.length) {
        return 'Buscar por código o nombre...';
    }
    const campoActivo = camposDisponibles.find(c => camposSeleccionados.value.includes(c.key));
    return `Buscar por ${campoActivo ? campoActivo.label.toLowerCase() : ''}...`;
});

const esMovil = ref(window.innerWidth <= 992);
let resizeTimer;

const emitirFiltros = () => {
    emit('filter', {
        search: terminoLocal.value,
        campos: camposSeleccionados.value,
        categoriaId: categoriaSeleccionada.value
    });
};

const onBuscar = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        emitirFiltros();
    }, 150); 
};

const onChangeCategoria = () => {
    emitirFiltros();
};

const actualizarVista = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        esMovil.value = window.innerWidth <= 992;
    }, 150);
};

onMounted(() => window.addEventListener('resize', actualizarVista));
onUnmounted(() => {
    window.removeEventListener('resize', actualizarVista);
    clearTimeout(resizeTimer);
    clearTimeout(searchTimer); 
});

const columnasCatalogo = computed(() => [
    { field: 'codigo', header: t('catalogo_herramientas.col_codigo'), width: esMovil.value ? undefined : '20%', minWidth: '120px' },
    { field: 'nombre', header: t('catalogo_herramientas.col_nombre'), width: esMovil.value ? undefined : '40%', minWidth: '200px' },
    { field: 'cantidadDisponible', header: t('catalogo_herramientas.col_stock'), width: esMovil.value ? undefined : '20%', minWidth: '90px' },
    { header: t('catalogo_herramientas.col_accion'), width: esMovil.value ? undefined : '20%', minWidth: '120px', slotName: 'accion' }
]);

const filtros = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const mostrarDetalles = ref(false);
const herramientaActual = ref({});

const abrirDetalles = (data) => {
    herramientaActual.value = data;
    mostrarDetalles.value = true;
};

const agregarHerramienta = (herramienta) => {
    emit('agregar', herramienta);
    mostrarDetalles.value = false; 
};

const manejarPaginacion = (evento) => {
    emit('page', evento);
};

const manejarFiltro = (evento) => {
    const textoBusqueda = evento.filters?.global?.value || '';
    terminoLocal.value = textoBusqueda;
    emitirFiltros();
};
</script>

<template>
    <div class="panel-inventario p-4 border-round-xl shadow-2 surface-card h-full flex flex-column">
        <h3 class="titulo-catalogo text-2xl font-bold m-0 mb-4">
            {{ t('catalogo_herramientas.titulo') }}
        </h3>
        
        <!-- Toolbar con Chips y Buscador idéntica a Historial -->
        <div class="flex flex-column gap-3 mb-4 p-3 toolbar-oscuro border-round">
            
            <!-- Chips de Filtro -->
            <div class="flex flex-wrap align-items-center gap-2">
                <span class="text-sm font-bold text-400 mr-2">Buscar en:</span>
                <Chip 
                    v-for="campo in camposDisponibles" 
                    :key="campo.key"
                    :label="campo.label"
                    :class="['chip-categoria cursor-pointer', { 'active': camposSeleccionados.includes(campo.key) }]"
                    @click="toggleCampo(campo.key)"
                />
            </div>

            <!-- Buscador e Input de Categorías -->
            <div class="flex flex-column sm:flex-row gap-3 w-full">
                <IconField iconPosition="left" class="w-full">
                    <InputIcon class="pi pi-search" />
                    <InputText 
                        id="buscadorHerramientas"
                        name="buscadorHerramientas"
                        :aria-label="t('catalogo_herramientas.aria_buscar')"
                        v-model="terminoLocal" 
                        @input="onBuscar"
                        :placeholder="placeholderDinamico" 
                        class="input-oscuro w-full" 
                        autocomplete="off"
                    />
                </IconField>
            </div>
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
            
            :lazy="true"
            :totalRecords="totalRegistros"
            :cargando="cargando"
            @page="manejarPaginacion"
            @filter="manejarFiltro" 
            
            @doble-click="abrirDetalles"
        >
            <template #accion="{ data }">
                <div class="flex gap-2 justify-content-center">
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

        <ModalDetalleHerramienta 
            v-model:visible="mostrarDetalles"
            :herramienta="herramientaActual"
            :ocultarBotonAgregar="false"
            @agregar="agregarHerramienta"
        />
    </div>
</template>

<style scoped>
.titulo-catalogo {
    color: #5ab1ce !important;
    letter-spacing: -0.02em;
    font-weight: 700;
}

:global(html.light-theme) .titulo-catalogo {
    color: #063b69 !important;
}

.toolbar-oscuro {
    background-color: var(--surface-ground);
    border: 1px solid var(--surface-border);
}

.chip-categoria {
    background-color: #1e293b;
    color: #94a3b8;
    border: 1px solid #334155;
    transition: all 0.2s ease;
    user-select: none;
}
.chip-categoria:hover {
    border-color: #5ab1ce;
    color: #e2e8f0;
}
.chip-categoria.active {
    background-color: #0284c7;
    color: #ffffff;
    border-color: #38bdf8;
    font-weight: 600;
}
</style>