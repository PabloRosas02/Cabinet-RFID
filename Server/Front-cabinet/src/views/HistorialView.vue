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

// Cargar datos desde el backend
const cargarHistorial = async () => {
    cargando.value = true;
    try {
        // Obtenemos el usuario activo (priorizamos usuarioActivo que es el de tu login actual)
        const usuarioSesion = JSON.parse(localStorage.getItem('usuarioActivo')) || JSON.parse(localStorage.getItem('usuario'));

        // Pasamos el ID, el Rol y el numTrabajador como parámetros (query) en la URL
        const response = await axios.get('/api/pedidos/historial', {
            params: {
                usuarioId: usuarioSesion?.id,
                rol: usuarioSesion?.rol,
                numTrabajador: usuarioSesion?.numTrabajador // <-- ¡AQUÍ ESTÁ EL CAMBIO CLAVE!
            }
        });
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

// Alternar filtros de estado
const toggleFiltroEstado = (estado) => {
    if (filtroEstado.value === estado) {
        filtroEstado.value = 'Todos'; 
    } else {
        filtroEstado.value = estado;
    }
};

// Lógica combinada para filtrar la tabla (FECHAS CORREGIDAS)
const historialFiltrado = computed(() => {
    let datosFiltrados = historial.value;
    
    if (filtroEstado.value !== 'Todos') {
        datosFiltrados = datosFiltrados.filter(pedido => pedido.estado === filtroEstado.value);
    }

    if (filtroTiempo.value === 'Todos') return datosFiltrados;

    // Se calcula la fecha actual y el inicio de semana UNA SOLA VEZ (fuera del bucle)
    const hoy = new Date();
    
    const inicioSemana = new Date(hoy);
    const diaActual = inicioSemana.getDay(); 
    // Si es domingo (0), restamos 6 días para llegar al lunes. Si no, restamos el día actual menos 1.
    const diff = diaActual === 0 ? 6 : diaActual - 1;
    inicioSemana.setDate(inicioSemana.getDate() - diff);
    inicioSemana.setHours(0, 0, 0, 0); // Inicio del día lunes

    return datosFiltrados.filter(pedido => {
        const fechaPedido = new Date(pedido.fechaPedido);

        switch (filtroTiempo.value) {
            case 'Hoy':
                return fechaPedido.getDate() === hoy.getDate() &&
                       fechaPedido.getMonth() === hoy.getMonth() &&
                       fechaPedido.getFullYear() === hoy.getFullYear();
            case 'Esta Semana':
                return fechaPedido >= inicioSemana;
            case 'Este Mes':
                return fechaPedido.getMonth() === hoy.getMonth() && 
                       fechaPedido.getFullYear() === hoy.getFullYear();
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
// Exportar a Excel (CSV) (FECHAS CORREGIDAS)
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
            const diaSem = copiaHoy.getDay();
            const dif = diaSem === 0 ? 6 : diaSem - 1;
            const primerDia = new Date(copiaHoy.setDate(copiaHoy.getDate() - dif));
            
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
                overlayClass="menu-oscuro-global"
                panelClass="menu-oscuro-global"
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
/* =========================================================
   ESTILOS LOCALES (SOLO PARA ESTE COMPONENTE)
   ========================================================= */
.panel-principal { 
    background-color: #2a323d !important; 
    color: #ffffff; 
    border: 1px solid #4a5568 !important; 
}

/* Recuperamos el color verde de tu botón Exportar */
.btn-exportar {
    background-color: #16a34a !important; 
    border: none !important;
    color: white !important;
    font-weight: bold;
}
.btn-exportar:hover {
    background-color: #15803d !important;
}

/* =========================================================
   BOTONES DE FILTRO (PENDIENTES / DEVUELTOS) - TEMA OSCURO
   ========================================================= */

/* Botón Pendientes (Rojo) - Estado INACTIVO (Outlined) */
:deep(.p-button-danger.p-button-outlined) {
    color: #f87171 !important;
    border-color: rgba(239, 68, 68, 0.5) !important;
    background-color: transparent !important;
}
:deep(.p-button-danger.p-button-outlined:hover) {
    background-color: rgba(239, 68, 68, 0.1) !important;
}
/* Botón Pendientes (Rojo) - Estado ACTIVO (Filled) */
:deep(.p-button-danger:not(.p-button-outlined)) {
    background-color: rgba(239, 68, 68, 0.2) !important;
    color: #f87171 !important;
    border: 1px solid #f87171 !important;
}

/* Botón Devueltos (Verde) - Estado INACTIVO (Outlined) */
:deep(.p-button-success.p-button-outlined) {
    color: #4ade80 !important;
    border-color: rgba(34, 197, 94, 0.5) !important;
    background-color: transparent !important;
}
:deep(.p-button-success.p-button-outlined:hover) {
    background-color: rgba(34, 197, 94, 0.1) !important;
}
/* Botón Devueltos (Verde) - Estado ACTIVO (Filled) */
:deep(.p-button-success:not(.p-button-outlined)) {
    background-color: rgba(34, 197, 94, 0.2) !important;
    color: #4ade80 !important;
    border: 1px solid #4ade80 !important;
}
</style>

<style>
/* =========================================================
   ESTILOS GLOBALES (SIN SCOPED) PARA ATRAPAR EL MENÚ Y BUSCADOR
   ========================================================= */

/* 1. EL BUSCADOR (FUERZA BRUTA AL TAG INPUT) */
input.input-oscuro,
.p-iconfield input,
.p-inputtext.input-oscuro {
    background-color: #121820 !important;
    color: #ffffff !important;
    border: 1px solid #4a5568 !important;
}

input.input-oscuro:focus,
.p-iconfield input:focus,
.p-inputtext.input-oscuro:focus {
    border-color: #5ab1ce !important;
    box-shadow: 0 0 0 1px #5ab1ce !important;
}

/* Ícono de búsqueda y placeholder */
input.input-oscuro::placeholder,
.p-iconfield input::placeholder {
    color: #94a3b8 !important;
}
.p-iconfield .p-inputicon {
    color: #94a3b8 !important;
}

/* 2. LA CAJA DEL SELECT (MENÚ DESPLEGABLE) */
.input-oscuro.p-select {
    background-color: #121820 !important;
    color: #ffffff !important;
    border: 1px solid #4a5568 !important;
}
.input-oscuro.p-select:focus,
.input-oscuro.p-select-focus {
    border-color: #5ab1ce !important;
    box-shadow: 0 0 0 1px #5ab1ce !important;
}
.input-oscuro .p-select-label {
    color: #ffffff !important;
}

/* 3. LA VENTANA FLOTANTE DEL MENÚ (OVERLAY) */
.menu-oscuro-global {
    background-color: #1e252d !important;
    border: 1px solid #4a5568 !important;
    color: #ffffff !important;
}
.menu-oscuro-global .p-select-list {
    background-color: transparent !important;
    padding: 0 !important;
}
.menu-oscuro-global .p-select-option {
    color: #cbd5e1 !important;
    background-color: transparent !important;
    padding: 0.75rem 1rem !important;
}

/* Hover y opción seleccionada en el menú flotante */
.menu-oscuro-global .p-select-option:hover,
.menu-oscuro-global .p-select-option.p-focus {
    background-color: #36464d !important;
    color: #ffffff !important;
}
.menu-oscuro-global .p-select-option.p-select-option-selected {
    background-color: #5ab1ce !important;
    color: #ffffff !important;
}
</style>