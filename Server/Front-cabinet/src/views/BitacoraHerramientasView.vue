<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { FilterMatchMode } from '@primevue/core/api';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Menu from 'primevue/menu';
import Select from 'primevue/select';

import { HerramientasService } from '@/services/herramientasService';
import { useGestorArchivos } from '@/composables/useGestordeArchivos';
import { formatearFecha } from '@/utils/dateHelper'; 

import ModalDetallesBitacora from '@/components/historial_herramientas/ModalDetallesBitacora.vue';

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

const getBadgeClase = (accion) => {
    if (accion === 'CREACION') return 'badge-creacion';
    if (accion === 'MODIFICACION') return 'badge-modificacion';
    if (accion === 'ELIMINACION') return 'badge-eliminacion';
    return 'badge-default';
};

const abrirDetalles = (eventoOData) => {
    registroSeleccionado.value = eventoOData.data || eventoOData;
    mostrarModalDetalles.value = true;
};

// ============================================================================
// LÓGICA DEL BOTÓN CÍCLICO PARA EL FILTRO DE ACCIONES
// ============================================================================
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
        // 1. Filtro por Tipo de Acción
        if (filtroAccion.value !== 'Todas' && registro.accion !== filtroAccion.value) return false;

        // 2. Filtro por Fecha
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

        // 3. Buscador Profundo
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
    <div class="flex flex-column xl:flex-row justify-content-between gap-3 mb-4 p-3 toolbar-oscuro border-round">
      <div class="flex flex-column sm:flex-row gap-2 w-full xl:w-auto">
        <Button label="Volver" icon="pi pi-arrow-left" class="p-button-secondary p-button-outlined btn-volver w-full sm:w-auto" @click="router.back()" />
        <Button type="button" label="Exportar Bitácora" icon="pi pi-angle-down" iconPos="right" class="btn-exportar w-full sm:w-auto font-bold" @click="$refs.menuExportar.toggle($event)" aria-haspopup="true" aria-controls="exportar_menu" />
        <Menu ref="menuExportar" id="exportar_menu" :model="opcionesExportar" :popup="true" class="menu-oscuro" />
      </div>
      
      <div class="flex flex-column sm:flex-row flex-wrap xl:flex-nowrap gap-2 w-full xl:w-auto justify-content-end">
        <IconField iconPosition="left" class="w-full sm:flex-1 lg:w-20rem xl:w-25rem">
          <InputIcon class="pi pi-search" />
          <InputText id="buscador-bitacora" name="buscador-bitacora" v-model="filtros['global'].value" placeholder="Buscar herramienta, usuario, detalle..." class="input-oscuro w-full" autocomplete="off" />
        </IconField>
        
        <Button type="button" :label="labelFiltroAccion" :icon="iconFiltroAccion" :class="claseFiltroAccion" class="w-full sm:w-auto font-bold flex align-items-center justify-content-center border-round" style="min-width: 200px;" @click="toggleFiltroAccion" />
        <Select v-model="filtroTiempo" :options="opcionesTiempo" placeholder="Filtrar por fecha" class="w-full sm:w-auto input-oscuro flex align-items-center" style="min-width: 170px;" />
      </div>
    </div>

    <!-- Tabla con paginador actualizado -->
    <div class="tabla-contenedor p-3 border-round shadow-1 mt-4">
        <DataTable 
            :value="bitacoraFiltrada" 
            :paginator="true" 
            :rows="10" 
            :loading="cargando" 
            dataKey="id" 
            class="tabla-oscura w-full cursor-pointer" 
            emptyMessage="No hay registros con los filtros actuales." 
            scrollable 
            @row-dblclick="abrirDetalles" 
            rowHover
        >
            <Column header="Fecha / Hora" style="min-width: 140px; width: 15%">
                <template #body="{ data }">{{ formatearFecha(data.fecha) }}</template>
            </Column>
            <Column header="Acción" style="min-width: 130px; width: 12%">
                <template #body="{ data }">
                    <span :class="['badge-accion', getBadgeClase(data.accion)]">{{ data.accion }}</span>
                </template>
            </Column>
            <Column header="Herramienta" style="min-width: 200px; width: 23%">
                <template #body="{ data }">
                    <div class="font-bold text-blue-300">{{ data.herramienta?.codigo || 'N/A' }}</div>
                    <div class="text-sm text-gray-400">{{ data.herramienta?.nombre || 'Herramienta eliminada' }}</div>
                </template>
            </Column>
            <Column header="Detalle Breve (Doble clic para ver más)" style="min-width: 250px; width: 30%">
                <template #body="{ data }">
                    <div class="flex align-items-center gap-2">
                        <Button icon="pi pi-eye" class="p-button-rounded p-button-text p-button-info p-0 m-0" style="height: 2rem; width: 2rem;" @click.stop="abrirDetalles(data)" />
                        <span class="text-sm text-gray-400 overflow-hidden text-overflow-ellipsis white-space-nowrap" style="max-width: 200px;">
                            {{ data.detalle || 'Registro estándar' }}
                        </span>
                    </div>
                </template>
            </Column>
            <Column header="Usuario Responsable" style="min-width: 180px; width: 20%">
                <template #body="{ data }">
                    <div class="font-bold"><i class="pi pi-user mr-2 text-gray-400"></i>{{ data.usuario?.nombre || 'Sistema' }}</div>
                    <div class="text-sm text-gray-400">{{ data.usuario?.rol || 'N/A' }}</div>
                </template>
            </Column>
        </DataTable>
    </div>

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
.tabla-contenedor { background-color: #2a323d !important; border: none !important; width: 100%; }

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

/* =========================================================
   TABLA OSCURA (Corrección Modo Light)
   ========================================================= */
.cursor-pointer :deep(tbody tr) { cursor: pointer; transition: background-color 0.2s; }

:deep(.tabla-oscura) {
    background-color: #2a323d !important;
}

:deep(.tabla-oscura .p-datatable-thead > tr > th) {
    background-color: #2a323d !important; 
    color: #94a3b8 !important;
    border: none !important;
    border-bottom: 1px solid #4a5568 !important;
    padding: 1.2rem 1rem;
}

:deep(.tabla-oscura .p-datatable-thead > tr > th.p-sortable-column:hover) {
    background-color: #1e252d !important;
    color: #ffffff !important;
}

:deep(.tabla-oscura .p-datatable-tbody > tr > td) {
    background-color: #121820 !important; 
    color: #ffffff !important; 
    border: none !important; 
    border-bottom: 1px solid #1e252d !important; 
    padding: 1rem; 
}

:deep(.tabla-oscura .p-datatable-tbody > tr:hover > td) { 
    background-color: #1e252d !important; 
}

/* =========================================================
   PAGINADOR SUTIL Y LIMPIO (Estandarizado)
   ========================================================= */
:deep(.p-paginator) { 
    background-color: transparent !important; 
    border: none !important; 
    margin-top: 1rem;
    border-top: 1px solid #4a5568 !important; 
    padding-top: 1rem !important; 
}

:deep(.p-paginator .p-paginator-page),
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

/* Efecto translúcido sutil para el número de página activo */
:deep(.p-paginator .p-paginator-page.p-highlight),
:deep(.p-paginator .p-paginator-page[data-p-highlight="true"]),
:deep(.p-paginator .p-paginator-page-selected) { 
    background-color: rgba(90, 177, 206, 0.2) !important; 
    color: #5ab1ce !important; 
    border-radius: 50% !important; 
    font-weight: bold;
}

/* Estilo para el texto del reporte (ej. "1 al 10 de 50 registros") */
:deep(.p-paginator .p-paginator-current) { 
    color: #94a3b8 !important; 
    font-size: 0.85rem; 
}

/* Scroll horizontal */
:deep(.p-datatable-wrapper::-webkit-scrollbar) { height: 6px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-thumb) { background: #4a5568; border-radius: 4px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-track) { background: transparent; }

/* Badges de Acción (Requeridos para la tabla) */
.badge-accion { padding: 0.35rem 0.75rem; border-radius: 6px; font-weight: 800; display: inline-block; font-size: 0.85rem; text-align: center;}
.badge-creacion { background-color: rgba(74, 222, 128, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); }
.badge-modificacion { background-color: rgba(96, 165, 250, 0.15); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.3); }
.badge-eliminacion { background-color: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }
.badge-default { background-color: rgba(148, 163, 184, 0.15); color: #94a3b8; }
</style>