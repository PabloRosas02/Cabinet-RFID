<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Button from 'primevue/button';
import { FilterMatchMode } from '@primevue/core/api';

import TablaHistorial from '@/components/historial/TablaHistorial.vue'; 

// ESTADOS REACTIVOS
const historial = ref([]);
const cargando = ref(false);

const filtros = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const opcionesTiempo = ref(['Todos', 'Hoy', 'Esta Semana', 'Este Mes', 'Este Año']);
const filtroTiempo = ref('Todos');
const filtroEstado = ref('Todos'); 

// 1. Cargar datos desde el backend
const cargarHistorial = async () => {
    cargando.value = true;
    try {
        const response = await axios.get('/api/pedidos/historial');
        historial.value = response.data;
    } catch (error) {
        console.error("Error al cargar historial:", error);
    } finally {
        cargando.value = false;
    }
};

onMounted(() => {
    cargarHistorial();
});

// 2. Alternar filtros de estado
const toggleFiltroEstado = (estado) => {
    if (filtroEstado.value === estado) {
        filtroEstado.value = 'Todos'; 
    } else {
        filtroEstado.value = estado;
    }
};

// 3. Lógica combinada para filtrar la tabla
const historialFiltrado = computed(() => {
    let datosFiltrados = historial.value;
    
    if (filtroEstado.value !== 'Todos') {
        datosFiltrados = datosFiltrados.filter(pedido => pedido.estado === filtroEstado.value);
    }

    if (filtroTiempo.value === 'Todos') return datosFiltrados;

    const hoy = new Date();
    return datosFiltrados.filter(pedido => {
        const fechaPedido = new Date(pedido.fechaPedido);

        switch (filtroTiempo.value) {
            case 'Hoy':
                return fechaPedido.toDateString() === hoy.toDateString();
            case 'Esta Semana':
                const primerDiaSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
                return fechaPedido >= primerDiaSemana;
            case 'Este Mes':
                return fechaPedido.getMonth() === hoy.getMonth() && fechaPedido.getFullYear() === hoy.getFullYear();
            case 'Este Año':
                return fechaPedido.getFullYear() === hoy.getFullYear();
            default:
                return true;
        }
    });
});

const formatearFecha = (fechaString) => {
    return new Date(fechaString).toLocaleDateString('es-MX', { 
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
};

// =====================================================================
// 4. Exportar a Excel (CSV)
// =====================================================================
const exportarCSV = () => {
    if (!historialFiltrado.value || historialFiltrado.value.length === 0) {
        alert('No hay datos para exportar con los filtros actuales.');
        return;
    }

    const hoy = new Date();
    const dia = hoy.getDate().toString().padStart(2, '0');
    const mesCorto = hoy.toLocaleString('es-MX', { month: 'short' }).replace('.', ''); 
    const mesLargo = hoy.toLocaleString('es-MX', { month: 'long' }); 
    const anio = hoy.getFullYear();
    
    let sufijoFecha = '';
    
    switch (filtroTiempo.value) {
        case 'Hoy':
        case 'Todos':
            sufijoFecha = `${dia}_${mesCorto}_${anio}`; 
            break;
        case 'Esta Semana':
            const copiaHoy = new Date();
            const primerDia = new Date(copiaHoy.setDate(copiaHoy.getDate() - copiaHoy.getDay()));
            const d = primerDia.getDate().toString().padStart(2, '0');
            const m = primerDia.toLocaleString('es-MX', { month: 'short' }).replace('.', '');
            sufijoFecha = `Semana_del_${d}_${m}_${primerDia.getFullYear()}`;
            break;
        case 'Este Mes':
            sufijoFecha = `${mesLargo}_${anio}`; 
            break;
        case 'Este Año':
            sufijoFecha = `${anio}`; 
            break;
    }

    const nombreArchivo = `Reporte_Inventario_${sufijoFecha}.csv`;
    const cabeceras = ['Folio', 'Autorizó (Prestador)', 'Solicitó (Empleado)', 'Fecha', 'Herramientas', 'Estado'];

    const filas = historialFiltrado.value.map(pedido => {
        const folio = `#${pedido.id}`;
        const autorizo = pedido.prestadorNombre || 'N/A';
        const solicito = `${pedido.trabajadorNumero} - ${pedido.trabajadorNombre}`;
        const fecha = formatearFecha(pedido.fechaPedido);
        const estado = pedido.estado;

        const herramientas = pedido.herramientas.map(h => {
            let texto = `${h.cantidadPrestada}x ${h.nombre}`;
            if (h.cantidadRegresada > 0) texto += ` (Regresó: ${h.cantidadRegresada})`;
            return texto;
        }).join(' | ');

        return [`"${folio}"`, `"${autorizo}"`, `"${solicito}"`, `"${fecha}"`, `"${herramientas}"`, `"${estado}"`].join(',');
    });

    const contenidoCSV = cabeceras.join(',') + '\n' + filas.join('\n');
    const blob = new Blob(["\uFEFF" + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
</script>

<template>
  <div class="panel-principal p-4 border-round-xl shadow-1 mt-4">
    <div class="flex justify-content-between align-items-center mb-4">
        <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">Historial y Reportes</h2>
    </div>

    <!-- Barra de Controles (Botones y Filtros) -->
    <div class="flex flex-column md:flex-row justify-content-between mb-4 gap-3 align-items-start md:align-items-center">
        
        <!-- Izquierda: Exportar y Filtros de Estado -->
        <div class="flex gap-2 flex-wrap">
            <Button 
                label="Exportar CSV" 
                icon="pi pi-file-excel" 
                class="btn-exportar"
                @click="exportarCSV" 
            />
            
            <Button 
                label="Pendientes" 
                icon="pi pi-exclamation-triangle" 
                :outlined="filtroEstado !== 'PENDIENTE'"
                severity="danger" 
                @click="toggleFiltroEstado('PENDIENTE')" 
            />
            <Button 
                label="Devueltos" 
                icon="pi pi-check-circle" 
                :outlined="filtroEstado !== 'DEVUELTO'"
                severity="success" 
                @click="toggleFiltroEstado('DEVUELTO')" 
            />
        </div>

        <!-- Derecha: Búsqueda de texto y Selector de tiempo -->
        <div class="flex flex-column sm:flex-row gap-3 w-full md:w-auto">
            <IconField iconPosition="left" class="w-full sm:w-20rem">
                <InputIcon class="pi pi-search" />
                <InputText 
                    v-model="filtros['global'].value" 
                    placeholder="Buscar por empleado o prestador..." 
                    class="w-full input-oscuro" 
                />
            </IconField>

            <Select 
                v-model="filtroTiempo" 
                :options="opcionesTiempo" 
                placeholder="Filtrar por período" 
                class="w-full sm:w-15rem input-oscuro" 
            />
        </div>
    </div>

    <!-- INYECTAMOS LA TABLA -->
    <TablaHistorial 
        :historial="historialFiltrado" 
        :cargando="cargando"
        :filtros="filtros"
    />
  </div>
</template>

<style scoped>
/* Contenedor Principal */
.panel-principal { background-color: #2a323d !important; color: #ffffff; }

/* Inputs Oscuros */
:deep(.input-oscuro .p-inputtext), :deep(.input-oscuro.p-select) {
    background-color: #121820 !important;
    color: #ffffff !important;
    border: 1px solid #4a5568 !important;
}

/* Botón Exportar Personalizado */
.btn-exportar {
    background-color: #16a34a !important; 
    border: none !important;
    color: white !important;
    font-weight: bold;
}
.btn-exportar:hover {
    background-color: #15803d !important;
}
</style>