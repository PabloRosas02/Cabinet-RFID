<script setup>
import { ref, computed, onMounted } from 'vue'; 
import { useRouter } from 'vue-router'; 
import { FilterMatchMode } from '@primevue/core/api';
import { useHerramientas } from '@/composables/useHerramientas';
import { useI18n } from 'vue-i18n'; 
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Toast from 'primevue/toast';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';

import TablaHerramientas from '@/components/herramientas/TablaHerramientas.vue';
import FormularioHerramienta from '@/components/herramientas/FormularioHerramientas.vue';
import DetalleHerramientas from '@/components/herramientas/DetalleHerramientas.vue';

const router = useRouter(); 
const { t } = useI18n(); 
const toast = useToast();

const { 
    herramientas, cargando, mostrarModal, herramientaActual, esEdicion, 
    prepararEdicion, guardarHerramienta, eliminarHerramienta, cargarHerramientas
} = useHerramientas();

const herramientaSeleccionada = ref(null);
const filtros = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const mostrarModalDetalles = ref(false);
const herramientaViendo = ref(null);

// Variables para el Modal de Baja
const mostrarModalBaja = ref(false);
const motivoBaja = ref(null);
const motivoOtro = ref('');

// Computed property to translate labels while keeping the original values for the backend/logic
const opcionesMotivos = computed(() => [
    { label: t('view_movimientos.motivos.end_of_life'), value: 'Fin de vida útil' },
    { label: t('view_movimientos.motivos.operator_damage'), value: 'Daño por operador' },
    { label: t('view_movimientos.motivos.loss'), value: 'Extravío' },
    { label: t('view_movimientos.motivos.setup'), value: 'Set up' },
    { label: t('view_movimientos.motivos.poor_quality'), value: 'Mala calidad' },
    { label: t('view_movimientos.motivos.other'), value: 'Otro' }
]);

// Validación dinámica para habilitar/deshabilitar el botón de confirmar
const esValidoParaBaja = computed(() => {
    if (!motivoBaja.value) return false;
    if (motivoBaja.value === 'Otro' && !motivoOtro.value.trim()) return false;
    return true;
});

const manejarSeleccion = (seleccion) => {
    herramientaSeleccionada.value = seleccion;
};

const abrirDetalles = (herramienta) => {
    herramientaViendo.value = herramienta;
    mostrarModalDetalles.value = true;
};

const prepararEdicionSeleccionada = () => {
    if (herramientaSeleccionada.value) {
        prepararEdicion(herramientaSeleccionada.value);
    }
};

const confirmarBaja = () => {
    if (herramientaSeleccionada.value) {

        // Si el total físico es mayor al disponible, hay piezas prestadas
        if (herramientaSeleccionada.value.cantidad > herramientaSeleccionada.value.cantidadDisponible) {
            const unidadesPrestadas = herramientaSeleccionada.value.cantidad - herramientaSeleccionada.value.cantidadDisponible;
            
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
        
        await cargarHerramientas();
    }
};

const manejarGuardado = async () => {
    await guardarHerramienta();
    await cargarHerramientas();

    if (herramientaSeleccionada.value) {
        const idActual = herramientaSeleccionada.value.id;
        const herramientaFresca = herramientas.value.find(h => h.id === idActual);
        if (herramientaFresca) {
            herramientaSeleccionada.value = herramientaFresca;
        }
    }
};

const volverAInventario = () => {
    router.push('/inventario');
};

onMounted(() => {
    cargarHerramientas();
});
</script>

<template>
  <div class="panel-principal p-3 md:p-4 border-round-xl shadow-1 mt-4">
    
    <Toast />

    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">{{ t('view_movimientos.titulo') }}</h2>
    </div>

    <div class="flex flex-column xl:flex-row justify-content-between gap-3 mb-4 p-3 toolbar-oscuro border-round">

      <div class="flex flex-column sm:flex-row gap-2 w-full xl:w-auto">
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
      
      <div class="w-full xl:w-auto">
        <IconField iconPosition="left" class="w-full xl:w-30rem">
          <InputIcon class="pi pi-search" />
          <InputText 
            id="buscador-movimientos" 
            name="buscador-movimientos" 
            v-model="filtros['global'].value" 
            :placeholder="t('view_movimientos.ph_buscar')" 
            class="input-oscuro w-full" 
            autocomplete="off" 
          />
        </IconField>
      </div>
    </div>

    <TablaHerramientas
      :herramientas="herramientas"
      :cargando="cargando"
      :filtros="filtros"
      llaveMemoria="vista_movimientos"
      @seleccion="manejarSeleccion"
      @doble-click="abrirDetalles"
    />

    <FormularioHerramienta
      v-model:visible="mostrarModal"
      :herramienta="herramientaActual"
      :esEdicion="true"
      @guardar="manejarGuardado"
    />

    <DetalleHerramientas 
      v-model:visible="mostrarModalDetalles" 
      :herramienta="herramientaViendo" 
    />

    <!-- MODAL DE CONFIRMACIÓN DE BAJA -->
    <Dialog 
        v-model:visible="mostrarModalBaja" 
        :header="t('view_movimientos.modal.header')" 
        :modal="true" 
        :style="{ width: '450px' }" 
        :closable="false"
    >
        <div class="flex flex-column gap-4 py-3">
            <span>
                {{ t('view_movimientos.modal.confirm_text') }} 
                <b v-if="herramientaSeleccionada">{{ herramientaSeleccionada.nombre }} ({{ herramientaSeleccionada.codigo }})</b>?
            </span>

            <div class="flex flex-column gap-2">
                <label for="motivoBaja" class="font-semibold">{{ t('view_movimientos.modal.reason_label') }} *</label>
                <Dropdown 
                    id="motivoBaja" 
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
                />
            </div>
        </div>

        <template #footer>
            <Button :label="t('view_movimientos.modal.btn_cancel')" icon="pi pi-times" text severity="secondary" @click="cerrarModalBaja" />
            <Button :label="t('view_movimientos.modal.btn_confirm')" icon="pi pi-check" severity="danger" :disabled="!esValidoParaBaja" @click="procesarBaja" />
        </template>
    </Dialog>

  </div>
</template>

<style scoped>
/* =========================================================
   BOTONES DE ACCIÓN EXCLUSIVOS DE ESTA VISTA
   ========================================================= */
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

/* Opacidad cuando no hay nada seleccionado */
:deep(.p-button:disabled) {
    opacity: 0.5 !important;
}
</style>