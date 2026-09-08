<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'; 
import { useRouter } from 'vue-router'; 
import { useI18n } from 'vue-i18n'; 

// PrimeVue Core & Hooks
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';

// PrimeVue Components
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Toast from 'primevue/toast';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import Chip from 'primevue/chip';

// Composables & Components
import { useHerramientas } from '@/composables/useHerramientas';
import TablaHerramientas from '@/components/herramientas/TablaHerramientas.vue';
import FormularioHerramienta from '@/components/herramientas/FormularioHerramientas.vue';
import ModalDetalleHerramienta from '@/components/ModalDetalleHerramienta.vue';

const router = useRouter(); 
const { t } = useI18n(); 
const toast = useToast();

const { 
    herramientas, cargando, totalRegistros, paginaActual, mostrarModal, herramientaActual, 
    prepararEdicion, guardarHerramienta, eliminarHerramienta, cargarHerramientas
} = useHerramientas();

const herramientaSeleccionada = ref<any | null>(null);

// Estados de Búsqueda y Filtros
const busquedaTexto = ref('');
const sortFieldActual = ref('id');
const sortOrderActual = ref('ASC');

const categoriasDisponibles = computed(() => [
    { key: 'codigo', label: t('view_inventario.categorias.codigo') },
    { key: 'nombre', label: t('view_inventario.categorias.nombre') },
    { key: 'tipo', label: t('view_inventario.categorias.tipo') },
    { key: 'ubicacion', label: t('view_inventario.categorias.ubicacion') }
]);

const categoriasSeleccionadas = ref(['codigo', 'nombre', 'tipo', 'ubicacion']);

const toggleCategoria = (key: string) => {
    const idx = categoriasSeleccionadas.value.indexOf(key);
    if (idx > -1) {
        if (categoriasSeleccionadas.value.length > 1) {
            categoriasSeleccionadas.value.splice(idx, 1);
        }
    } else {
        categoriasSeleccionadas.value.push(key);
    }
};

const placeholderDinamico = computed(() => {
    if (categoriasSeleccionadas.value.length === categoriasDisponibles.value.length) {
        return t('view_inventario.ph_buscar');
    }
    const nombres = categoriasDisponibles.value
        .filter(c => categoriasSeleccionadas.value.includes(c.key))
        .map(c => c.label.toLowerCase())
        .join(', ');
    return `${t('view_inventario.buscar_en')} ${nombres}...`;
});

const filtros = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const mostrarModalDetalles = ref(false);
const herramientaViendo = ref<any | null>(null);

// Variables para el Modal de Baja
const mostrarModalBaja = ref(false);
const motivoBaja = ref<string | null>(null);
const motivoOtro = ref('');

const opcionesMotivos = computed(() => [
    { label: t('view_movimientos.motivos.end_of_life'), value: 'Fin de vida útil' },
    { label: t('view_movimientos.motivos.operator_damage'), value: 'Daño por operador' },
    { label: t('view_movimientos.motivos.loss'), value: 'Extravío' },
    { label: t('view_movimientos.motivos.setup'), value: 'Set up' },
    { label: t('view_movimientos.motivos.poor_quality'), value: 'Mala calidad' },
    { label: t('view_movimientos.motivos.other'), value: 'Otro' }
]);

const esValidoParaBaja = computed(() => {
    if (!motivoBaja.value) return false;
    if (motivoBaja.value === 'Otro' && !motivoOtro.value.trim()) return false;
    return true;
});

const solicitarCarga = () => {
    cargarHerramientas({
        page: paginaActual.value, 
        limit: 10,
        search: busquedaTexto.value,
        categories: categoriasSeleccionadas.value.join(','),
        sortField: sortFieldActual.value,
        sortOrder: sortOrderActual.value
    });
};

let timeoutBusqueda: any = null;
watch([busquedaTexto, categoriasSeleccionadas], () => {
    clearTimeout(timeoutBusqueda);
    timeoutBusqueda = setTimeout(() => {
        paginaActual.value = 1;
        solicitarCarga();
    }, 300);
}, { deep: true });

const manejarSeleccion = (seleccion: any) => {
    herramientaSeleccionada.value = seleccion;
};

const abrirDetalles = (herramienta: any) => {
    herramientaViendo.value = { ...herramienta };
    mostrarModalDetalles.value = true;
};

const cambiarPagina = (evento: { page: number }) => {
    paginaActual.value = evento.page;
    solicitarCarga();
};

const manejarOrden = (event: any) => {
    if (!event.sortField) return;

    sortFieldActual.value = event.sortField;
    sortOrderActual.value = event.sortOrder === 1 ? 'ASC' : 'DESC';

    solicitarCarga();
};

const prepararEdicionSeleccionada = () => {
    if (herramientaSeleccionada.value) {
        prepararEdicion(herramientaSeleccionada.value);
    }
};

const confirmarBaja = () => {
    if (herramientaSeleccionada.value) {
        const h = herramientaSeleccionada.value;
        const totalFisico = h.cantidad || h.stockFisico || 0;
        const totalDisponible = h.cantidadDisponible ?? h.stockFisico ?? 0;

        if (totalFisico > totalDisponible) {
            const unidadesPrestadas = totalFisico - totalDisponible;
            
            toast.add({ 
                severity: 'warn', 
                summary: t('view_movimientos.toast.denied_summary'), 
                detail: t('view_movimientos.toast.denied_detail', { units: unidadesPrestadas }), 
                life: 5000 
            });
            
            return; 
        }
        
        motivoBaja.value = null;
        motivoOtro.value = '';
        mostrarModalBaja.value = true;
    }
};

const cerrarModalBaja = () => {
    mostrarModalBaja.value = false;
};

const procesarBaja = async () => {
    if (herramientaSeleccionada.value && esValidoParaBaja.value) {
        const datosBaja = {
            motivo: motivoBaja.value,
            motivoOtro: motivoOtro.value.trim()
        };

        await eliminarHerramienta(herramientaSeleccionada.value, datosBaja);
        
        herramientaSeleccionada.value = null; 
        mostrarModalBaja.value = false;
        solicitarCarga();
    }
};

const manejarGuardado = async () => {
    await guardarHerramienta();

    if (herramientaSeleccionada.value?.id) {
        const idActual = herramientaSeleccionada.value.id;
        const herramientaFresca = herramientas.value.find((h: any) => h.id === idActual);
        if (herramientaFresca) {
            herramientaSeleccionada.value = herramientaFresca;
        }
    }
};

const volverAInventario = () => {
    router.push('/inventario');
};

onMounted(() => {
    solicitarCarga();
});
</script>

<template>
  <div class="panel-principal p-3 md:p-4 border-round-xl shadow-1 mt-4">
    
    <Toast />

    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0 titulo-vista">{{ t('view_movimientos.titulo') }}</h2>
    </div>

    <!-- Barra de Herramientas y Búsqueda -->
    <div class="flex flex-column gap-3 mb-4 p-3 toolbar-oscuro border-round">

      <div class="flex flex-wrap gap-2 w-full justify-content-between align-items-center">
        <div class="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button 
                icon="pi pi-arrow-left" 
                :label="t('view_movimientos.btn_volver')" 
                class="btn-volver w-full sm:w-auto" 
                outlined 
                @click="volverAInventario" 
            />

            <Button 
                :label="t('view_movimientos.btn_editar')" 
                icon="pi pi-pencil" 
                severity="info" 
                class="font-bold btn-editar w-full sm:w-auto" 
                :disabled="!herramientaSeleccionada" 
                @click="prepararEdicionSeleccionada" 
            />
            
            <Button 
                :label="t('view_movimientos.btn_eliminar')" 
                icon="pi pi-trash" 
                severity="danger" 
                class="font-bold btn-eliminar w-full sm:w-auto" 
                :disabled="!herramientaSeleccionada" 
                @click="confirmarBaja" 
            />
        </div>
      </div>

      <!-- Buscador y Chips de Filtro -->
      <div class="w-full mt-2">
        <div class="flex flex-wrap align-items-center gap-2 mb-2">
            <span class="text-sm font-bold text-400 mr-2">{{ t('view_inventario.buscar_en') }}</span>
            <Chip 
                v-for="cat in categoriasDisponibles" 
                :key="cat.key"
                :label="cat.label"
                :class="['chip-categoria cursor-pointer', { 'active': categoriasSeleccionadas.includes(cat.key) }]"
                @click="toggleCategoria(cat.key)"
            />
        </div>

        <IconField iconPosition="left" class="w-full">
          <InputIcon class="pi pi-search" />
          <InputText 
            id="buscador-movimientos" 
            name="buscador-movimientos" 
            :aria-label="t('view_movimientos.ph_buscar')"
            v-model="busquedaTexto" 
            :placeholder="placeholderDinamico" 
            class="input-oscuro w-full input-buscador-grande" 
            autocomplete="off" 
          />
        </IconField>
      </div>
    </div>

    <!-- Tabla Genérica con Paginación y Orden Servidor -->
    <TablaHerramientas
      :herramientas="herramientas"
      :cargando="cargando"
      :totalRecords="totalRegistros"
      :paginaActual="paginaActual"
      :filtros="filtros"
      :filasPorPagina="10"
      llaveMemoria="vista_movimientos"
      @seleccion="manejarSeleccion"
      @doble-click="abrirDetalles"
      @cambio-pagina="cambiarPagina"
      @ordenar="manejarOrden"
      @toggle-categoria="toggleCategoria"
    />

    <!-- Modal Formulario de Edición -->
    <FormularioHerramienta
      v-model:visible="mostrarModal"
      :herramienta="herramientaActual"
      :esEdicion="true"
      @guardar="manejarGuardado"
    />

    <!-- Modal Detalle Ficha (Solo Lectura) -->
    <ModalDetalleHerramienta 
      v-model:visible="mostrarModalDetalles" 
      :herramienta="herramientaViendo" 
      :ocultarBotonAgregar="true"
    />

    <!-- Modal de Confirmación de Baja -->
    <Dialog 
        v-model:visible="mostrarModalBaja" 
        :header="t('view_movimientos.modal.header')" 
        :modal="true" 
        :style="{ width: '450px' }" 
        :closable="false"
        dismissableMask
    >
        <div class="flex flex-column gap-4 py-3">
            <span>
                {{ t('view_movimientos.modal.confirm_text') }} 
                <b v-if="herramientaSeleccionada">{{ herramientaSeleccionada.nombre }} ({{ herramientaSeleccionada.codigo }})</b>?
            </span>

            <div class="flex flex-column gap-2">
                <label for="motivoBaja" class="font-semibold">{{ t('view_movimientos.modal.reason_label') }} *</label>
                <Dropdown 
                    inputId="motivoBaja" 
                    v-model="motivoBaja" 
                    :options="opcionesMotivos"
                    optionLabel="label"
                    optionValue="value"
                    :placeholder="t('view_movimientos.modal.placeholder_motivo')" 
                    class="w-full" 
                />
            </div>

            <div v-if="motivoBaja === 'Otro'" class="flex flex-column gap-2">
                <label for="motivoOtro" class="font-semibold">{{ t('view_movimientos.modal.specify_reason_label') }} *</label>
                <InputText 
                    id="motivoOtro" 
                    v-model="motivoOtro" 
                    :placeholder="t('view_movimientos.modal.placeholder_specify')" 
                    class="w-full" 
                    autofocus
                />
            </div>
        </div>

        <template #footer>
            <div class="flex justify-content-end gap-2 mt-2">
                <Button :label="t('view_movimientos.modal.btn_cancel')" icon="pi pi-times" text severity="secondary" @click="cerrarModalBaja" />
                <Button :label="t('view_movimientos.modal.btn_confirm')" icon="pi pi-check" severity="danger" :disabled="!esValidoParaBaja" @click="procesarBaja" />
            </div>
        </template>
    </Dialog>

  </div>
</template>

<style scoped>
.titulo-vista { color: #5ab1ce; }

.input-buscador-grande {
    font-size: 1.05rem;
    padding: 0.75rem 1rem 0.75rem 2.5rem !important;
}

.chip-categoria {
    background-color: #1e293b;
    color: #94a3b8;
    border: 1px solid #334155;
    transition: all 0.2s ease;
    user-select: none;
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

:deep(.btn-editar) {
    background-color: #0ea5e9 !important;
    border: none !important;
    color: white !important;
}
:deep(.btn-editar:not(:disabled):hover) {
    background-color: #0284c7 !important;
}

:deep(.btn-eliminar) {
    background-color: #ef4444 !important;
    border: none !important;
    color: white !important;
}
:deep(.btn-eliminar:not(:disabled):hover) {
    background-color: #dc2626 !important;
}

:deep(.p-button:disabled) {
    opacity: 0.5 !important;
}
</style>