<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'; 
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import { FilterMatchMode } from '@primevue/core/api';
import TablaGenerica from '@/components/TablaGenerica.vue';
import { useI18n } from 'vue-i18n';
import { formatearFecha } from '@/utils/dateHelper';
import { useMotivoTraductor } from '@/utils/formatters';

const props = defineProps({
    salidas: {
        type: Array,
        required: true
    },
    cargando: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['revisar']);
const { t, locale } = useI18n();
const { obtenerMotivoTraducido } = useMotivoTraductor();

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
const columnasSalidas = computed(() => [
    { field: 'id', header: t('tabla_devoluciones.folio_salida'), width: esMovil.value ? undefined : '8%', minWidth: '90px', slotName: 'folio' },
    { field: 'numeroOrden', header: t('tabla_devoluciones.num_orden'), width: esMovil.value ? undefined : '10%', minWidth: '110px' },
    { field: 'numeroMaquina', header: t('tabla_devoluciones.num_maquina'), width: esMovil.value ? undefined : '10%', minWidth: '110px' },
    { field: 'trabajadorNumero', header: t('tabla_devoluciones.no_empleado'), width: esMovil.value ? undefined : '12%', minWidth: '120px' },
    { field: 'trabajadorNombre', header: t('tabla_devoluciones.nombre_trabajador'), width: esMovil.value ? undefined : '16%', minWidth: '180px' },
    { field: 'motivo', header: t('tabla_devoluciones.motivo', 'Motivo'), width: esMovil.value ? undefined : '14%', minWidth: '150px', slotName: 'motivo' },
    { field: 'fechaSalida', header: t('tabla_devoluciones.fecha_salida'), width: esMovil.value ? undefined : '12%', minWidth: '140px', slotName: 'fecha' },
    { header: t('tabla_devoluciones.estado'), width: esMovil.value ? undefined : '10%', minWidth: '120px', slotName: 'estado' },
    { header: t('tabla_devoluciones.accion'), width: esMovil.value ? undefined : '10%', minWidth: '120px', slotName: 'accion' }
]);

const filtros = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// =========================================================
// CALCULADOR DE ESTADO PARCIAL VS PENDIENTE TRADUCIDO
// =========================================================
const obtenerInfoEstado = (data) => {
    if (!data || !data.herramientas) {
        return { texto: t('tabla_devoluciones.estado_pendiente', 'Pending'), color: 'bg-red-500', severity: 'danger' };
    }
    
    let totalPrestadas = 0;
    let totalRegresadas = 0;
    
    data.herramientas.forEach(h => {
        totalPrestadas += h.cantidadPrestada;
        totalRegresadas += (h.cantidadRegresada || 0);
    });

    if (totalRegresadas > 0 && totalRegresadas < totalPrestadas) {
        // Traducción dinámica según el idioma activo
        const textoParcial = t('tabla_devoluciones.estado_parcial', 'Partial');
        return { 
            texto: `${textoParcial} (${totalRegresadas}/${totalPrestadas})`, 
            color: 'bg-orange-500', 
            severity: 'warning' 
        };
    }

    return { 
        texto: t('tabla_devoluciones.estado_pendiente', 'Pending'), 
        color: 'bg-red-500', 
        severity: 'danger' 
    };
};
</script>

<template>
    <div class="tabla-salidas-container">
        
        <div class="flex justify-content-start mb-3">
            <IconField iconPosition="left" class="w-full sm:w-30rem">
                <InputIcon class="pi pi-search" />
                <InputText 
                    id="buscadorDevoluciones"
                    name="buscadorDevoluciones"
                    :aria-label="t('tabla_devoluciones.buscar_placeholder')"
                    v-model="filtros['global'].value" 
                    :placeholder="t('tabla_devoluciones.buscar_placeholder')" 
                    class="w-full input-oscuro" 
                    autocomplete="off"
                />
            </IconField>
        </div>

        <TablaGenerica
            :datos="salidas"
            :columnas="columnasSalidas"
            :cargando="cargando"
            :filtros="filtros"
            :globalFilterFields="['id', 'numeroOrden', 'numeroMaquina', 'trabajadorNumero', 'trabajadorNombre', 'motivo', 'motivoOtro']"
            llaveMemoria="salidas_pendientes"
            dataKey="id"
            iconoVacio="pi-undo"
            :mensajeVacio="t('tabla_devoluciones.mensaje_vacio')"
        >
            <!-- Slot Personalizado: Folio -->
            <template #folio="{ data }">
                <span class="font-bold text-400">#{{ data.id }}</span>
            </template>

            <!-- Slot Personalizado: Motivo Dinámico reutilizando formatters.js -->
            <template #motivo="{ data }">
                <span>
                    {{ obtenerMotivoTraducido(data.motivo, data.motivoOtro) }}
                </span>
            </template>

            <template #fecha="{ data }">
                {{ formatearFecha(data.fechaSalida, locale) }}
            </template>

            <!-- Slot Personalizado: Estado Dinámico -->
            <template #estado="{ data }">
                <Tag 
                    :severity="obtenerInfoEstado(data).severity" 
                    :value="obtenerInfoEstado(data).texto" 
                    class="px-3 py-1 text-white font-bold" 
                    :class="obtenerInfoEstado(data).color"
                    style="border-radius: 4px;" 
                />
            </template>

            <!-- Slot Personalizado: Acción -->
            <template #accion="{ data }">
                <Button 
                    icon="pi pi-replay" 
                    :label="t('tabla_devoluciones.btn_devolver')" 
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