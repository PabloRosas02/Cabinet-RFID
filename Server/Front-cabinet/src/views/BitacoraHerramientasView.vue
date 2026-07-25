<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios'; 

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Toolbar from 'primevue/toolbar';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { useExportarCSV } from '@/composables/useExportarCSV.js';
import Menu from 'primevue/menu';

const router = useRouter();
const bitacora = ref([]);
const cargando = ref(false);
const filtros = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
const menuExportar = ref(null);

const { generarDescarga, generarDescargaExcel } = useExportarCSV();

const cargarBitacora = async () => {
    cargando.value = true;
    try {
        const respuesta = await axios.get('/api/herramientas/bitacora');
        bitacora.value = respuesta.data;
    } catch (error) {
        console.error("Error al cargar la bitácora:", error);
    } finally {
        cargando.value = false;
    }
};

onMounted(() => { cargarBitacora(); });

const formatearFecha = (fechaString) => {
    return new Date(fechaString).toLocaleDateString('es-MX', { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
};

const getBadgeClase = (accion) => {
    if (accion === 'CREACION') return 'badge-creacion';
    if (accion === 'MODIFICACION') return 'badge-modificacion';
    if (accion === 'ELIMINACION') return 'badge-eliminacion';
    return 'badge-default';
};

const opcionesExportar = ref([
    { label: 'Exportar a CSV', icon: 'pi pi-file', command: () => exportarDatos('csv') },
    { label: 'Exportar a Excel', icon: 'pi pi-file-excel', command: () => exportarDatos('xlsx') }
]);

const exportarDatos = (formato) => {
    if (!bitacora.value.length) return;
    const nombreArchivo = `Bitacora_Auditoria_${new Date().toISOString().split('T')[0]}`;
    
    if (formato === 'csv') {
        const cabeceras = ['Fecha', 'Acción', 'Código Herramienta', 'Nombre Herramienta', 'Usuario', 'Rol'];
        const filas = bitacora.value.map(b => `"${formatearFecha(b.fecha)}","${b.accion}","${b.herramienta?.codigo || 'N/A'}","${b.herramienta?.nombre || 'N/A'}","${b.usuario?.nombre || 'N/A'}","${b.usuario?.rol || 'N/A'}"`);
        generarDescarga(`${nombreArchivo}.csv`, cabeceras, filas);
    } else {
        const datosExcel = bitacora.value.map(b => ({
            'Fecha': formatearFecha(b.fecha),
            'Acción': b.accion,
            'Código Herramienta': b.herramienta?.codigo || 'N/A',
            'Nombre Herramienta': b.herramienta?.nombre || 'Desconocida',
            'Usuario (Autor)': b.usuario?.nombre || 'N/A',
            'Rol': b.usuario?.rol || 'N/A'
        }));
        generarDescargaExcel(`${nombreArchivo}.xlsx`, datosExcel);
    }
};
</script>

<template>
  <div class="panel-bitacora p-4 border-round-xl shadow-1">
    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">Bitácora de Auditoría - Herramientas</h2>
    </div>

    <Toolbar class="mb-4 border-none toolbar-oscuro p-3">
      <template #start>
        <Button label="Volver" icon="pi pi-arrow-left" class="mr-3 p-button-secondary p-button-outlined btn-volver" @click="router.back()" />
        
        <Button type="button" label="Exportar Bitácora" icon="pi pi-angle-down" iconPos="right" class="btn-exportar" @click="$refs.menuExportar.toggle($event)" aria-haspopup="true" aria-controls="exportar_menu" />
        <Menu ref="menuExportar" id="exportar_menu" :model="opcionesExportar" :popup="true" class="menu-oscuro" />
      </template>
      <template #end>
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search" />
          <InputText id="buscador-bitacora" name="buscador-bitacora" v-model="filtros['global'].value" placeholder="Buscar herramienta, usuario..." class="input-oscuro" autocomplete="off" />
        </IconField>
      </template>
    </Toolbar>

    <div class="tabla-contenedor p-3 border-round shadow-1 mt-4">
        <DataTable 
            :value="bitacora" 
            :paginator="true" 
            :rows="10" 
            :filters="filtros"
            :loading="cargando"
            dataKey="id"
            class="tabla-oscura w-full"
            emptyMessage="No hay registros en la bitácora."
        >
            <Column header="Fecha / Hora" style="width: 15%">
                <template #body="{ data }">{{ formatearFecha(data.fecha) }}</template>
            </Column>
            <Column header="Acción" style="width: 15%">
                <template #body="{ data }">
                    <span :class="['badge-accion', getBadgeClase(data.accion)]">{{ data.accion }}</span>
                </template>
            </Column>
            <Column header="Herramienta" style="width: 35%">
                <template #body="{ data }">
                    <div class="font-bold text-blue-300">{{ data.herramienta?.codigo || 'N/A' }}</div>
                    <div class="text-sm text-gray-400">{{ data.herramienta?.nombre || 'Herramienta eliminada' }}</div>
                </template>
            </Column>
            <Column header="Usuario Responsable" style="width: 35%">
                <template #body="{ data }">
                    <div class="font-bold"><i class="pi pi-user mr-2 text-gray-400"></i>{{ data.usuario?.nombre || 'Sistema' }}</div>
                    <div class="text-sm text-gray-400">{{ data.usuario?.rol || 'N/A' }}</div>
                </template>
            </Column>
        </DataTable>
    </div>
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
.btn-exportar { background-color: #217346 !important; border: none !important; color: white !important; }
.btn-volver { color: #cbd5e1 !important; border-color: #4a5568 !important; }
.btn-volver:hover { background-color: #36464d !important; border-color: #cbd5e1 !important; color: white !important;}

/* Menú Oscuro */
:deep(.menu-oscuro) { background-color: #1e252d !important; border: 1px solid #4a5568 !important; }
:deep(.menu-oscuro .p-menuitem-link) { color: #ffffff !important; }
:deep(.menu-oscuro .p-menuitem-link:hover) { background-color: #36464d !important; }
:deep(.menu-oscuro .p-menuitem-icon) { color: #217346 !important; }

/* Tabla oscura (Igual que Inventario) */
:deep(.tabla-oscura .p-datatable-thead > tr > th) { background-color: transparent !important; color: #94a3b8 !important; border: none !important; border-bottom: 1px solid #4a5568 !important; padding: 1.2rem 1rem; }
:deep(.tabla-oscura .p-datatable-tbody > tr > td) { background-color: #121820 !important; color: #ffffff !important; border: none !important; border-bottom: 1px solid #1e252d !important; padding: 1rem; }
:deep(.tabla-oscura .p-datatable-tbody > tr:hover > td) { background-color: #1e252d !important; }
:deep(.p-paginator) { background-color: transparent !important; border: none !important; }
:deep(.p-paginator .p-paginator-page) { color: #94a3b8 !important; }
:deep(.p-paginator .p-paginator-page.p-highlight) { background-color: #5ab1ce !important; color: #ffffff !important; border-radius: 50%; }

/* Etiquetas de Acción (Badges) */
.badge-accion { padding: 0.35rem 0.75rem; border-radius: 6px; font-weight: 800; display: inline-block; font-size: 0.85rem; }
.badge-creacion { background-color: rgba(74, 222, 128, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); }
.badge-modificacion { background-color: rgba(96, 165, 250, 0.15); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.3); }
.badge-eliminacion { background-color: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }
.badge-default { background-color: rgba(148, 163, 184, 0.15); color: #94a3b8; }
</style>