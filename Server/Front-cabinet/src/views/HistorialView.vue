<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Button from 'primevue/button';
import Menu from 'primevue/menu'; 
import Chip from 'primevue/chip';
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

// Búsqueda Global y Categorías
const busquedaTexto = ref('');
const filtros = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });

const categoriasDisponibles = computed(() => [
    { key: 'id', label: t('view_historial.categorias.folio') },
    { key: 'numeroOrden', label: t('view_historial.categorias.orden') },
    { key: 'numeroMaquina', label: t('view_historial.categorias.maquina') },
    { key: 'prestadorNombre', label: t('view_historial.categorias.presto') },
    { key: 'receptorNombre', label: t('view_historial.categorias.recibio') },
    { key: 'trabajadorNombre', label: t('view_historial.categorias.solicito') },
    { key: 'trabajadorNumero', label: t('view_historial.categorias.no_empleado') },
    { key: 'herramientas', label: t('view_historial.categorias.herramientas') }
]);

const categoriasSeleccionadas = ref([
    'id', 'numeroOrden', 'numeroMaquina', 'prestadorNombre', 'receptorNombre', 'trabajadorNombre', 'herramientas', 'trabajadorNumero'
]);

const toggleCategoria = (key) => {
    const index = categoriasSeleccionadas.value.indexOf(key);
    
    if (index > -1) {
        // Si ya está seleccionada y hay más de una categoría activa, la quitamos
        if (categoriasSeleccionadas.value.length > 1) {
            categoriasSeleccionadas.value.splice(index, 1);
        }
    } else {
        // Si no está seleccionada, la agregamos a las seleccionadas
        categoriasSeleccionadas.value.push(key);
    }
};

const placeholderDinamico = computed(() => {
    if (categoriasSeleccionadas.value.length === categoriasDisponibles.value.length) {
        return t('view_historial.ph_buscar_todos');
    }
    const nombres = categoriasDisponibles.value
        .filter(c => categoriasSeleccionadas.value.includes(c.key))
        .map(c => c.label.toLowerCase())
        .join(', ');
    return `${t('view_historial.buscar_en')} ${nombres}...`;
});

watch(busquedaTexto, (nuevoTexto) => {
    if (filtros.value && filtros.value.global) {
        filtros.value.global.value = nuevoTexto;
    }
});

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

const { exportarHistorialSalidas } = useGestorArchivos();

const cargarHistorial = async () => {
    cargando.value = true;
    try {
        const usuarioSesion = JSON.parse(localStorage.getItem('usuarioActivo')) || JSON.parse(localStorage.getItem('usuario'));
        
        const params = {
            usuarioId: usuarioSesion?.id,
            numTrabajador: usuarioSesion?.numTrabajador,
            search: busquedaTexto.value, // <--- Agregar
            categories: categoriasSeleccionadas.value.join(',') // <--- Agregar
        };

        const response = await axios.get('/api/salidas/historial', { params });
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
        const fechaBase = p.created_at || p.fechaSalida;
        if (!fechaBase) return false;

        const fecha = new Date(fechaBase);
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

const opcionesExportar = computed(() => [
    {
        label: 'CSV',
        icon: 'pi pi-file',
        command: () => realizarExportacion('csv')
    },
    {
        label: 'Excel',
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
        toast.add({ severity: 'success', summary: t('view_historial.toast_exito_titulo'), detail: t('view_historial.toast_exito_detalle'), life: 3000 });
    } catch (error) {
        toast.add({ severity: 'warn', summary: t('view_historial.toast_error_titulo'), detail: error.message, life: 3000 });
    }
};

let timeoutBusqueda = null;
watch([busquedaTexto, categoriasSeleccionadas], () => {
    clearTimeout(timeoutBusqueda);
    timeoutBusqueda = setTimeout(() => {
        cargarHistorial();
    }, 300);
}, { deep: true });

</script>

<template>
  <div class="panel-principal p-3 md:p-4 border-round-xl shadow-1 mt-4 max-w-full overflow-hidden">
    <Toast />

    <div class="flex justify-content-between align-items-center mb-4">
        <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">{{ t('view_historial.titulo') }}</h2>
    </div>

    <!-- Toolbar Superior Unificada con Chips, Filtros de Tiempo y Estado -->
    <div class="flex flex-column gap-3 mb-4 p-3 toolbar-oscuro border-round">

        <!-- Fila 1: Chips a la izquierda y Botones de Acción / Estado a la derecha -->
        <div class="flex flex-wrap align-items-center justify-content-between gap-3">
            
            <!-- Chips de Categoría -->
            <div class="flex flex-wrap align-items-center gap-2">
                <span class="text-sm font-bold text-400 mr-2">{{ t('view_historial.buscar_en') }}:</span>
                <Chip 
                    v-for="cat in categoriasDisponibles" 
                    :key="cat.key"
                    :label="cat.label"
                    :class="['chip-categoria cursor-pointer', { 'active': categoriasSeleccionadas.includes(cat.key) }]"
                    @click="toggleCategoria(cat.key)"
                />
            </div>

            <!-- Acciones: Exportar + Filtros Pendientes/Devueltos -->
            <div class="flex flex-wrap align-items-center gap-2 w-full lg:w-auto">
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
                
                <Button 
                    :label="t('view_historial.btn_pendientes')" 
                    icon="pi pi-exclamation-triangle" 
                    class="w-full sm:w-auto" 
                    :outlined="filtroEstado !== 'PENDIENTE'" 
                    severity="danger" 
                    @click="toggleFiltroEstado('PENDIENTE')" 
                />
                <Button 
                    :label="t('view_historial.btn_devueltos')" 
                    icon="pi pi-check-circle" 
                    class="w-full sm:w-auto" 
                    :outlined="filtroEstado !== 'DEVUELTO'" 
                    severity="success" 
                    @click="toggleFiltroEstado('DEVUELTO')" 
                />
            </div>
        </div>

        <!-- Fila 2: Input de Búsqueda Generico + Select de Rango de Tiempo -->
        <div class="flex flex-column sm:flex-row align-items-center gap-3 w-full">
            <IconField iconPosition="left" class="w-full">
                <InputIcon class="pi pi-search" />
                <InputText 
                    id="buscadorHistorial"
                    name="buscadorHistorial"
                    v-model="busquedaTexto" 
                    :placeholder="placeholderDinamico" 
                    class="input-oscuro w-full input-buscador-grande" 
                    autocomplete="off"
                />
            </IconField>
            
            <Select 
                inputId="filtroTiempoHistorial"
                name="filtroTiempoHistorial"
                v-model="filtroTiempo" 
                :options="opcionesTiempo" 
                optionLabel="label"
                optionValue="value"
                class="w-full sm:w-15rem input-oscuro flex-shrink-0 select-tiempo-alineado" 
                overlayClass="menu-oscuro-global" 
                panelClass="menu-oscuro-global" 
            />
        </div>

    </div>

    <!-- Tabla con Filtros Aplicados -->
    <TablaHistorial 
        :historial="historialFiltrado" 
        :cargando="cargando" 
        :filtros="filtros" 
        :globalFilterFields="categoriasSeleccionadas"
        @doble-click="abrirDetalles" 
    />

    <ModalDetallesSalida 
        :mostrar="mostrarModal" 
        :pedido="salidaSeleccionada" 
        @cerrar="mostrarModal = false" 
    />
  </div>
</template>

<style scoped>
.input-buscador-grande {
    font-size: 1.05rem;
    padding: 0.75rem 1rem 0.75rem 2.5rem !important;
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

.select-tiempo-alineado :deep(.p-select-label) {
    display: flex;
    align-items: center;
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
}

:deep(.p-button-danger.p-button-outlined) { color: #f87171 !important; border-color: rgba(239, 68, 68, 0.5) !important; background-color: transparent !important; }
:deep(.p-button-danger.p-button-outlined:hover) { background-color: rgba(239, 68, 68, 0.1) !important; }
:deep(.p-button-danger:not(.p-button-outlined)) { background-color: rgba(239, 68, 68, 0.2) !important; color: #f87171 !important; border: 1px solid #f87171 !important; }

:deep(.p-button-success.p-button-outlined) { color: #4ade80 !important; border-color: rgba(34, 197, 94, 0.5) !important; background-color: transparent !important; }
:deep(.p-button-success.p-button-outlined:hover) { background-color: rgba(34, 197, 94, 0.1) !important; }
:deep(.p-button-success:not(.p-button-outlined)) { background-color: rgba(34, 197, 94, 0.2) !important; color: #4ade80 !important; border: 1px solid #4ade80 !important; }
</style>