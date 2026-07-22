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

import TablaHistorial from '@/components/historial/TablaHistorial.vue'; 
import ModalDetallesPedido from '@/components/historial/ModalDetallesPedido.vue';
import { useExportarCSV } from '@/composables/useExportarCSV.js';

const toast = useToast();

const historial = ref([]);
const cargando = ref(false);
const filtros = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
const opcionesTiempo = ref(['Todos', 'Hoy', 'Esta Semana', 'Este Mes', 'Este Año']);
const filtroTiempo = ref('Todos');
const filtroEstado = ref('Todos'); 

const mostrarModal = ref(false);
const pedidoSeleccionado = ref(null);
const menuExportar = ref(null);

const { generarDescarga, generarDescargaExcel } = useExportarCSV();

const cargarHistorial = async () => {
    cargando.value = true;
    try {
        const usuarioSesion = JSON.parse(localStorage.getItem('usuarioActivo')) || JSON.parse(localStorage.getItem('usuario'));
        const response = await axios.get('/api/pedidos/historial', {
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
        const fecha = new Date(p.fechaPedido);
        switch (filtroTiempo.value) {
            case 'Hoy': return fecha.getDate() === hoy.getDate() && fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
            case 'Esta Semana': return fecha >= inicioSemana;
            case 'Este Mes': return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
            case 'Este Año': return fecha.getFullYear() === hoy.getFullYear();
            default: return true;
        }
    });
});

const formatearFecha = (fechaString) => {
    if (!fechaString) return 'Pendiente';
    return new Date(fechaString).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const abrirDetalles = (pedido) => {
    pedidoSeleccionado.value = pedido;
    mostrarModal.value = true;
};

// =====================================================================
// Opciones del Menú de Exportación
// =====================================================================
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

// =====================================================================
// Lógica de Exportación Dual
// =====================================================================
const realizarExportacion = (formato) => {
    if (!historialFiltrado.value || historialFiltrado.value.length === 0) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Sin datos', 
            detail: 'No hay registros para exportar con los filtros actuales.', 
            life: 3000 
        });
        return;
    }

    const hoy = new Date();
    const sufijoFecha = filtroTiempo.value === 'Hoy' || filtroTiempo.value === 'Todos' ? `${hoy.getDate().toString().padStart(2, '0')}_${hoy.toLocaleString('es-MX', { month: 'short' }).replace('.', '')}_${hoy.getFullYear()}` : 
                        filtroTiempo.value === 'Este Mes' ? `${hoy.toLocaleString('es-MX', { month: 'long' })}_${hoy.getFullYear()}` : 
                        filtroTiempo.value === 'Este Año' ? `${hoy.getFullYear()}` : `Semana_${hoy.getDate()}`; 
    const nombreArchivo = `Reporte_Historial_${sufijoFecha}`; // <-- Cambiado a Historial
    
    if (formato === 'csv') {
        const cabeceras = ['Folio', 'Autorizó (Prestador)', 'Solicitó (Empleado)', 'Fecha Préstamo', 'Fecha Devolución General', 'Resumen de Herramientas', 'Observaciones (Rastreo Parcial)', 'Estado'];

        const filas = historialFiltrado.value.map(pedido => {
            const folio = `#${pedido.id}`;
            const autorizo = pedido.prestadorNombre || 'N/A';
            const solicito = `${pedido.trabajadorNumero} - ${pedido.trabajadorNombre}`;
            const herramientas = pedido.herramientas.map(h => `${h.cantidadPrestada}x ${h.nombre}` + (h.cantidadRegresada > 0 ? ` (Regresó: ${h.cantidadRegresada})` : '')).join(' | ');

            const observaciones = pedido.herramientas.map(h => {
                if (h.historialDevoluciones?.length > 0) {
                    const validas = h.historialDevoluciones.filter(d => d.cantidad > 0);
                    if (validas.length > 0) return `[${h.nombre}]: ` + validas.map(dev => `${dev.cantidad}x recibidas por ${dev.receptorNombre} (${formatearFecha(dev.fecha)})`).join('; ');
                }
                return null;
            }).filter(Boolean).join(' || ') || 'Sin recepciones registradas';

            return [`"${folio}"`, `"${autorizo}"`, `"${solicito}"`, `"${formatearFecha(pedido.fechaPedido)}"`, `"${formatearFecha(pedido.fechaDevolucion)}"`, `"${herramientas}"`, `"${observaciones}"`, `"${pedido.estado}"`].join(',');
        });

        generarDescarga(`${nombreArchivo}.csv`, cabeceras, filas);
    } 
    else if (formato === 'xlsx') {
        const datosParaExcel = historialFiltrado.value.map(pedido => {
            const herramientas = pedido.herramientas.map(h => `${h.cantidadPrestada}x ${h.nombre}` + (h.cantidadRegresada > 0 ? ` (Regresó: ${h.cantidadRegresada})` : '')).join(' | ');
            
            const observaciones = pedido.herramientas.map(h => {
                if (h.historialDevoluciones?.length > 0) {
                    const validas = h.historialDevoluciones.filter(d => d.cantidad > 0);
                    if (validas.length > 0) return `[${h.nombre}]: ` + validas.map(dev => `${dev.cantidad}x recibidas por ${dev.receptorNombre} (${formatearFecha(dev.fecha)})`).join('; ');
                }
                return null;
            }).filter(Boolean).join(' || ') || 'Sin recepciones registradas';

            return {
                'Folio': `#${pedido.id}`,
                'Autorizó (Prestador)': pedido.prestadorNombre || 'N/A',
                'Solicitó (Empleado)': `${pedido.trabajadorNumero} - ${pedido.trabajadorNombre}`,
                'Fecha Préstamo': formatearFecha(pedido.fechaPedido),
                'Fecha Devolución General': formatearFecha(pedido.fechaDevolucion),
                'Resumen de Herramientas': herramientas,
                'Observaciones (Rastreo Parcial)': observaciones,
                'Estado': pedido.estado
            };
        });

        generarDescargaExcel(`${nombreArchivo}.xlsx`, datosParaExcel);
    }

    toast.add({ 
        severity: 'success', 
        summary: 'Exportación Exitosa', 
        detail: `El archivo se ha generado correctamente.`, 
        life: 3000 
    });
};
</script>

<template>
  <div class="panel-principal p-4 border-round-xl shadow-1 mt-4">
    <Toast />

    <div class="flex justify-content-between align-items-center mb-4">
        <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">Historial y Reportes</h2>
    </div>

    <!-- Barra de Controles -->
    <div class="flex flex-column md:flex-row justify-content-between mb-4 gap-3 align-items-start md:align-items-center">
        <div class="flex gap-2 flex-wrap">
            <!-- BOTÓN CON MENÚ DESPLEGABLE -->
            <Button 
                type="button" 
                label="Exportar Historial" 
                icon="pi pi-angle-down" 
                iconPos="right"
                class="btn-exportar"
                @click="toggleExportar" 
                aria-haspopup="true" 
                aria-controls="exportar_menu"
            />
            <Menu ref="menuExportar" id="exportar_menu" :model="opcionesExportar" :popup="true" class="menu-oscuro" />
            
            <Button label="Pendientes" icon="pi pi-exclamation-triangle" :outlined="filtroEstado !== 'PENDIENTE'" severity="danger" @click="toggleFiltroEstado('PENDIENTE')" />
            <Button label="Devueltos" icon="pi pi-check-circle" :outlined="filtroEstado !== 'DEVUELTO'" severity="success" @click="toggleFiltroEstado('DEVUELTO')" />
        </div>

        <div class="flex flex-column sm:flex-row gap-3 w-full md:w-auto">
            <IconField iconPosition="left" class="w-full sm:w-20rem">
                <InputIcon class="pi pi-search" />
                <InputText v-model="filtros['global'].value" placeholder="Buscar por empleado o prestador..." class="w-full input-oscuro" />
            </IconField>
            <Select v-model="filtroTiempo" :options="opcionesTiempo" placeholder="Filtrar por período" class="w-full sm:w-15rem input-oscuro" overlayClass="menu-oscuro-global" panelClass="menu-oscuro-global" />
        </div>
    </div>

    <TablaHistorial :historial="historialFiltrado" :cargando="cargando" :filtros="filtros" @doble-click="abrirDetalles" />

    <ModalDetallesPedido 
        :mostrar="mostrarModal" 
        :pedido="pedidoSeleccionado" 
        @cerrar="mostrarModal = false" 
    />
  </div>
</template>

<style scoped>
.panel-principal { background-color: #2a323d !important; color: #ffffff; border: 1px solid #4a5568 !important; }
.btn-exportar { background-color: #16a34a !important; border: none !important; color: white !important; font-weight: bold; }
.btn-exportar:hover { background-color: #15803d !important; }

:deep(.p-button-danger.p-button-outlined) { color: #f87171 !important; border-color: rgba(239, 68, 68, 0.5) !important; background-color: transparent !important; }
:deep(.p-button-danger.p-button-outlined:hover) { background-color: rgba(239, 68, 68, 0.1) !important; }
:deep(.p-button-danger:not(.p-button-outlined)) { background-color: rgba(239, 68, 68, 0.2) !important; color: #f87171 !important; border: 1px solid #f87171 !important; }

:deep(.p-button-success.p-button-outlined) { color: #4ade80 !important; border-color: rgba(34, 197, 94, 0.5) !important; background-color: transparent !important; }
:deep(.p-button-success.p-button-outlined:hover) { background-color: rgba(34, 197, 94, 0.1) !important; }
:deep(.p-button-success:not(.p-button-outlined)) { background-color: rgba(34, 197, 94, 0.2) !important; color: #4ade80 !important; border: 1px solid #4ade80 !important; }

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
    color: #16a34a !important; /* Verde Excel para los iconos del menú */
}
</style>

<style>
/* Estilos Globales para Inputs y Selects oscuros se mantienen iguales */
input.input-oscuro, .p-iconfield input, .p-inputtext.input-oscuro, .input-oscuro.p-select { background-color: #121820 !important; color: #ffffff !important; border: 1px solid #4a5568 !important; }
input.input-oscuro:focus, .p-iconfield input:focus, .p-inputtext.input-oscuro:focus, .input-oscuro.p-select:focus, .input-oscuro.p-select-focus { border-color: #5ab1ce !important; box-shadow: 0 0 0 1px #5ab1ce !important; }
input.input-oscuro::placeholder, .p-iconfield input::placeholder, .p-iconfield .p-inputicon { color: #94a3b8 !important; }
.input-oscuro .p-select-label { color: #ffffff !important; }
.menu-oscuro-global { background-color: #1e252d !important; border: 1px solid #4a5568 !important; color: #ffffff !important; }
.menu-oscuro-global .p-select-list { background-color: transparent !important; padding: 0 !important; }
.menu-oscuro-global .p-select-option { color: #cbd5e1 !important; background-color: transparent !important; padding: 0.75rem 1rem !important; }
.menu-oscuro-global .p-select-option:hover, .menu-oscuro-global .p-select-option.p-focus { background-color: #36464d !important; color: #ffffff !important; }
.menu-oscuro-global .p-select-option.p-select-option-selected { background-color: #5ab1ce !important; color: #ffffff !important; }
</style>