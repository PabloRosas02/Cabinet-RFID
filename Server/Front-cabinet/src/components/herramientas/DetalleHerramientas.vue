<script setup>
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Button from 'primevue/button';

const props = defineProps({
    visible: Boolean,
    herramienta: Object
});

const emit = defineEmits(['update:visible']);

const cerrar = () => emit('update:visible', false);

const obtenerSeveridadStock = (h) => {
    if (!h) return 'success';
    if (h.cantidadDisponible < h.cantidadMinima) return 'danger';
    if (h.cantidadDisponible === h.cantidadMinima) return 'warning';
    return 'success';
};

const obtenerTextoStock = (h) => {
    if (!h) return '';
    if (h.cantidadDisponible < h.cantidadMinima) return 'CRÍTICO';
    if (h.cantidadDisponible === h.cantidadMinima) return 'ALERTA';
    return 'NORMAL';
};
</script>

<template>
  <Dialog 
    :visible="visible" 
    @update:visible="(val) => emit('update:visible', val)"
    :style="{ width: '700px' }" 
    :breakpoints="{ '1199px': '75vw', '768px': '90vw', '575px': '95vw' }" 
    header="Detalles de la Herramienta" 
    :modal="true"
    dismissableMask
    class="modal-oscuro-primeflex"
  >
    <!-- Padding responsivo: p-3 en móvil, p-4 a partir de tablet -->
    <div v-if="herramienta" class="p-3 md:p-4">
      
      <!-- Imagen y Badge -->
      <div class="flex flex-column align-items-center mb-5">
          <!-- Binding dinámico para la imagen con fallback en caso de error -->
          <img 
            v-if="herramienta.imagen" 
            :src="herramienta.imagen" 
            @error="$event.target.src='https://via.placeholder.com/250x150/1e252d/ffffff?text=Error'"
            class="shadow-3 border-round" 
            style="max-width: 100%; max-height: 300px; object-fit: contain;" 
          />
          <!-- Icono por defecto si la base de datos no manda imagen -->
          <div v-else class="flex align-items-center justify-content-center surface-200 border-round shadow-1" style="width: 100%; max-width: 200px; height: 200px;">
              <i class="pi pi-image text-7xl text-400"></i>
          </div>
          
          <div class="mt-4">
              <Tag class="text-lg md:text-xl px-4 py-2" :severity="obtenerSeveridadStock(herramienta)" :value="obtenerTextoStock(herramienta)" />
          </div>
      </div>

      <!-- Grid de Datos -->
      <div class="grid">
          <div class="col-12 md:col-6 mb-3">
              <span class="text-500 block mb-1">Código</span>
              <span class="text-xl font-bold" style="color: #38bdf8;">{{ herramienta.codigo }}</span>
          </div>
          <div class="col-12 md:col-6 mb-3">
              <span class="text-500 block mb-1">Nombre</span>
              <span class="text-xl font-bold text-white">{{ herramienta.nombre }}</span>
          </div>
          
          <div class="col-12 md:col-6 mb-3">
              <span class="text-500 block mb-1">Tipo / Categoría</span>
              <span class="text-lg text-white">{{ herramienta.tipo || 'N/A' }}</span>
          </div>
          <div class="col-12 md:col-6 mb-3">
              <span class="text-500 block mb-1">Ubicación Física</span>
              <span class="text-lg text-white">{{ herramienta.ubicacion || 'N/A' }}</span>
          </div>
          
          <div class="col-12 md:col-6 mb-3">
              <span class="text-500 block mb-1">Marca / Proveedor</span>
              <span class="text-lg text-white">{{ herramienta.marca || 'S/M' }}</span>
          </div>
          <div class="col-12 md:col-6 mb-3">
              <span class="text-500 block mb-1">Stock Actual vs Mínimo</span>
              <span class="text-lg font-bold text-white">{{ herramienta.cantidadDisponible }} / {{ herramienta.cantidadMinima }} unidades</span>
          </div>
          
          <div class="col-12 mb-3">
              <span class="text-500 block mb-1">Descripción y Notas</span>
              <div class="surface-100 p-3 border-round text-base md:text-lg line-height-3 text-300">
                  {{ herramienta.descripcion || 'Sin descripción o notas adicionales para esta herramienta.' }}
              </div>
          </div>
      </div>
    </div>
    
    <!-- Footer solo con botón de Cerrar -->
    <template #footer>
      <div class="flex justify-content-end mt-2 md:mt-3">
          <Button 
            label="Cerrar" 
            icon="pi pi-times" 
            class="p-button-text text-500 hover:text-white" 
            @click="cerrar" 
            autofocus 
          />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
/* Aseguramos que los fondos de PrimeFlex combinen con tu modo oscuro */
:deep(.surface-100) {
    background-color: #313a46 !important;
    border: 1px solid #3f4b5b !important;
}
:deep(.surface-200) {
    background-color: #1e252d !important;
}
:deep(.text-500) {
    color: #94a3b8 !important;
}
:deep(.text-300) {
    color: #cbd5e1 !important;
}

/* Modificadores globales para el Dialog para que tenga el fondo oscuro */
:deep(.modal-oscuro-primeflex .p-dialog-header),
:deep(.modal-oscuro-primeflex .p-dialog-content),
:deep(.modal-oscuro-primeflex .p-dialog-footer) {
    background-color: #1e252d !important;
    color: #ffffff !important;
    border: none;
    padding-left: 1rem !important; /* Ligeramente menos padding lateral en móvil */
    padding-right: 1rem !important;
}

@media (min-width: 768px) {
    :deep(.modal-oscuro-primeflex .p-dialog-header),
    :deep(.modal-oscuro-primeflex .p-dialog-content),
    :deep(.modal-oscuro-primeflex .p-dialog-footer) {
        padding-left: 1.5rem !important;
        padding-right: 1.5rem !important;
    }
}

:deep(.modal-oscuro-primeflex .p-dialog-header) {
    border-bottom: 1px solid #2a323d !important;
}
:deep(.modal-oscuro-primeflex .p-dialog-footer) {
    border-top: 1px solid #2a323d !important;
}

/* Ajustes adicionales para el icono de la ventana */
:deep(.modal-oscuro-primeflex .p-dialog-header-icon) {
    color: #94a3b8 !important;
}
:deep(.modal-oscuro-primeflex .p-dialog-header-icon:hover) {
    background-color: rgba(255, 255, 255, 0.05) !important;
    color: #ffffff !important;
}
</style>