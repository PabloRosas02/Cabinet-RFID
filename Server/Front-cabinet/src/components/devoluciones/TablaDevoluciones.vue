<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'; 
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Chip from 'primevue/chip';
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
// BÚSQUEDA Y CATEGORÍAS (CHIPS)
// =========================================================
const busquedaTexto = ref('');
const filtros = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const categoriasDisponibles = computed(() => [
    { key: 'id', label: t('tabla_devoluciones.folio_salida', 'Folio') },
    { key: 'numeroOrden', label: t('tabla_devoluciones.num_orden', 'Orden') },
    { key: 'numeroMaquina', label: t('tabla_devoluciones.num_maquina', 'Máquina') },
    { key: 'solicitante', label: t('tabla_devoluciones.solicitante', 'Solicitante'), fields: ['trabajadorNumero', 'trabajadorNombre'] },
    { key: 'motivo', label: t('tabla_devoluciones.motivo', 'Motivo'), fields: ['motivo', 'motivoOtro'] }
]);

const categoriasSeleccionadas = ref(['id', 'numeroOrden', 'numeroMaquina', 'solicitante', 'motivo']);

const toggleCategoria = (key) => {
    const index = categoriasSeleccionadas.value.indexOf(key);
    if (index > -1) {
        if (categoriasSeleccionadas.value.length > 1) {
            categoriasSeleccionadas.value.splice(index, 1);
        }
    } else {
        categoriasSeleccionadas.value.push(key);
    }
};

const camposGlobalesFiltro = computed(() => {
    const campos = [];
    categoriasDisponibles.value.forEach(cat => {
        if (categoriasSeleccionadas.value.includes(cat.key)) {
            if (cat.fields) {
                campos.push(...cat.fields);
            } else {
                campos.push(cat.key);
            }
        }
    });
    return campos;
});

const placeholderDinamico = computed(() => {
    if (categoriasSeleccionadas.value.length === categoriasDisponibles.value.length) {
        return t('tabla_devoluciones.ph_buscar_todos', 'Buscar por folio, orden, máquina, solicitante o motivo...');
    }
    const nombres = categoriasDisponibles.value
        .filter(c => categoriasSeleccionadas.value.includes(c.key))
        .map(c => c.label.toLowerCase())
        .join(', ');
    return `${t('tabla_devoluciones.buscar_en', 'Buscar por')} ${nombres}...`;
});

watch(busquedaTexto, (nuevoTexto) => {
    if (filtros.value && filtros.value.global) {
        filtros.value.global.value = nuevoTexto;
    }
});

// =========================================================
// RESPONSIVIDAD Y COLUMNAS
// =========================================================
const esMovil = ref(window.innerWidth <= 992);

const actualizarVista = () => {
    esMovil.value = window.innerWidth <= 992;
};

onMounted(() => window.addEventListener('resize', actualizarVista));
onUnmounted(() => window.removeEventListener('resize', actualizarVista));

const columnasSalidas = computed(() => [
    { field: 'id', header: t('tabla_devoluciones.folio_salida'), width: esMovil.value ? undefined : '8%', minWidth: '90px', slotName: 'folio' },
    { field: 'numeroOrden', header: t('tabla_devoluciones.num_orden'), width: esMovil.value ? undefined : '10%', minWidth: '110px' },
    { field: 'numeroMaquina', header: t('tabla_devoluciones.num_maquina'), width: esMovil.value ? undefined : '10%', minWidth: '110px' },
    { header: t('tabla_devoluciones.solicitante', 'Solicitante'), width: esMovil.value ? undefined : '22%', minWidth: '220px', slotName: 'solicitante' },
    { field: 'motivo', header: t('tabla_devoluciones.motivo', 'Motivo'), width: esMovil.value ? undefined : '14%', minWidth: '150px', slotName: 'motivo' },
    { field: 'fechaSalida', header: t('tabla_devoluciones.fecha_salida'), width: esMovil.value ? undefined : '12%', minWidth: '140px', slotName: 'fecha' },
    { header: t('tabla_devoluciones.estado'), width: esMovil.value ? undefined : '10%', minWidth: '120px', slotName: 'estado' },
    { header: t('tabla_devoluciones.accion'), width: esMovil.value ? undefined : '10%', minWidth: '120px', slotName: 'accion' }
]);

// =========================================================
// CALCULADOR DE ESTADO PARCIAL VS PENDIENTE
// =========================================================
const obtenerInfoEstado = (data) => {
    if (!data || !data.herramientas) {
        return { texto: t('tabla_devoluciones.estado_pendiente', 'Pendiente'), color: 'bg-red-500', severity: 'danger' };
    }
    
    let totalReutilizablesPrestadas = 0;
    let totalReutilizablesRegresadas = 0;
    
    data.herramientas.forEach(h => {
        if (!h.esDesechable) {
            totalReutilizablesPrestadas += h.cantidadPrestada;
            totalReutilizablesRegresadas += (h.cantidadRegresada || 0);
        }
    });

    if (totalReutilizablesPrestadas === 0 || totalReutilizablesRegresadas === 0) {
        return { 
            texto: t('tabla_devoluciones.estado_pendiente', 'Pendiente'), 
            color: 'bg-red-500', 
            severity: 'danger' 
        };
    }

    if (totalReutilizablesRegresadas < totalReutilizablesPrestadas) {
        const textoParcial = t('tabla_devoluciones.estado_parcial', 'Parcial');
        return { 
            texto: `${textoParcial} (${totalReutilizablesRegresadas}/${totalReutilizablesPrestadas})`, 
            color: 'bg-orange-500', 
            severity: 'warning' 
        };
    }

    return { 
        texto: t('tabla_devoluciones.estado_pendiente', 'Pendiente'), 
        color: 'bg-red-500', 
        severity: 'danger' 
    };
};
</script>

<template>
    <div class="tabla-salidas-container">
        
        <!-- Contenedor oscuro con padding idéntico a HistorialView -->
        <div class="flex flex-column gap-3 mb-4 p-3 toolbar-oscuro border-round">
            
            <!-- Fila de Chips -->
            <div class="flex flex-wrap align-items-center gap-2">
                <span class="text-sm font-bold text-400 mr-2">{{ t('tabla_devoluciones.buscar_en_label', 'Buscar en') }}:</span>
                <Chip 
                    v-for="cat in categoriasDisponibles" 
                    :key="cat.key"
                    :label="cat.label"
                    :class="['chip-categoria cursor-pointer', { 'active': categoriasSeleccionadas.includes(cat.key) }]"
                    @click="toggleCategoria(cat.key)"
                />
            </div>

            <!-- Input de búsqueda con la misma clase que Historial -->
            <IconField iconPosition="left" class="w-full">
                <InputIcon class="pi pi-search" />
                <InputText 
                    id="buscadorDevoluciones"
                    name="buscadorDevoluciones"
                    :aria-label="t('tabla_devoluciones.buscar_placeholder')"
                    v-model="busquedaTexto" 
                    :placeholder="placeholderDinamico" 
                    class="input-oscuro w-full input-buscador-grande" 
                    autocomplete="off"
                />
            </IconField>
        </div>

        <TablaGenerica
            :datos="salidas"
            :columnas="columnasSalidas"
            :cargando="cargando"
            :filtros="filtros"
            :globalFilterFields="camposGlobalesFiltro"
            llaveMemoria="salidas_pendientes"
            dataKey="id"
            iconoVacio="pi-undo"
            :mensajeVacio="t('tabla_devoluciones.mensaje_vacio')"
        >
            <template #folio="{ data }">
                <span class="font-bold text-400">#{{ data.id }}</span>
            </template>

            <template #solicitante="{ data }">
                <span class="font-medium">
                    {{ data.trabajadorNumero }} - {{ data.trabajadorNombre }}
                </span>
            </template>

            <template #motivo="{ data }">
                <span>
                    {{ obtenerMotivoTraducido(data.motivo, data.motivoOtro) }}
                </span>
            </template>

            <template #fecha="{ data }">
                {{ formatearFecha(data.fechaSalida, locale) }}
            </template>

            <template #estado="{ data }">
                <Tag 
                    :severity="obtenerInfoEstado(data).severity" 
                    :value="obtenerInfoEstado(data).texto" 
                    class="px-3 py-1 text-white font-bold" 
                    :class="obtenerInfoEstado(data).color"
                    style="border-radius: 4px;" 
                />
            </template>

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
/* Altura y padding idéntico al buscador de Historial */
.input-buscador-grande {
    font-size: 1.05rem;
    padding: 0.75rem 1rem 0.75rem 2.5rem !important;
}

/* Estilos de los Chips exactamente iguales a Historial */
.chip-categoria {
    background-color: #1e293b;
    color: #94a3b8;
    border: 1px solid #334155;
    transition: all 0.2s ease;
    user-select: none;
    padding: 0.5rem 0.85rem !important;
    font-size: 0.95rem;
}

.chip-categoria:hover {
    border-color: #5ab1ce;
    color: #e2e8f0;
}

.chip-categoria.active {
    background-color: #0284c7;
    color: #ffffff;
    border-color: #38bdf8;
    font-weight: 600;
}

.btn-accion-devolver { 
    background-color: #3b82f6 !important; 
    border: none !important; 
    font-weight: bold; 
}

.btn-accion-devolver:hover { 
    background-color: #2563eb !important; 
}
</style>