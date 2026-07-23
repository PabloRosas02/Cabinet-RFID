<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router'; 
import { FilterMatchMode } from '@primevue/core/api';
import { useHerramientas } from '@/composables/useHerramientas';

import { useExportarCSV } from '@/composables/useExportarCSV.js';
import Menu from 'primevue/menu';

import Button from 'primevue/button';
import Toolbar from 'primevue/toolbar';
import InputText from 'primevue/inputtext';

import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

import TablaHerramientas from '@/components/herramientas/TablaHerramientas.vue';
import DetalleHerramienta from '@/components/herramientas/DetalleHerramientas.vue';

const router = useRouter(); 
const { herramientas, cargando, herramientaActual } = useHerramientas();
const { generarDescarga, generarDescargaExcel } = useExportarCSV();

const tablaRef = ref();
const menuExportar = ref();
const verSoloAlertas = ref(false);
const herramientaSeleccionada = ref(null);
const mostrarModalDetalle = ref(false);

const filtros = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const herramientasVisibles = computed(() => {
    if (!verSoloAlertas.value) return herramientas.value;
    return herramientas.value.filter(h => h.cantidadDisponible <= h.cantidadMinima);
});

const manejarSeleccion = (seleccion) => {
    herramientaSeleccionada.value = seleccion;
};

const abrirDetalles = (herramienta) => {
    herramientaActual.value = { ...herramienta };
    mostrarModalDetalle.value = true;
};

// <-- OPCIONES DEL MENÚ DE EXPORTACIÓN -->
const opcionesExportar = ref([
    {
        label: 'Exportar a CSV',
        icon: 'pi pi-file',
        command: () => realizarExportacion('csv')
    },
    {
        label: 'Exportar a Excel (.xlsx)',
        icon: 'pi pi-file-excel',
        command: () => realizarExportacion('xlsx')
    }
]);

const toggleExportar = (event) => {
    menuExportar.value.toggle(event);
};

// <-- LÓGICA DE EXPORTACIÓN BASADA EN HERRAMIENTAS VISIBLES -->
const realizarExportacion = (formato) => {
    if (!herramientasVisibles.value || herramientasVisibles.value.length === 0) {
        alert("No hay datos para exportar con los filtros actuales.");
        return;
    }

    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Reporte_Inventario_${fecha}`;

    if (formato === 'csv') {
        const cabeceras = ['Código', 'Nombre', 'Tipo', 'Ubicación', 'Stock Mín.', 'Stock Físico'];
        const filas = herramientasVisibles.value.map(h => {
            return `"${h.codigo}","${h.nombre}","${h.tipo || ''}","${h.ubicacion || ''}","${h.cantidadMinima}","${h.cantidadDisponible}"`;
        });
        generarDescarga(`${nombreArchivo}.csv`, cabeceras, filas);
    } 
    else if (formato === 'xlsx') {
        const datosParaExcel = herramientasVisibles.value.map(h => ({
            Código: h.codigo,
            Nombre: h.nombre,
            Tipo: h.tipo || 'N/A',
            Ubicación: h.ubicacion || 'N/A',
            'Stock Mínimo': h.cantidadMinima,
            'Stock Físico': h.cantidadDisponible
        }));
        generarDescargaExcel(`${nombreArchivo}.xlsx`, datosParaExcel);
    }
};

const irAMovimientos = () => {
    router.push('/movimientos');
};

// <-- NUEVA FUNCIÓN: Navegar a la Bitácora -->
const irABitacora = () => {
    router.push('/bitacora');
};
</script>

<template>
  <div class="panel-herramientas p-4 border-round-xl shadow-1">
    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">Control de Inventario - Herramientas</h2>
    </div>

    <Toolbar class="mb-4 border-none toolbar-oscuro p-3">
      <template #start>
        <Button 
            type="button" 
            label="Exportar Inventario" 
            icon="pi pi-angle-down" 
            iconPos="right"
            class="mr-2 btn-exportar"
            @click="toggleExportar" 
            aria-haspopup="true" 
            aria-controls="exportar_menu"
        />
        <Menu ref="menuExportar" id="exportar_menu" :model="opcionesExportar" :popup="true" class="menu-oscuro" />
        
        <Button 
            :label="verSoloAlertas ? 'Mostrando Todo' : 'Solo Alertas'" 
            :icon="verSoloAlertas ? 'pi pi-check' : 'pi pi-exclamation-triangle'" 
            :severity="verSoloAlertas ? 'success' : 'warning'"
            :outlined="!verSoloAlertas"
            class="mr-2 btn-alertas"
            @click="verSoloAlertas = !verSoloAlertas" 
        />

        <Button 
            label="Actualizar Inventario" 
            icon="pi pi-sync" 
            severity="info"
            class="mr-2 btn-actualizar"
            @click="irAMovimientos" 
        />

        <!-- <-- NUEVO BOTÓN: Bitácora de Auditoría -->
        <Button 
            label="Bitácora de Auditoría" 
            icon="pi pi-history" 
            class="btn-bitacora"
            @click="irABitacora" 
        />
      </template>
      <template #end>
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search" />
          <InputText v-model="filtros['global'].value" placeholder="Buscar código, nombre..." class="input-oscuro" />
        </IconField>
      </template>
    </Toolbar>

    <TablaHerramientas
      ref="tablaRef"
      :herramientas="herramientasVisibles"
      :cargando="cargando"
      :filtros="filtros"
      @seleccion="manejarSeleccion"
      @doble-click="abrirDetalles"
    />

    <DetalleHerramienta
      v-model:visible="mostrarModalDetalle"
      :herramienta="herramientaActual"
    />
  </div>
</template>

<style scoped>
/* CONTENEDOR PRINCIPAL - Fondo de Pedidos */
.panel-herramientas { 
    background-color: #2a323d !important; 
    color: #ffffff;
}

/* TOOLBAR OSCURA */
.toolbar-oscuro {
    background-color: #1e252d !important;
}

/* INPUT OSCURO */
:deep(.input-oscuro) { 
    background-color: #121820 !important; 
    color: #ffffff !important; 
    border: 1px solid #4a5568 !important; 
}
:deep(.input-oscuro:focus) { 
    border-color: #5ab1ce !important; 
    box-shadow: 0 0 0 1px #5ab1ce !important; 
}

/* BOTONES CORREGIDOS */
.btn-exportar {
    background-color: #16a34a !important; 
    border: none !important;
    color: white !important;
}

.btn-actualizar {
    background-color: #0ea5e9 !important; 
    border: none !important;
    color: white !important;
}
.btn-actualizar:hover {
    background-color: #0284c7 !important;
}

/* <-- ESTILOS PARA EL NUEVO BOTÓN DE BITÁCORA --> */
.btn-bitacora {
    background-color: #4b5563 !important; 
    border: none !important;
    color: white !important;
}
.btn-bitacora:hover {
    background-color: #374151 !important;
}

:deep(.btn-alertas.p-button-warning.p-button-outlined) {
    color: #fbbf24 !important; 
    border-color: #fbbf24 !important;
    background-color: transparent !important;
}
:deep(.btn-alertas.p-button-warning.p-button-outlined:hover) {
    background-color: rgba(251, 191, 36, 0.15) !important;
}

:deep(.btn-alertas.p-button-success) {
    background-color: #22c55e !important; 
    border: none !important;
    color: white !important;
}
:deep(.btn-alertas.p-button-success:hover) {
    background-color: #16a34a !important;
}

/* Aplicamos blanco a todos los íconos de nuestros botones sólidos */
.btn-exportar i,
.btn-actualizar i,
.btn-bitacora i {
    color: white !important;
}

/* =========================================================
   Estilos para el menú desplegable (Menú Oscuro)
   ========================================================= */
:deep(.menu-oscuro) {
    background-color: #1e252d !important;
    border: 1px solid #4a5568 !important;
}
:deep(.menu-oscuro .p-menuitem-link) {
    color: #ffffff !important;
}
:deep(.menu-oscuro .p-menuitem-link:hover) {
    background-color: #36464d !important;
}
:deep(.menu-oscuro .p-menuitem-icon) {
    color: #217346 !important; /* Verde Excel para los iconos del menú */
}
</style>