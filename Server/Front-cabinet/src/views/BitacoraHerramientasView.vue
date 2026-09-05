<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { FilterMatchMode } from '@primevue/core/api';
import { useI18n } from 'vue-i18n'; 

import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Menu from 'primevue/menu';
import Select from 'primevue/select';

import { HerramientasService } from '@/services/herramientasService';
import { useGestorArchivos } from '@/composables/useGestordeArchivos';
import ModalDetallesBitacora from '@/components/historial_herramientas/ModalDetallesBitacora.vue';
import TablaBitacora from '@/components/historial_herramientas/TablaBitacora.vue';

const router = useRouter();
const { t } = useI18n(); 

// Estados de Datos y Paginación
const bitacora = ref([]);
const cargando = ref(false);
const totalRegistros = ref(0);
const paginaActual = ref(1);
const filasPorPagina = ref(10);

const filtros = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
const menuExportar = ref(null);

// Filtros
const filtroTiempo = ref('Todos');
const filtroAccion = ref('Todas');

const opcionesTiempo = computed(() => [
    { label: t('view_bitacora_herramientas.tiempo_todos'), value: 'Todos' },
    { label: t('view_bitacora_herramientas.tiempo_hoy'), value: 'Hoy' },
    { label: t('view_bitacora_herramientas.tiempo_semana'), value: 'Esta Semana' },
    { label: t('view_bitacora_herramientas.tiempo_mes'), value: 'Este Mes' },
    { label: t('view_bitacora_herramientas.tiempo_anio'), value: 'Este Año' }
]);

// Variables para el Modal
const mostrarModalDetalles = ref(false);
const registroSeleccionado = ref(null);

const { exportarBitacora } = useGestorArchivos();

const cargarBitacora = async (opciones = {}) => {
    cargando.value = true;
    try {
        const page = opciones.page || paginaActual.value;
        const limit = opciones.limit || filasPorPagina.value;

        const params = {
            page,
            limit,
            busqueda: filtros.value.global.value || undefined,
            accion: filtroAccion.value !== 'Todas' ? filtroAccion.value : undefined,
            tiempo: filtroTiempo.value !== 'Todos' ? filtroTiempo.value : undefined
        };

        const responseData = await HerramientasService.obtenerBitacora(params);

        if (responseData && responseData.data) {
            bitacora.value = responseData.data;
            totalRegistros.value = responseData.meta?.total ?? 0;
            paginaActual.value = responseData.meta?.page ?? page;
        }
    } catch (error) {
        console.error("Error al cargar la bitácora:", error);
    } finally {
        cargando.value = false;
    }
};
const cambiarPagina = ({ page, limit }) => {
    paginaActual.value = page;
    filasPorPagina.value = limit;
    cargarBitacora({ page, limit });
};

// Recargar al cambiar los filtros de select y botón de acción
watch([filtroAccion, filtroTiempo], () => {
    paginaActual.value = 1;
    cargarBitacora({ page: 1 });
});

// Evitar llamadas inmediatas por cada letra tecleada agregando un pequeño debouncing opcional o escuchando cambios clave
watch(() => filtros.value.global.value, (nuevoValor) => {
    if (nuevoValor === null || nuevoValor === '' || nuevoValor.length >= 2) {
        paginaActual.value = 1;
        cargarBitacora({ page: 1 });
    }
});

onMounted(() => { 
    cargarBitacora(); 
});

const abrirDetalles = (eventoOData) => {
    registroSeleccionado.value = eventoOData.data || eventoOData;
    mostrarModalDetalles.value = true;
};

const toggleFiltroAccion = () => {
    const orden = ['Todas', 'CREACION', 'MODIFICACION', 'ELIMINACION'];
    const indiceActual = orden.indexOf(filtroAccion.value);
    filtroAccion.value = orden[(indiceActual + 1) % orden.length];
};

const labelFiltroAccion = computed(() => {
    if (filtroAccion.value === 'Todas') return t('view_bitacora_herramientas.filtro_todas_acciones');
    if (filtroAccion.value === 'CREACION') return t('view_bitacora_herramientas.filtro_solo_creaciones');
    if (filtroAccion.value === 'MODIFICACION') return t('view_bitacora_herramientas.filtro_solo_modificaciones');
    if (filtroAccion.value === 'ELIMINACION') return t('view_bitacora_herramientas.filtro_solo_eliminaciones');
    return t('view_bitacora_herramientas.filtro_default');
});

const iconFiltroAccion = computed(() => {
    if (filtroAccion.value === 'Todas') return 'pi pi-check';
    if (filtroAccion.value === 'CREACION') return 'pi pi-plus-circle';
    if (filtroAccion.value === 'MODIFICACION') return 'pi pi-file-edit';
    if (filtroAccion.value === 'ELIMINACION') return 'pi pi-trash';
    return 'pi pi-filter';
});

const claseFiltroAccion = computed(() => {
    if (filtroAccion.value === 'Todas') return 'p-button-success'; 
    if (filtroAccion.value === 'CREACION') return 'p-button-outlined p-button-success'; 
    if (filtroAccion.value === 'MODIFICACION') return 'p-button-outlined p-button-info'; 
    if (filtroAccion.value === 'ELIMINACION') return 'p-button-outlined p-button-danger'; 
    return '';
});

const opcionesExportar = computed(() => [
    { label: t('view_bitacora_herramientas.exportar_csv'), icon: 'pi pi-file', command: () => exportarBitacora(bitacora.value, filtroTiempo.value, 'csv') },
    { label: t('view_bitacora_herramientas.exportar_excel'), icon: 'pi pi-file-excel', command: () => exportarBitacora(bitacora.value, filtroTiempo.value, 'xlsx') }
]);
</script>

<template>
  <div class="panel-principal p-3 md:p-4 border-round-xl shadow-1 mt-4">
    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">{{ t('view_bitacora_herramientas.titulo') }}</h2>
    </div>

    <!-- Toolbar superior adaptativa -->
    <div class="flex flex-column lg:flex-row flex-wrap justify-content-between align-items-stretch lg:align-items-center gap-3 mb-4 p-3 toolbar-oscuro border-round">
    
    <!-- LADO IZQUIERDO: Botón volver y Buscador -->
    <div class="flex flex-column sm:flex-row gap-3 w-full lg:w-auto align-items-stretch sm:align-items-center flex-grow-1" style="max-width: 600px;">
        <Button 
        :label="t('view_bitacora_herramientas.btn_volver')" 
        icon="pi pi-arrow-left" 
        class="p-button-secondary p-button-outlined btn-volver w-full sm:w-auto flex-shrink-0" 
        @click="router.back()" 
        />
        <IconField iconPosition="left" class="w-full">
        <InputIcon class="pi pi-search" />
        <InputText 
            id="buscador-bitacora" 
            name="buscador-bitacora" 
            v-model="filtros['global'].value" 
            :placeholder="t('view_bitacora_herramientas.ph_buscar')" 
            class="input-oscuro w-full" 
            autocomplete="off" 
        />
        </IconField>
    </div>
    
    <!-- LADO DERECHO: Filtros y Botón Exportar -->
    <div class="flex flex-wrap sm:flex-nowrap gap-2 w-full lg:w-auto justify-content-start lg:justify-content-end align-items-center">
        <Button 
            type="button" 
            :label="labelFiltroAccion" 
            :icon="iconFiltroAccion" 
            :class="claseFiltroAccion" 
            class="w-full sm:w-auto font-bold flex align-items-center justify-content-center border-round flex-1" 
            style="min-width: 150px; white-space: nowrap;" 
            @click="toggleFiltroAccion" 
        />
        <Select 
            v-model="filtroTiempo" 
            :options="opcionesTiempo" 
            optionLabel="label"
            optionValue="value"
            :placeholder="t('view_bitacora_herramientas.ph_filtro_fecha')" 
            class="w-full sm:w-auto input-oscuro flex align-items-center flex-1" 
            style="min-width: 140px;" 
            overlayClass="menu-oscuro-global" 
            panelClass="menu-oscuro-global" 
        />
        <Button 
            type="button" 
            :label="t('view_bitacora_herramientas.btn_exportar')" 
            icon="pi pi-angle-down" 
            iconPos="right" 
            class="btn-exportar w-full sm:w-auto font-bold flex-shrink-0" 
            style="white-space: nowrap;"
            @click="$refs.menuExportar.toggle($event)" 
            aria-haspopup="true" 
            aria-controls="exportar_menu" 
        />
        <Menu ref="menuExportar" id="exportar_menu" :model="opcionesExportar" :popup="true" class="menu-oscuro" />
    </div>

    </div>

    <!-- TABLA RESTRUCTURADA -->
    <TablaBitacora
        :bitacora="bitacora"
        :cargando="cargando"
        :filtros="filtros"
        :totalRecords="totalRegistros" 
        :paginaActual="paginaActual"
        :filasPorPagina="filasPorPagina"
        @cambio-pagina="cambiarPagina"
        @doble-click="abrirDetalles"
    />

    <!-- MODAL DE DETALLES -->
    <ModalDetallesBitacora 
        v-model:mostrar="mostrarModalDetalles" 
        :registro="registroSeleccionado" 
        @cerrar="mostrarModalDetalles = false" 
    />

  </div>
</template>