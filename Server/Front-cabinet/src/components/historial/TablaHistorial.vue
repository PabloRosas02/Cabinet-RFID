<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Tag from 'primevue/tag';
import Button from 'primevue/button'; 
import { formatearFecha } from '@/utils/dateHelper';
import TablaGenerica from '@/components/TablaGenerica.vue';

const props = defineProps({
    historial: { type: Array, required: true },
    cargando: { type: Boolean, default: false },
    filtros: { type: Object, required: true },
    mensajeVacio: { type: String, default: 'No hay registros en el historial con estos filtros.' },
    iconoVacio: { type: String, default: 'pi-book' } 
});

const emit = defineEmits(['doble-click']);

// =========================================================
// LÓGICA RESPONSIVA DINÁMICA
// =========================================================
const esMovil = ref(window.innerWidth <= 992);

const actualizarVista = () => {
    esMovil.value = window.innerWidth <= 992;
};

onMounted(() => window.addEventListener('resize', actualizarVista));
onUnmounted(() => window.removeEventListener('resize', actualizarVista));

// =====================================================
// DEFINICIÓN DINÁMICA DE COLUMNAS
// =====================================================
const columnasHistorial = computed(() => {
    const cols = [
        { field: 'id', header: 'Folio', width: esMovil.value ? undefined : '8%', minWidth: '100px', slotName: 'folio' },
        { field: 'prestadorNombre', header: 'Prestó (Almacenista)', width: esMovil.value ? undefined : '15%', minWidth: '180px' },
        { header: 'Recibió / Devolución', width: esMovil.value ? undefined : '15%', minWidth: '180px', slotName: 'recibio' },
        { header: 'Solicitó (Empleado)', width: esMovil.value ? undefined : '16%', minWidth: '220px', slotName: 'solicito' },
        { header: 'Fecha Préstamo', width: esMovil.value ? undefined : '12%', minWidth: '160px', slotName: 'fechaPrestamo' },
        { header: 'Fecha Devolución', width: esMovil.value ? undefined : '12%', minWidth: '160px', slotName: 'fechaDevolucion' },
        { header: 'Herramientas', width: esMovil.value ? undefined : '14%', minWidth: '250px', slotName: 'herramientas' },
        { field: 'estado', header: 'Estado', width: esMovil.value ? undefined : '8%', minWidth: '120px', slotName: 'estado' }
    ];

    if (esMovil.value) {
        cols.push({ minWidth: '70px', slotName: 'accionMovil' });
    }

    return cols;
});

const verDetalles = (data) => {
    emit('doble-click', data);
};
</script>

<template>
    <div class="contenedor-historial cursor-pointer">
        <TablaGenerica
            :datos="historial"
            :columnas="columnasHistorial"
            :cargando="cargando"
            :filtros="filtros"
            :globalFilterFields="['trabajadorNombre', 'trabajadorNumero', 'prestadorNombre', 'receptorNombre']"
            llaveMemoria="historial_prestamos"
            dataKey="id"
            :mensajeVacio="mensajeVacio"
            :iconoVacio="iconoVacio"
            @doble-click="verDetalles"
        >
            <template #folio="{ data }">
                <span class="font-bold text-400">#{{ data.id }}</span>
            </template>

            <template #recibio="{ data }">
                <span class="text-blue-400 font-medium">{{ data.receptorNombre || 'Pendiente' }}</span>
            </template>

            <template #solicito="{ data }">
                {{ data.trabajadorNumero }} - {{ data.trabajadorNombre }}
            </template>

            <template #fechaPrestamo="{ data }">
                {{ formatearFecha(data.fechaPedido) }}
            </template>

            <template #fechaDevolucion="{ data }">
                <span :class="{'text-400': !data.fechaDevolucion}">
                    {{ formatearFecha(data.fechaDevolucion) }}
                </span>
            </template>

            <template #herramientas="{ data }">
                <div class="text-sm">
                    <div v-for="(h, idx) in data.herramientas" :key="idx" class="mb-1 text-400">
                        • {{ h.cantidadPrestada }}x {{ h.nombre }} 
                        <span v-if="h.cantidadRegresada > 0" class="text-green-500 block">
                            (Regresó: {{ h.cantidadRegresada }})
                        </span>
                    </div>
                </div>
            </template>

            <template #estado="{ data }">
                <Tag 
                    :severity="data.estado === 'DEVUELTO' ? 'success' : 'danger'" 
                    :value="data.estado" 
                    class="px-3 py-1 font-bold" 
                />
            </template>

            <template #accionMovil="{ data }">
                <Button 
                    icon="pi pi-eye" 
                    class="p-button-rounded p-button-text p-button-info btn-ver" 
                    @click.stop="verDetalles(data)" 
                    aria-label="Ver detalles"
                />
            </template>
        </TablaGenerica>
    </div>
</template>

<style scoped>
.contenedor-historial :deep(.p-datatable-tbody > tr) { cursor: pointer; }
:deep(.p-tag.p-tag-success) { background-color: rgba(34, 197, 94, 0.15) !important; color: #4ade80 !important; }
:deep(.p-tag.p-tag-danger) { background-color: rgba(239, 68, 68, 0.15) !important; color: #f87171 !important; }
:deep(.btn-ver) { color: #38bdf8 !important; background-color: rgba(56, 189, 248, 0.1) !important; width: 2.5rem !important; height: 2.5rem !important; }
:deep(.btn-ver:hover) { background-color: rgba(56, 189, 248, 0.25) !important; }
</style>