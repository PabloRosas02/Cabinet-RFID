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

// Extraemos tanto la función de traducción (t) como el idioma actual (locale)
const { t, locale } = useI18n();

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
// DEFINICIÓN DINÁMICA DE COLUMNAS (Reactivas al tamaño de pantalla e idioma)
// =====================================================
const columnasSalidas = computed(() => [
    { field: 'id', header: t('tabla_devoluciones.folio_salida'), width: esMovil.value ? undefined : '8%', minWidth: '100px', slotName: 'folio' },
    
    { field: 'numeroOrden', header: t('tabla_devoluciones.num_orden'), width: esMovil.value ? undefined : '12%', minWidth: '120px' },
    { field: 'numeroMaquina', header: t('tabla_devoluciones.num_maquina'), width: esMovil.value ? undefined : '12%', minWidth: '120px' },
    
    { field: 'trabajadorNumero', header: t('tabla_devoluciones.no_empleado'), width: esMovil.value ? undefined : '12%', minWidth: '130px' },
    { field: 'trabajadorNombre', header: t('tabla_devoluciones.nombre_trabajador'), width: esMovil.value ? undefined : '20%', minWidth: '200px' },
    
    { field: 'fechaSalida', header: t('tabla_devoluciones.fecha_salida'), width: esMovil.value ? undefined : '16%', minWidth: '160px', slotName: 'fecha' },
    
    { header: t('tabla_devoluciones.estado'), width: esMovil.value ? undefined : '10%', minWidth: '120px', slotName: 'estado' },
    { header: t('tabla_devoluciones.accion'), width: esMovil.value ? undefined : '10%', minWidth: '140px', slotName: 'accion' }
]);

const filtros = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
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
            :globalFilterFields="['id', 'numeroOrden', 'numeroMaquina', 'trabajadorNumero', 'trabajadorNombre']"
            llaveMemoria="salidas_pendientes"
            dataKey="id"
            iconoVacio="pi-undo"
            :mensajeVacio="t('tabla_devoluciones.mensaje_vacio')"
        >
            <!-- Slot Personalizado: Folio -->
            <template #folio="{ data }">
                <span class="font-bold text-400">#{{ data.id }}</span>
            </template>

            <template #fecha="{ data }">
                {{ formatearFecha(data.fechaSalida, locale) }}
            </template>

            <!-- Slot Personalizado: Estado -->
            <template #estado>
                <Tag severity="danger" :value="t('tabla_devoluciones.estado_pendiente')" class="px-3 py-1 bg-red-500 text-white font-bold" style="border-radius: 4px;" />
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