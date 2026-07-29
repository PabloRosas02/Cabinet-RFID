<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { FilterMatchMode } from '@primevue/core/api';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Menu from 'primevue/menu';
import Dialog from 'primevue/dialog'; 

import { HerramientasService } from '@/services/herramientasService';
import { useGestorArchivos } from '@/composables/useGestordeArchivos';

const router = useRouter();
const bitacora = ref([]);
const cargando = ref(false);
const filtros = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
const menuExportar = ref(null);

// Variables para controlar la ventana de detalles
const mostrarModalDetalles = ref(false);
const registroSeleccionado = ref(null);

// Solo importamos la función experta
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

// Función que se ejecuta al dar doble clic en la fila o al presionar el ojito
const abrirDetalles = (eventoOData) => {
    // Si viene de doble clic, PrimeVue manda los datos en evento.data. Si es del botón, viene directo.
    registroSeleccionado.value = eventoOData.data || eventoOData;
    mostrarModalDetalles.value = true;
};

// Separa el texto del backend en renglones para listarlo en el modal
const obtenerListaDetalles = (texto) => {
    if (!texto) return [];
    return texto.split('\n');
};

// Las opciones llaman directamente al servicio con el arreglo de datos
const opcionesExportar = ref([
    { label: 'Exportar a CSV', icon: 'pi pi-file', command: () => exportarBitacora(bitacora.value, 'csv') },
    { label: 'Exportar a Excel', icon: 'pi pi-file-excel', command: () => exportarBitacora(bitacora.value, 'xlsx') }
]);
</script>

<template>
  <div class="panel-bitacora p-3 md:p-4 border-round-xl shadow-1 mt-4">
    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">Bitácora de Auditoría</h2>
    </div>

    <div class="flex flex-column md:flex-row justify-content-between gap-3 mb-4 p-3 toolbar-oscuro border-round">

      <div class="flex flex-column sm:flex-row gap-2 w-full md:w-auto">
        <Button 
            label="Volver" 
            icon="pi pi-arrow-left" 
            class="p-button-secondary p-button-outlined btn-volver w-full sm:w-auto" 
            @click="router.back()" 
        />
        
        <Button 
            type="button" 
            label="Exportar Bitácora" 
            icon="pi pi-angle-down" 
            iconPos="right" 
            class="btn-exportar w-full sm:w-auto" 
            @click="$refs.menuExportar.toggle($event)" 
            aria-haspopup="true" 
            aria-controls="exportar_menu" 
        />
        <Menu ref="menuExportar" id="exportar_menu" :model="opcionesExportar" :popup="true" class="menu-oscuro" />
      </div>
      
      <!-- Buscador -->
      <div class="w-full md:w-auto">
        <IconField iconPosition="left" class="w-full">
          <InputIcon class="pi pi-search" />
          <InputText 
            id="buscador-bitacora" 
            name="buscador-bitacora" 
            v-model="filtros['global'].value" 
            placeholder="Buscar herramienta, usuario..." 
            class="input-oscuro w-full" 
            autocomplete="off" 
        />
        </IconField>
      </div>
    </div>

    <div class="tabla-contenedor p-3 border-round shadow-1 mt-4">
        <DataTable 
            :value="bitacora" 
            :paginator="true" 
            :rows="10" 
            :filters="filtros"
            :loading="cargando"
            dataKey="id"
            class="tabla-oscura w-full cursor-pointer"
            emptyMessage="No hay registros en la bitácora."
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
            
            <!-- CORREGIDO: data.detalle (sin 's') -->
            <Column header="Detalle Breve (Doble clic para ver más)" style="min-width: 250px; width: 30%">
                <template #body="{ data }">
                    <div class="flex align-items-center gap-2">
                        <Button icon="pi pi-eye" class="p-button-rounded p-button-text p-button-info p-0 m-0" style="height: 2rem; width: 2rem;" @click="abrirDetalles(data)" />
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

    <!-- MODAL DE DETALLES DEL MOVIMIENTO (ANTES Y DESPUÉS) -->
    <Dialog 
        v-model:visible="mostrarModalDetalles" 
        header="Desglose del Movimiento" 
        :modal="true" 
        :style="{ width: '550px' }" 
        :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
        class="modal-oscuro"
    >
        <div v-if="registroSeleccionado" class="flex flex-column gap-3 pt-2">
            
            <!-- Cabecera: Qué herramienta y qué acción -->
            <div class="flex justify-content-between border-bottom-1 border-gray-700 pb-3">
                <div>
                    <span class="block text-gray-400 text-sm mb-1">Herramienta Afectada</span>
                    <span class="font-bold text-blue-300 text-lg">{{ registroSeleccionado.herramienta?.codigo || 'N/A' }}</span>
                    <div class="text-white">{{ registroSeleccionado.herramienta?.nombre }}</div>
                </div>
                <div class="text-right">
                    <span class="block text-gray-400 text-sm mb-1">Tipo de Acción</span>
                    <span :class="['badge-accion', getBadgeClase(registroSeleccionado.accion)]">{{ registroSeleccionado.accion }}</span>
                </div>
            </div>

            <!-- CORREGIDO: registroSeleccionado.detalle (sin 's') -->
            <div v-if="registroSeleccionado.accion === 'MODIFICACION' && registroSeleccionado.detalle" class="mt-2">
                <span class="block text-gray-400 text-sm mb-2"><i class="pi pi-file-edit mr-2"></i>Historial de Modificaciones (Antes ➔ Después):</span>
                <ul class="m-0 pl-0 list-none flex flex-column gap-3">
                    <li v-for="(linea, index) in obtenerListaDetalles(registroSeleccionado.detalle)" :key="index" class="p-3 border-round surface-ground border-1 border-gray-700">
                        <template v-if="linea.includes('➔')">
                            <!-- Nombre del campo modificado -->
                            <div class="text-sm font-bold text-gray-300 mb-2 uppercase" style="font-size: 0.75rem; letter-spacing: 0.05em;">
                                {{ linea.split(':')[0] }}
                            </div>
                            <!-- Valores (Rojo -> Verde) -->
                            <div class="flex align-items-center gap-2">
                                <span class="text-red-400 line-through text-sm bg-red-900 px-2 py-1 border-round">{{ linea.substring(linea.indexOf(':') + 1).split('➔')[0].trim() }}</span>
                                <i class="pi pi-arrow-right text-gray-500 text-xs"></i>
                                <span class="text-green-400 font-bold text-sm bg-green-900 px-2 py-1 border-round">{{ linea.split('➔')[1].trim() }}</span>
                            </div>
                        </template>
                        <template v-else>
                            <span class="text-sm text-gray-300">{{ linea }}</span>
                        </template>
                    </li>
                </ul>
            </div>

            <!-- Para creaciones o eliminaciones -->
            <div v-else class="surface-ground p-3 border-round border-1 border-gray-700 text-gray-300 text-sm mt-2">
                <p v-if="registroSeleccionado.accion === 'CREACION'" class="m-0"><i class="pi pi-plus-circle text-green-400 mr-2"></i>La herramienta fue dada de alta en el sistema.</p>
                <p v-else-if="registroSeleccionado.accion === 'ELIMINACION'" class="m-0"><i class="pi pi-trash text-red-400 mr-2"></i>La herramienta fue eliminada.</p>
                <!-- CORREGIDO: registroSeleccionado.detalle (sin 's') -->
                <p v-else class="m-0">{{ registroSeleccionado.detalle || 'Sin detalles registrados.' }}</p>
            </div>

            <!-- Pie de la ventana: Quién y Cuándo -->
            <div class="mt-3 p-3 border-round border-1 border-gray-700 bg-black-alpha-20 flex justify-content-between align-items-center">
                <div>
                    <span class="block text-xs text-gray-500 mb-1">Ejecutado por</span>
                    <span class="text-sm font-bold text-white"><i class="pi pi-user mr-2 text-gray-400"></i>{{ registroSeleccionado.usuario?.nombre || 'Desconocido' }}</span>
                </div>
                <div class="text-right">
                    <span class="block text-xs text-gray-500 mb-1">Fecha de la transacción</span>
                    <span class="text-sm text-gray-300"><i class="pi pi-clock mr-2 text-gray-400"></i>{{ formatearFecha(registroSeleccionado.fecha) }}</span>
                </div>
            </div>

        </div>
        <template #footer>
            <div class="flex justify-content-end mt-2">
                <Button label="Cerrar Detalles" icon="pi pi-times" class="p-button-secondary p-button-outlined text-gray-300 border-gray-600" @click="mostrarModalDetalles = false" />
            </div>
        </template>
    </Dialog>
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

/* Efecto de Puntero al pasar el Mouse por las filas */
.cursor-pointer :deep(tbody tr) { cursor: pointer; transition: background-color 0.2s; }

/* Tabla oscura (Igual que Inventario) */
:deep(.tabla-oscura .p-datatable-thead > tr > th) { background-color: transparent !important; color: #94a3b8 !important; border: none !important; border-bottom: 1px solid #4a5568 !important; padding: 1.2rem 1rem; }
:deep(.tabla-oscura .p-datatable-tbody > tr > td) { background-color: #121820 !important; color: #ffffff !important; border: none !important; border-bottom: 1px solid #1e252d !important; padding: 1rem; }
:deep(.tabla-oscura .p-datatable-tbody > tr:hover > td) { background-color: #1e252d !important; }
:deep(.p-paginator) { background-color: transparent !important; border: none !important; }
:deep(.p-paginator .p-paginator-page) { color: #94a3b8 !important; }
:deep(.p-paginator .p-paginator-page.p-highlight) { background-color: #5ab1ce !important; color: #ffffff !important; border-radius: 50%; }

/* SCROLL HORIZONTAL RESPONSIVO */
:deep(.p-datatable-wrapper::-webkit-scrollbar) { height: 6px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-thumb) { background: #4a5568; border-radius: 4px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-track) { background: transparent; }

/* Etiquetas de Acción (Badges) */
.badge-accion { padding: 0.35rem 0.75rem; border-radius: 6px; font-weight: 800; display: inline-block; font-size: 0.85rem; text-align: center;}
.badge-creacion { background-color: rgba(74, 222, 128, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); }
.badge-modificacion { background-color: rgba(96, 165, 250, 0.15); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.3); }
.badge-eliminacion { background-color: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }
.badge-default { background-color: rgba(148, 163, 184, 0.15); color: #94a3b8; }

/* =========================================================
   ESTILOS PARA EL MODAL OSCURO DE DETALLES
   ========================================================= */
:deep(.modal-oscuro) { 
    background-color: #1e252d !important; 
    border: 1px solid #4a5568 !important; 
    border-radius: 8px !important; 
    box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
}
:deep(.modal-oscuro .p-dialog-header), :deep(.modal-oscuro .p-dialog-content), :deep(.modal-oscuro .p-dialog-footer) { 
    background-color: #1e252d !important; 
    color: #ffffff !important; 
    border: none !important; 
}
:deep(.modal-oscuro .p-dialog-header) { 
    border-bottom: 1px solid #2a323d !important; 
    padding-top: 1.5rem !important; 
}
:deep(.modal-oscuro .p-dialog-footer) { 
    border-top: 1px solid #2a323d !important; 
    padding-bottom: 1.5rem !important; 
}
:deep(.modal-oscuro .p-dialog-header-icon) { color: #94a3b8 !important; }
:deep(.modal-oscuro .p-dialog-header-icon:hover) { background-color: rgba(255, 255, 255, 0.05) !important; color: #ffffff !important; }
.surface-ground { background-color: #121820 !important; }
</style>