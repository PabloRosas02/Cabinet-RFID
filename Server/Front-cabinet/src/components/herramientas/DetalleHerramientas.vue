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
          <div v-else class="flex align-items-center justify-content-center border-round shadow-1 fondo-imagen-vacia" style="width: 100%; max-width: 200px; height: 200px;">
              <i class="pi pi-image text-7xl icono-vacio"></i>
          </div>
          
          <div class="mt-4">
              <Tag class="text-lg md:text-xl px-4 py-2" :severity="obtenerSeveridadStock(herramienta)" :value="obtenerTextoStock(herramienta)" />
          </div>
      </div>

      <!-- Grid de Datos -->
      <div class="grid">
          <div class="col-12 md:col-6 mb-3">
              <span class="label-gris block mb-1">Código</span>
              <span class="text-xl font-bold" style="color: #38bdf8;">{{ herramienta.codigo }}</span>
          </div>
          <div class="col-12 md:col-6 mb-3">
              <span class="label-gris block mb-1">Nombre</span>
              <span class="text-xl font-bold text-white">{{ herramienta.nombre }}</span>
          </div>
          
          <div class="col-12 md:col-6 mb-3">
              <span class="label-gris block mb-1">Tipo / Categoría</span>
              <span class="text-lg text-white">{{ herramienta.tipo || 'N/A' }}</span>
          </div>
          <div class="col-12 md:col-6 mb-3">
              <span class="label-gris block mb-1">Ubicación Física</span>
              <span class="text-lg text-white">{{ herramienta.ubicacion || 'N/A' }}</span>
          </div>
          
          <div class="col-12 md:col-6 mb-3">
              <span class="label-gris block mb-1">Marca / Proveedor</span>
              <span class="text-lg text-white">{{ herramienta.marca || 'S/M' }}</span>
          </div>
          <div class="col-12 md:col-6 mb-3">
              <span class="label-gris block mb-1">Stock Actual vs Mínimo</span>
              <span class="text-lg font-bold text-white">{{ herramienta.cantidadDisponible }} / {{ herramienta.cantidadMinima }} unidades</span>
          </div>
          
          <div class="col-12 mb-3">
              <span class="label-gris block mb-1">Descripción y Notas</span>
              <div class="caja-descripcion p-3 border-round text-base md:text-lg line-height-3">
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
            class="p-button-text btn-cerrar-modal" 
            @click="cerrar" 
            autofocus 
          />
      </div>
    </template>
  </Dialog>
</template>

<style>
/* =========================================================
   ESTILOS GLOBALES DEL MODAL (Sin 'scoped' por el Teleport)
   ========================================================= */

/* Contenedor Principal del Dialog */
.modal-oscuro-primeflex {
    background-color: #1e252d !important;
    border: 1px solid #4a5568 !important;
    border-radius: 8px !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
}

/* Cabecera, Contenido y Pie del Dialog */
.modal-oscuro-primeflex .p-dialog-header,
.modal-oscuro-primeflex .p-dialog-content,
.modal-oscuro-primeflex .p-dialog-footer {
    background-color: #1e252d !important;
    color: #ffffff !important;
    border: none !important;
    padding-left: 1.5rem !important;
    padding-right: 1.5rem !important;
}

.modal-oscuro-primeflex .p-dialog-header {
    border-bottom: 1px solid #2a323d !important;
    padding-top: 1.5rem !important;
}

.modal-oscuro-primeflex .p-dialog-footer {
    border-top: 1px solid #2a323d !important;
    padding-bottom: 1.5rem !important;
}

/* Botón 'X' de la esquina superior derecha */
.modal-oscuro-primeflex .p-dialog-header-icon {
    color: #94a3b8 !important;
}
.modal-oscuro-primeflex .p-dialog-header-icon:hover {
    background-color: rgba(255, 255, 255, 0.05) !important;
    color: #ffffff !important;
}

/* =========================================================
   CLASES INTERNAS (Protegidas bajo la clase del modal)
   ========================================================= */
.modal-oscuro-primeflex .label-gris {
    color: #94a3b8 !important;
}

.modal-oscuro-primeflex .caja-descripcion {
    background-color: #313a46 !important;
    border: 1px solid #3f4b5b !important;
    color: #cbd5e1 !important;
}

.modal-oscuro-primeflex .fondo-imagen-vacia {
    background-color: #121820 !important;
}

.modal-oscuro-primeflex .icono-vacio {
    color: #4a5568 !important;
}

.modal-oscuro-primeflex .btn-cerrar-modal {
    color: #94a3b8 !important;
}

.modal-oscuro-primeflex .btn-cerrar-modal:hover {
    color: #ffffff !important;
    background-color: rgba(255, 255, 255, 0.05) !important;
}
</style>