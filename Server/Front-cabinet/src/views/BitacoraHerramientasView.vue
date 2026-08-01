<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { FilterMatchMode } from '@primevue/core/api';

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
const bitacora = ref([]);
const cargando = ref(false);
const filtros = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
const menuExportar = ref(null);

// Filtro de Tiempo
const filtroTiempo = ref('Todos');
const opcionesTiempo = ref(['Todos', 'Hoy', 'Esta Semana', 'Este Mes', 'Este Año']);

// Variables para el Modal
const mostrarModalDetalles = ref(false);
const registroSeleccionado = ref(null);

const { exportarBitacora } = useGestorArchivos();

const cargarBitacora = async () => {
    cargando.value = true;
    try {
        bitacora.value = await HerramientasService.obtenerBitacora();
    } catch (error) {
        console.error("Error al cargar la bitácora:", error);
    } finally {
        cargando.value = false;
    }
};

onMounted(() => { cargarBitacora(); });

const abrirDetalles = (eventoOData) => {
    registroSeleccionado.value = eventoOData.data || eventoOData;
    mostrarModalDetalles.value = true;
};

const filtroAccion = ref('Todas');

const toggleFiltroAccion = () => {
    const orden = ['Todas', 'CREACION', 'MODIFICACION', 'ELIMINACION'];
    const indiceActual = orden.indexOf(filtroAccion.value);
    filtroAccion.value = orden[(indiceActual + 1) % orden.length];
};

const labelFiltroAccion = computed(() => {
    if (filtroAccion.value === 'Todas') return 'Todas las Acciones';
    if (filtroAccion.value === 'CREACION') return 'Solo Creaciones';
    if (filtroAccion.value === 'MODIFICACION') return 'Solo Modificaciones';
    if (filtroAccion.value === 'ELIMINACION') return 'Solo Eliminaciones';
    return 'Filtro';
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

// ============================================================================
// FILTRADO DE LA TABLA
// ============================================================================
const bitacoraFiltrada = computed(() => {
    const ahora = new Date();
    const textoBusqueda = (filtros.value['global'].value || '').toLowerCase();

    return bitacora.value.filter(registro => {
        if (filtroAccion.value !== 'Todas' && registro.accion !== filtroAccion.value) return false;

        if (filtroTiempo.value !== 'Todos') {
            const fechaRegistro = new Date(registro.fecha);
            if (filtroTiempo.value === 'Hoy') {
                if (fechaRegistro.toDateString() !== ahora.toDateString()) return false;
            } 
            else if (filtroTiempo.value === 'Esta Semana') {
                const inicioSemana = new Date(ahora);
                inicioSemana.setDate(ahora.getDate() - ahora.getDay());
                inicioSemana.setHours(0, 0, 0, 0); 
                if (fechaRegistro < inicioSemana) return false;
            } 
            else if (filtroTiempo.value === 'Este Mes') {
                if (fechaRegistro.getMonth() !== ahora.getMonth() || fechaRegistro.getFullYear() !== ahora.getFullYear()) return false;
            } 
            else if (filtroTiempo.value === 'Este Año') {
                if (fechaRegistro.getFullYear() !== ahora.getFullYear()) return false;
            }
        }

        if (textoBusqueda) {
            let detallesTexto = '';
            if (registro.detalle) {
                detallesTexto = typeof registro.detalle === 'object' 
                    ? Object.values(registro.detalle).join(' ') 
                    : registro.detalle;
            }
            const indiceBusqueda = `${registro.accion || ''} ${registro.herramienta?.codigo || ''} ${registro.herramienta?.nombre || ''} ${registro.usuario?.nombre || ''} ${detallesTexto}`.toLowerCase();
            if (!indiceBusqueda.includes(textoBusqueda)) return false;
        }

        return true;
    });
});

const opcionesExportar = ref([
    { label: 'Exportar a CSV', icon: 'pi pi-file', command: () => exportarBitacora(bitacoraFiltrada.value, filtroTiempo.value, 'csv') },
    { label: 'Exportar a Excel', icon: 'pi pi-file-excel', command: () => exportarBitacora(bitacoraFiltrada.value, filtroTiempo.value, 'xlsx') }
]);
</script>

<template>
  <div class="panel-bitacora p-3 md:p-4 border-round-xl shadow-1 mt-4">
    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">Bitácora de Auditoría</h2>
    </div>

    <!-- Toolbar superior -->
    <div class="flex flex-column xl:flex-row justify-content-between gap-3 mb-4 p-3 toolbar-oscuro border-round align-items-start xl:align-items-center">
      
      <!-- IZQUIERDA -->
      <div class="flex flex-column sm:flex-row gap-3 w-full xl:w-auto align-items-stretch sm:align-items-center">
        <Button label="Volver" icon="pi pi-arrow-left" class="p-button-secondary p-button-outlined btn-volver w-full sm:w-auto" @click="router.back()" />
        <IconField iconPosition="left" class="w-full xl:w-25rem">
          <InputIcon class="pi pi-search" />
          <InputText id="buscador-bitacora" name="buscador-bitacora" v-model="filtros['global'].value" placeholder="Buscar herramienta, usuario, detalle..." class="input-oscuro w-full" autocomplete="off" />
        </IconField>
      </div>
      
      <!-- DERECHA -->
      <div class="flex flex-column sm:flex-row flex-wrap xl:flex-nowrap gap-2 w-full xl:w-auto justify-content-start xl:justify-content-end align-items-center">
        <Button type="button" :label="labelFiltroAccion" :icon="iconFiltroAccion" :class="claseFiltroAccion" class="w-full sm:w-auto font-bold flex align-items-center justify-content-center border-round" style="min-width: 200px;" @click="toggleFiltroAccion" />
        <Select v-model="filtroTiempo" :options="opcionesTiempo" placeholder="Filtrar por fecha" class="w-full sm:w-auto input-oscuro flex align-items-center" style="min-width: 170px;" />
        <Button type="button" label="Exportar Bitácora" icon="pi pi-angle-down" iconPos="right" class="btn-exportar w-full sm:w-auto font-bold" @click="$refs.menuExportar.toggle($event)" aria-haspopup="true" aria-controls="exportar_menu" />
        <Menu ref="menuExportar" id="exportar_menu" :model="opcionesExportar" :popup="true" class="menu-oscuro" />
      </div>
    </div>

    <TablaBitacora
        :bitacora="bitacoraFiltrada"
        :cargando="cargando"
        :filtros="filtros"
        @doble-click="abrirDetalles"
    />

    <!-- MODAL -->
    <ModalDetallesBitacora 
        :mostrar="mostrarModalDetalles" 
        :registro="registroSeleccionado" 
        @cerrar="mostrarModalDetalles = false" 
    />

  </div>
</template>

<style scoped>
/* Contenedor y Toolbar */
.panel-bitacora { background-color: #2a323d !important; color: #ffffff; }
.toolbar-oscuro { background-color: #1e252d !important; }

/* Inputs y Botones */
:deep(.input-oscuro) { background-color: #121820 !important; color: #ffffff !important; border: 1px solid #4a5568 !important; }
:deep(.input-oscuro:focus) { border-color: #5ab1ce !important; box-shadow: 0 0 0 1px #5ab1ce !important; }
:deep(.input-oscuro .p-Select-label) { color: #ffffff !important; }
:deep(.input-oscuro .p-Select-trigger) { color: #94a3b8 !important; }
.btn-exportar { background-color: #217346 !important; border: none !important; color: white !important; }
.btn-volver { color: #cbd5e1 !important; border-color: #4a5568 !important; }
.btn-volver:hover { background-color: #36464d !important; border-color: #cbd5e1 !important; color: white !important;}

/* Menú Oscuro (Exportar) */
:deep(.menu-oscuro) { background-color: #1e252d !important; border: 1px solid #4a5568 !important; }
:deep(.menu-oscuro .p-menuitem-link) { color: #ffffff !important; }
:deep(.menu-oscuro .p-menuitem-link:hover) { background-color: #36464d !important; }
:deep(.menu-oscuro .p-menuitem-icon) { color: #217346 !important; }

/* Panel de Opciones del Select */
:deep(.p-Select-panel) { background-color: #1e252d !important; border: 1px solid #4a5568 !important; color: #ffffff; }
:deep(.p-Select-panel .p-Select-items .p-Select-item) { color: #ffffff !important; }
:deep(.p-Select-panel .p-Select-items .p-Select-item.p-highlight) { background-color: #5ab1ce !important; color: white !important; }
:deep(.p-Select-panel .p-Select-items .p-Select-item:not(.p-highlight):hover) { background-color: #36464d !important; }
</style>