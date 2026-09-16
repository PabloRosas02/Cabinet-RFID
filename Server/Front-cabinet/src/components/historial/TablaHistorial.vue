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
    globalFilterFields: { type: Array, default: () => [] },
    llaveMemoria: { type: String, default: 'historial_salidas' },
    iconoVacio: { type: String, default: 'pi-book' } 
});

const emit = defineEmits(['doble-click']);

// =========================================================
// NORMALIZACIÓN DE DATOS (Backend snake_case -> Frontend camelCase)
// =========================================================
const historialNormalizado = computed(() => {
    return props.historial.map(pedido => {
        const herramientas = (pedido.herramientas || []).map(h => ({
            ...h,
            cantidadPrestada: h.pivot?.cantidad ?? h.cantidadPrestada ?? 0,
            cantidadRegresada: h.pivot?.cantidad_devuelta ?? h.cantidadRegresada ?? 0,
            esDesechable: h.esDesechable ?? h.es_desechable ?? false
        }));

        const esSoloConsumible = herramientas.length > 0 && herramientas.every(h => h.esDesechable);

        return {
            ...pedido,
            numeroOrden: pedido.numeroOrden || pedido.numero_orden,
            numeroMaquina: pedido.numeroMaquina || pedido.numero_maquina,
            
            // Extraer prestadorNumero directamente de la relación si no existe en la raíz
            prestadorNumero: pedido.prestadorNumero || pedido.prestador?.numeroTrabajador || pedido.prestador?.numeroEmpleado || pedido.prestador?.numero,
            prestadorNombre: pedido.prestadorNombre || pedido.prestador?.nombre,
            
            // Recibió 
            receptorNumero: pedido.receptorNumero || pedido.receptor?.numeroTrabajador || pedido.receptor?.numero,
            receptorNombre: pedido.receptorNombre || pedido.receptor?.nombre,
            
            // Solicitó
            trabajadorNumero: pedido.trabajadorNumero || pedido.empleado_numero,
            trabajadorNombre: pedido.trabajadorNombre || pedido.empleado_nombre,

            fechaSalida: pedido.fechaSalida || pedido.created_at,
            fechaDevolucion: pedido.fechaDevolucion || pedido.fecha_devolucion,
            herramientas,
            esSoloConsumible
                };
    });
});

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
// FUNCIONES DE AYUDA (Para limpiar el template)
// =====================================================
const obtenerNombreReceptor = (data) => {
    if (data.esSoloConsumible) return 'N/A';
    if (!data.receptorNombre || data.receptorNombre === 'Pendiente / En curso') {
        return t('tabla_historial.pendiente_curso');
    }
    return data.receptorNumero ? `${data.receptorNumero} - ${data.receptorNombre}` : data.receptorNombre;
};

const esFechaPendiente = (data) => {
    if (!data.fechaDevolucion) return true;
    return formatearFecha(data.fechaDevolucion, locale.value).includes('Pendiente');
};

const obtenerFechaDevolucion = (data) => {
    if (data.esSoloConsumible) return 'N/A';
    if (esFechaPendiente(data)) return t('tabla_historial.pendiente_fecha');
    return formatearFecha(data.fechaDevolucion, locale.value);
};

const obtenerSeveridadEstado = (estado) => {
    if (estado === 'CONSUMIDO') return 'info';
    return estado === 'DEVUELTO' ? 'success' : 'danger';
};
const obtenerTextoEstado = (estado) => {
    if (estado === 'CONSUMIDO') {
        return t('tabla_historial.estado_consumido'); 
    }
    return estado === 'DEVUELTO' ? t('tabla_historial.estado_devuelto') : t('tabla_historial.estado_pendiente');
};
// =====================================================
// DEFINICIÓN DINÁMICA DE COLUMNAS
// =====================================================
const columnasHistorial = computed(() => {
    const cols = [
        { field: 'id', header: t('tabla_historial.folio'), width: esMovil.value ? undefined : '6%', minWidth: '80px', slotName: 'folio' },
        { field: 'numeroOrden', header: t('tabla_historial.num_orden'), width: esMovil.value ? undefined : '10%', minWidth: '120px' },
        { field: 'numeroMaquina', header: t('tabla_historial.num_maquina'), width: esMovil.value ? undefined : '10%', minWidth: '120px' },
        
        { header: t('tabla_historial.presto'), width: esMovil.value ? undefined : '12%', minWidth: '160px', slotName: 'presto' },
        { header: t('tabla_historial.recibio'), width: esMovil.value ? undefined : '12%', minWidth: '160px', slotName: 'recibio' },
        { header: t('tabla_historial.solicito'), width: esMovil.value ? undefined : '14%', minWidth: '200px', slotName: 'solicito' },
        
        { header: t('tabla_historial.fecha_salida'), width: esMovil.value ? undefined : '12%', minWidth: '160px', slotName: 'fechaSalida' },
        { header: t('tabla_historial.fecha_devolucion'), width: esMovil.value ? undefined : '12%', minWidth: '160px', slotName: 'fechaDevolucion' },
        { header: t('tabla_historial.herramientas'), width: esMovil.value ? undefined : '16%', minWidth: '250px', slotName: 'herramientas' },
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
    <div class="contenedor-historial cursor-pointer block max-w-full overflow-x-auto">
        
        <TablaGenerica
            :datos="historialNormalizado"
            :columnas="columnasHistorial"
            :cargando="cargando"
            :filtros="filtros"
            :globalFilterFields="globalFilterFields"
            :llaveMemoria="llaveMemoria" 
            dataKey="id"
            :mensajeVacio="mensajeVacio || t('tabla_historial.mensaje_vacio')"
            :iconoVacio="iconoVacio"
            @doble-click="verDetalles"
        >
            <template #folio="{ data }">
                <span class="font-bold text-400">#{{ data.id }}</span>
            </template>

            <!-- Slot Prestó -->
            <template #presto="{ data }">
                <span v-if="data.prestadorNombre">
                    {{ data.prestadorNumero ? `${data.prestadorNumero} - ${data.prestadorNombre}` : data.prestadorNombre }}
                </span>
            </template>

            <!-- Receptor simplificado -->
            <template #recibio="{ data }">
                <span class="text-blue-400 font-medium">
                    {{ obtenerNombreReceptor(data) }}
                </span>
            </template>

            <template #solicito="{ data }">
                {{ data.trabajadorNumero }} - {{ data.trabajadorNombre }}
            </template>

            <template #fechaSalida="{ data }">
                {{ formatearFecha(data.fechaSalida, locale) }}
            </template>

            <!-- Fecha de devolución simplificada -->
            <template #fechaDevolucion="{ data }">
                <span :class="{'text-400': esFechaPendiente(data)}">
                    {{ obtenerFechaDevolucion(data) }}
                </span>
            </template>

            <template #herramientas="{ data }">
                <div class="text-sm">
                    <div v-for="(h, idx) in data.herramientas" :key="idx" class="mb-1 text-400">
                        • {{ h.cantidadPrestada }}x {{ h.nombre }} 
                        
                        <!-- Solo mostrar "Regresó" si NO es consumible/desechable -->
                        <span v-if="!h.esDesechable && h.cantidadRegresada > 0" class="text-green-500 block">
                            ({{ t('tabla_historial.regreso') }} {{ h.cantidadRegresada }})
                        </span>
                    </div>
                </div>
            </template>

            <!-- Estado simplificado -->
            <template #estado="{ data }">
                <Tag 
                    :severity="obtenerSeveridadEstado(data.estado)" 
                    :value="obtenerTextoEstado(data.estado)" 
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