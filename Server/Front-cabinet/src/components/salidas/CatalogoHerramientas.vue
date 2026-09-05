<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
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
let searchTimer = null;

// =========================================================
// LÓGICA RESPONSIVA DINÁMICA (Con Debounce)
// =========================================================
const esMovil = ref(window.innerWidth <= 992);
let resizeTimer;

const onBuscar = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        emit('filter', terminoLocal.value);
    }, 150); 
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
    emit('filter', textoBusqueda);
};
</script>

<template>
    <div class="panel-inventario p-4 border-round-xl shadow-2 surface-card h-full flex flex-column">
        <!-- Título estilizado en azul primario -->
        <h3 class="titulo-catalogo text-2xl font-bold m-0 mb-4">
            {{ t('catalogo_herramientas.titulo') }}
        </h3>
        
        <!-- Buscador con fondo oscuro integrado -->
        <div class="buscador-container mb-4">
            <IconField iconPosition="left" class="w-full">
                <InputIcon class="pi pi-search text-500" />
                <InputText 
                    id="buscadorHerramientas"
                    name="buscadorHerramientas"
                    :aria-label="t('catalogo_herramientas.aria_buscar')"
                    v-model="terminoLocal" 
                    @input="onBuscar"
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

        <!-- Modal de Detalles Reutilizable -->
        <ModalDetalleHerramienta 
            v-model:visible="mostrarDetalles"
            :herramienta="herramientaActual"
            :ocultarBotonAgregar="false"
            @agregar="agregarHerramienta"
        />
    </div>
</template>

<style scoped>
/* =======================================================
   ESTILOS ADAPTATIVOS DEL CATÁLOGO
   ======================================================= */

/* Título en Modo Oscuro (Por defecto) */
.titulo-catalogo {
    color: #5ab1ce !important; /* Azul celeste */
    letter-spacing: -0.02em;
    font-weight: 700;
}

/* Título en Modo Claro */
:global(html.light-theme) .titulo-catalogo {
    color: #063b69 !important; /* Azul marino corporativo */
}
</style>