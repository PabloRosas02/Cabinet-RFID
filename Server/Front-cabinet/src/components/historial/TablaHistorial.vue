<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Tag from 'primevue/tag';
import Button from 'primevue/button'; 
import { formatearFecha } from '@/utils/dateHelper';
import TablaGenerica from '@/components/TablaGenerica.vue';
import { useI18n } from 'vue-i18n'; 
const { t, locale } = useI18n(); 

const props = defineProps({
    historial: { type: Array, required: true },
    cargando: { type: Boolean, default: false },
    filtros: { type: Object, required: true },
    mensajeVacio: { type: String, default: null }, 
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
        { field: 'id', header: t('tabla_historial.folio'), width: esMovil.value ? undefined : '8%', minWidth: '100px', slotName: 'folio' },
        { field: 'prestadorNombre', header: t('tabla_historial.presto'), width: esMovil.value ? undefined : '15%', minWidth: '180px' },
        { header: t('tabla_historial.recibio'), width: esMovil.value ? undefined : '15%', minWidth: '180px', slotName: 'recibio' },
        { header: t('tabla_historial.solicito'), width: esMovil.value ? undefined : '16%', minWidth: '220px', slotName: 'solicito' },
        { header: t('tabla_historial.fecha_prestamo'), width: esMovil.value ? undefined : '12%', minWidth: '160px', slotName: 'fechaPrestamo' },
        { header: t('tabla_historial.fecha_devolucion'), width: esMovil.value ? undefined : '12%', minWidth: '160px', slotName: 'fechaDevolucion' },
        { header: t('tabla_historial.herramientas'), width: esMovil.value ? undefined : '14%', minWidth: '250px', slotName: 'herramientas' },
        { field: 'estado', header: t('tabla_historial.estado'), width: esMovil.value ? undefined : '8%', minWidth: '120px', slotName: 'estado' }
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
            :mensajeVacio="mensajeVacio || t('tabla_historial.mensaje_vacio')"
            :iconoVacio="iconoVacio"
            @doble-click="verDetalles"
        >
            <template #folio="{ data }">
                <span class="font-bold text-400">#{{ data.id }}</span>
            </template>

            <!-- INTERCEPTAMOS EL TEXTO "Pendiente / En curso" -->
            <template #recibio="{ data }">
                <span class="text-blue-400 font-medium">
                    {{ 
                        data.receptorNombre === 'Pendiente / En curso' 
                        ? t('tabla_historial.pendiente_curso') 
                        : (data.receptorNombre || t('tabla_historial.pendiente_curso')) 
                    }}
                </span>
            </template>

            <template #solicito="{ data }">
                {{ data.trabajadorNumero }} - {{ data.trabajadorNombre }}
            </template>

            <!-- 2. Pasamos 'locale' al formatear la fecha de préstamo -->
            <template #fechaPrestamo="{ data }">
                {{ formatearFecha(data.fechaPedido, locale) }}
            </template>

            <!-- INTERCEPTAMOS LA FECHA CUANDO DICE "Pendiente" y pasamos 'locale' -->
            <template #fechaDevolucion="{ data }">
                <span :class="{'text-400': !data.fechaDevolucion || formatearFecha(data.fechaDevolucion, locale).includes('Pendiente')}">
                    {{ 
                        (!data.fechaDevolucion || formatearFecha(data.fechaDevolucion, locale).includes('Pendiente')) 
                        ? t('tabla_historial.pendiente_fecha') 
                        : formatearFecha(data.fechaDevolucion, locale) 
                    }}
                </span>
            </template>

            <template #herramientas="{ data }">
                <div class="text-sm">
                    <div v-for="(h, idx) in data.herramientas" :key="idx" class="mb-1 text-400">
                        • {{ h.cantidadPrestada }}x {{ h.nombre }} 
                        <span v-if="h.cantidadRegresada > 0" class="text-green-500 block">
                            ({{ t('tabla_historial.regreso') }} {{ h.cantidadRegresada }})
                        </span>
                    </div>
                </div>
            </template>

            <!-- INTERCEPTAMOS EL ESTADO DE LA BD -->
            <template #estado="{ data }">
                <Tag 
                    :severity="data.estado === 'DEVUELTO' ? 'success' : 'danger'" 
                    :value="data.estado === 'DEVUELTO' ? t('tabla_historial.estado_devuelto') : t('tabla_historial.estado_pendiente')" 
                    class="px-3 py-1 font-bold" 
                />
            </template>

            <template #accionMovil="{ data }">
                <Button 
                    icon="pi pi-eye" 
                    class="p-button-rounded p-button-text p-button-info btn-ver" 
                    @click.stop="verDetalles(data)" 
                    :aria-label="t('tabla_historial.aria_ver_detalles')"
                />
            </template>
        </TablaGenerica>
    </div>
</template>

<style scoped>
.contenedor-historial :deep(.p-datatable-tbody > tr) { 
    cursor: pointer; 
}
</style>