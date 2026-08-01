<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'; 
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import { FilterMatchMode } from '@primevue/core/api';
import TablaGenerica from '@/components/TablaGenerica.vue';

defineProps({
    pedidos: {
        type: Array,
        required: true
    },
    cargando: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['revisar']);

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
// DEFINICIÓN DINÁMICA DE COLUMNAS (Reactivas al tamaño de pantalla)
// =====================================================
const columnasPedidos = computed(() => [
    { field: 'id', header: 'Folio Pedido', width: esMovil.value ? undefined : '15%', minWidth: '120px', slotName: 'folio' },
    { field: 'trabajadorNumero', header: 'No. Empleado', width: esMovil.value ? undefined : '15%', minWidth: '140px' },
    { field: 'trabajadorNombre', header: 'Nombre del Trabajador', width: esMovil.value ? undefined : '30%', minWidth: '220px' },
    { field: 'fechaPedido', header: 'Fecha de Préstamo', width: esMovil.value ? undefined : '20%', minWidth: '160px', slotName: 'fecha' },
    { header: 'Estado', width: esMovil.value ? undefined : '10%', minWidth: '120px', slotName: 'estado' },
    { header: 'Acción', width: esMovil.value ? undefined : '10%', minWidth: '140px', slotName: 'accion' }
]);

const filtros = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const formatearFecha = (fechaString) => {
    if (!fechaString) return 'N/A';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-MX', { 
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
};
</script>

<template>
    <div class="tabla-pedidos-container">
        
        <div class="flex justify-content-start mb-3">
            <IconField iconPosition="left" class="w-full sm:w-30rem">
                <InputIcon class="pi pi-search" />
                <InputText 
                    id="buscadorDevoluciones"
                    name="buscadorDevoluciones"
                    aria-label="Buscar por folio o empleado"
                    v-model="filtros['global'].value" 
                    placeholder="Buscar por folio o empleado..." 
                    class="w-full input-oscuro" 
                    autocomplete="off"
                />
            </IconField>
        </div>

        <TablaGenerica
            :datos="pedidos"
            :columnas="columnasPedidos"
            :cargando="cargando"
            :filtros="filtros"
            :globalFilterFields="['id', 'trabajadorNumero', 'trabajadorNombre']"
            llaveMemoria="pedidos_pendientes"
            dataKey="id"
            iconoVacio="pi-undo"
            mensajeVacio="No hay devoluciones pendientes en este momento."
        >
            <!-- Slot Personalizado: Folio -->
            <template #folio="{ data }">
                <span class="font-bold text-400">#{{ data.id }}</span>
            </template>

            <!-- Slot Personalizado: Fecha -->
            <template #fecha="{ data }">
                {{ formatearFecha(data.fechaPedido) }}
            </template>

            <!-- Slot Personalizado: Estado -->
            <template #estado>
                <Tag severity="danger" value="Pendiente" class="px-3 py-1 bg-red-500 text-white font-bold" style="border-radius: 4px;" />
            </template>

            <!-- Slot Personalizado: Acción -->
            <template #accion="{ data }">
                <Button 
                    icon="pi pi-replay" 
                    label="Devolver" 
                    class="btn-accion-devolver p-button-sm w-full sm:w-auto" 
                    @click="emit('revisar', data)" 
                />
            </template>
        </TablaGenerica>

    </div>
</template>

<style scoped>
.btn-accion-devolver { 
    background-color: #3b82f6 !important; 
    border: none !important; 
    font-weight: bold; 
}
.btn-accion-devolver:hover { 
    background-color: #2563eb !important; 
}
</style>