<script setup>
import { ref, onMounted } from 'vue'; 
import { useRouter } from 'vue-router'; 
import { FilterMatchMode } from '@primevue/core/api';
import { useHerramientas } from '@/composables/useHerramientas';
import { useI18n } from 'vue-i18n'; 

import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Toast from 'primevue/toast';

import TablaHerramientas from '@/components/herramientas/TablaHerramientas.vue';
import FormularioHerramienta from '@/components/herramientas/FormularioHerramientas.vue';
import DetalleHerramientas from '@/components/herramientas/DetalleHerramientas.vue';

const router = useRouter(); 
const { t } = useI18n(); 

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

const eliminarSeleccionada = async () => {
    if (herramientaSeleccionada.value) {
        await eliminarHerramienta(herramientaSeleccionada.value);
        herramientaSeleccionada.value = null; 
        
        // Refrescamos por seguridad
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
      <!-- Inyectamos la traducción del título -->
      <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">{{ t('view_movimientos.titulo') }}</h2>
    </div>

    <div class="flex flex-column xl:flex-row justify-content-between gap-3 mb-4 p-3 toolbar-oscuro border-round">

      <div class="flex flex-column sm:flex-row gap-2 w-full xl:w-auto">
        <!-- Traducimos los botones -->
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
            @click="eliminarSeleccionada" 
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