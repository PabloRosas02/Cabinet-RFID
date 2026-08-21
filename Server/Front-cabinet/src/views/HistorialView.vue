<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Button from 'primevue/button';
import Menu from 'primevue/menu'; 
import { FilterMatchMode } from '@primevue/core/api';

import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import { useI18n } from 'vue-i18n';

import TablaHistorial from '@/components/historial/TablaHistorial.vue'; 
import ModalDetallesSalida from '@/components/historial/ModalDetallesSalidas.vue';
import { useGestorArchivos } from '@/composables/useGestordeArchivos'; 

const toast = useToast();
const { t } = useI18n(); 

const historial = ref([]);
const cargando = ref(false);
const filtros = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });

const opcionesTiempo = computed(() => [
    { label: t('view_historial.tiempo_todos'), value: 'Todos' },
    { label: t('view_historial.tiempo_hoy'), value: 'Hoy' },
    { label: t('view_historial.tiempo_semana'), value: 'Esta Semana' },
    { label: t('view_historial.tiempo_mes'), value: 'Este Mes' },
    { label: t('view_historial.tiempo_anio'), value: 'Este Año' }
]);

const filtroTiempo = ref('Todos');
const filtroEstado = ref('Todos'); 

const mostrarModal = ref(false);
const salidaSeleccionada = ref(null); 
const menuExportar = ref(null);

// CAMBIO: Se importa la nueva función del composable
const { exportarHistorialSalidas } = useGestorArchivos();

const cargarHistorial = async () => {
    cargando.value = true;
    try {
        const usuarioSesion = JSON.parse(localStorage.getItem('usuarioActivo')) || JSON.parse(localStorage.getItem('usuario'));
        // CAMBIO: Endpoint actualizado a /api/salidas/historial
        const response = await axios.get('/api/salidas/historial', {
            params: { usuarioId: usuarioSesion?.id, rol: usuarioSesion?.rol, numTrabajador: usuarioSesion?.numTrabajador }
        });
        historial.value = response.data;
    } catch (error) {
        console.error("Error al cargar historial:", error);
    } finally {
        cargando.value = false;
    }
};

onMounted(() => { cargarHistorial(); });

const toggleFiltroEstado = (estado) => {
    filtroEstado.value = filtroEstado.value === estado ? 'Todos' : estado;
};

const historialFiltrado = computed(() => {
    let datos = historial.value;
    if (filtroEstado.value !== 'Todos') datos = datos.filter(p => p.estado === filtroEstado.value);
    if (filtroTiempo.value === 'Todos') return datos;

    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    const diff = inicioSemana.getDay() === 0 ? 6 : inicioSemana.getDay() - 1;
    inicioSemana.setDate(inicioSemana.getDate() - diff);
    inicioSemana.setHours(0, 0, 0, 0);

    return datos.filter(p => {
        // CAMBIO: fechaPedido -> fechaSalida
        const fecha = new Date(p.fechaSalida);
        switch (filtroTiempo.value) {
            case 'Hoy': return fecha.getDate() === hoy.getDate() && fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
            case 'Esta Semana': return fecha >= inicioSemana;
            case 'Este Mes': return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
            case 'Este Año': return fecha.getFullYear() === hoy.getFullYear();
            default: return true;
        }
    });
});

const abrirDetalles = (salida) => {
    salidaSeleccionada.value = salida;
    mostrarModal.value = true;
};

// =====================================================================
// Opciones del Menú de Exportación
// =====================================================================
const opcionesExportar = computed(() => [
    {
        label: t('view_historial.exportar_csv'),
        icon: 'pi pi-file',
        command: () => realizarExportacion('csv')
    },
    {
        label: t('view_historial.exportar_excel'),
        icon: 'pi pi-file-excel',
        command: () => realizarExportacion('xlsx')
    }
]);

const toggleExportar = (event) => {
    menuExportar.value.toggle(event);
};

const realizarExportacion = (formato) => {
    try {
        exportarHistorialSalidas(historialFiltrado.value, filtroTiempo.value, formato);
        
        toast.add({ 
            severity: 'success', 
            summary: t('view_historial.toast_exito_titulo'), 
            detail: t('view_historial.toast_exito_detalle'), 
            life: 3000 
        });
    } catch (error) {
        toast.add({ 
            severity: 'warn', 
            summary: t('view_historial.toast_error_titulo'), 
            detail: error.message, 
            life: 3000 
        });
    }
};
</script>

<template>
  <div class="panel-principal p-3 md:p-4 border-round-xl shadow-1 mt-4">
    <Toast />

    <div class="flex justify-content-between align-items-center mb-4">
        <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">{{ t('view_historial.titulo') }}</h2>
    </div>

    <div class="flex flex-column xl:flex-row justify-content-between mb-4 gap-3">
        
        <!-- Grupo de Botones (Izquierda) -->
        <div class="flex flex-column sm:flex-row gap-2 w-full xl:w-auto">
            <Button 
                type="button" 
                :label="t('view_historial.btn_exportar')" 
                icon="pi pi-angle-down" 
                iconPos="right"
                class="btn-exportar w-full sm:w-auto"
                @click="toggleExportar" 
                aria-haspopup="true" 
                aria-controls="exportar_menu"
            />
            <Menu ref="menuExportar" id="exportar_menu" :model="opcionesExportar" :popup="true" class="menu-oscuro" />
            
            <Button :label="t('view_historial.btn_pendientes')" icon="pi pi-exclamation-triangle" class="w-full sm:w-auto" :outlined="filtroEstado !== 'PENDIENTE'" severity="danger" @click="toggleFiltroEstado('PENDIENTE')" />
            <Button :label="t('view_historial.btn_devueltos')" icon="pi pi-check-circle" class="w-full sm:w-auto" :outlined="filtroEstado !== 'DEVUELTO'" severity="success" @click="toggleFiltroEstado('DEVUELTO')" />
        </div>

        <!-- Grupo de Búsqueda y Filtros (Derecha) -->
        <div class="flex flex-column sm:flex-row gap-3 w-full xl:w-auto">
            <IconField iconPosition="left" class="w-full xl:w-30rem">
                <InputIcon class="pi pi-search" />
                <InputText 
                    id="buscadorHistorial"
                    name="buscadorHistorial"
                    :aria-label="t('view_historial.ph_buscar')"
                    v-model="filtros['global'].value" 
                    :placeholder="t('view_historial.ph_buscar')" 
                    class="w-full input-oscuro" 
                    autocomplete="off"
                />
            </IconField>
            
            <Select 
                inputId="filtroTiempoHistorial"
                name="filtroTiempoHistorial"
                :aria-label="t('view_historial.ph_filtro_tiempo')"
                v-model="filtroTiempo" 
                :options="opcionesTiempo" 
                optionLabel="label"
                optionValue="value"
                :placeholder="t('view_historial.ph_filtro_tiempo')" 
                class="w-full sm:w-15rem input-oscuro" 
                overlayClass="menu-oscuro-global" 
                panelClass="menu-oscuro-global" 
            />
        </div>
    </div>

    <TablaHistorial :historial="historialFiltrado" :cargando="cargando" :filtros="filtros" @doble-click="abrirDetalles" />

    <ModalDetallesSalida 
        :mostrar="mostrarModal" 
        :pedido="salidaSeleccionada" 
        @cerrar="mostrarModal = false" 
    />
  </div>
</template>

<style scoped>
/* =========================================================
   BOTONES DE FILTRO (Pendientes / Devueltos)
   ========================================================= */
:deep(.p-button-danger.p-button-outlined) { color: #f87171 !important; border-color: rgba(239, 68, 68, 0.5) !important; background-color: transparent !important; }
:deep(.p-button-danger.p-button-outlined:hover) { background-color: rgba(239, 68, 68, 0.1) !important; }
:deep(.p-button-danger:not(.p-button-outlined)) { background-color: rgba(239, 68, 68, 0.2) !important; color: #f87171 !important; border: 1px solid #f87171 !important; }

:deep(.p-button-success.p-button-outlined) { color: #4ade80 !important; border-color: rgba(34, 197, 94, 0.5) !important; background-color: transparent !important; }
:deep(.p-button-success.p-button-outlined:hover) { background-color: rgba(34, 197, 94, 0.1) !important; }
:deep(.p-button-success:not(.p-button-outlined)) { background-color: rgba(34, 197, 94, 0.2) !important; color: #4ade80 !important; border: 1px solid #4ade80 !important; }
</style>