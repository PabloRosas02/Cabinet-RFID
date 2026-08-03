<script setup>
import { ref, onMounted, computed } from 'vue';
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

const bitacora = ref([]);
const cargando = ref(false);
const filtros = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
const menuExportar = ref(null);

// Filtro de Tiempo
const filtroTiempo = ref('Todos');

// Modificamos opcionesTiempo para tener Label (Traducido) y Value (Estático para el código)
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

// Traducimos las etiquetas dinámicas del botón de acción
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

// ============================================================================
// FILTRADO DE LA TABLA
// ============================================================================
const bitacoraFiltrada = computed(() => {
    const ahora = new Date();
    const textoBusqueda = (filtros.value['global'].value || '').toLowerCase();

    return bitacora.value.filter(registro => {
        if (filtroAccion.value !== 'Todas' && registro.accion !== filtroAccion.value) return false;

        // La lógica interna usa los values estáticos ('Hoy', 'Esta Semana', etc.)
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

// Convertimos las opciones a un computed
const opcionesExportar = computed(() => [
    { label: t('view_bitacora_herramientas.exportar_csv'), icon: 'pi pi-file', command: () => exportarBitacora(bitacoraFiltrada.value, filtroTiempo.value, 'csv') },
    { label: t('view_bitacora_herramientas.exportar_excel'), icon: 'pi pi-file-excel', command: () => exportarBitacora(bitacoraFiltrada.value, filtroTiempo.value, 'xlsx') }
]);
</script>

<template>
  <div class="panel-principal p-3 md:p-4 border-round-xl shadow-1 mt-4">
    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">{{ t('view_bitacora_herramientas.titulo') }}</h2>
    </div>

    <!-- Toolbar superior -->
    <div class="flex flex-column xl:flex-row justify-content-between gap-3 mb-4 p-3 toolbar-oscuro border-round align-items-start xl:align-items-center">
      
      <!-- IZQUIERDA -->
      <div class="flex flex-column sm:flex-row gap-3 w-full xl:w-auto align-items-stretch sm:align-items-center">
        <Button :label="t('view_bitacora_herramientas.btn_volver')" icon="pi pi-arrow-left" class="p-button-secondary p-button-outlined btn-volver w-full sm:w-auto" @click="router.back()" />
        <IconField iconPosition="left" class="w-full xl:w-25rem">
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
      
      <!-- DERECHA -->
      <div class="flex flex-column sm:flex-row flex-wrap xl:flex-nowrap gap-2 w-full xl:w-auto justify-content-start xl:justify-content-end align-items-center">
        <Button 
            type="button" 
            :label="labelFiltroAccion" 
            :icon="iconFiltroAccion" 
            :class="claseFiltroAccion" 
            class="w-full sm:w-auto font-bold flex align-items-center justify-content-center border-round" 
            style="min-width: 200px;" 
            @click="toggleFiltroAccion" 
        />
        <!-- 6. Agregamos optionLabel y optionValue al Select -->
        <Select 
            v-model="filtroTiempo" 
            :options="opcionesTiempo" 
            optionLabel="label"
            optionValue="value"
            :placeholder="t('view_bitacora_herramientas.ph_filtro_fecha')" 
            class="w-full sm:w-auto input-oscuro flex align-items-center" 
            style="min-width: 170px;" 
            overlayClass="menu-oscuro-global" 
            panelClass="menu-oscuro-global" 
        />
        <Button 
            type="button" 
            :label="t('view_bitacora_herramientas.btn_exportar')" 
            icon="pi pi-angle-down" 
            iconPos="right" 
            class="btn-exportar w-full sm:w-auto font-bold" 
            @click="$refs.menuExportar.toggle($event)" 
            aria-haspopup="true" 
            aria-controls="exportar_menu" 
        />
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