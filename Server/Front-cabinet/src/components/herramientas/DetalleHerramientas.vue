<script setup>
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import { useI18n } from 'vue-i18n'; 

const props = defineProps({
    visible: Boolean,
    herramienta: Object
});

const emit = defineEmits(['update:visible']);

const { t } = useI18n();

const cerrar = () => emit('update:visible', false);

const obtenerSeveridadStock = (h) => {
    if (!h) return 'success';
    if (h.cantidadDisponible < h.cantidadMinima) return 'danger';
    if (h.cantidadDisponible === h.cantidadMinima) return 'warning';
    return 'success';
};

// Traducimos las etiquetas de estado del stock en el código
const obtenerTextoStock = (h) => {
    if (!h) return '';
    if (h.cantidadDisponible < h.cantidadMinima) return t('detalle_herramientas.estado_critico');
    if (h.cantidadDisponible === h.cantidadMinima) return t('detalle_herramientas.estado_alerta');
    return t('detalle_herramientas.estado_normal');
};
</script>

<template>
  <Dialog 
    :visible="visible" 
    @update:visible="(val) => emit('update:visible', val)"
    :style="{ width: '700px' }" 
    :breakpoints="{ '1199px': '75vw', '768px': '90vw', '575px': '95vw' }" 
    :header="t('detalle_herramientas.titulo')" 
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
              <span class="label-gris block mb-1">{{ t('detalle_herramientas.codigo') }}</span>
              <span class="text-xl font-bold" style="color: #38bdf8;">{{ herramienta.codigo }}</span>
          </div>
          <div class="col-12 md:col-6 mb-3">
              <span class="label-gris block mb-1">{{ t('detalle_herramientas.nombre') }}</span>
              <span class="text-xl font-bold text-white">{{ herramienta.nombre }}</span>
          </div>
          
          <!-- Se usa el || (OR) para colocar "N/A" si la base de datos no trae el dato -->
          <div class="col-12 md:col-6 mb-3">
              <span class="label-gris block mb-1">{{ t('detalle_herramientas.tipo') }}</span>
              <span class="text-lg text-white">{{ herramienta.tipo || t('detalle_herramientas.no_aplica') }}</span>
          </div>
          <div class="col-12 md:col-6 mb-3">
              <span class="label-gris block mb-1">{{ t('detalle_herramientas.ubicacion') }}</span>
              <span class="text-lg text-white">{{ herramienta.ubicacion || t('detalle_herramientas.no_aplica') }}</span>
          </div>
          
          <div class="col-12 md:col-6 mb-3">
              <span class="label-gris block mb-1">{{ t('detalle_herramientas.marca') }}</span>
              <span class="text-lg text-white">{{ herramienta.marca || t('detalle_herramientas.sin_marca') }}</span>
          </div>
          <div class="col-12 md:col-6 mb-3">
              <span class="label-gris block mb-1">{{ t('detalle_herramientas.stock_vs_minimo') }}</span>
              <span class="text-lg font-bold text-white">{{ herramienta.cantidadDisponible }} / {{ herramienta.cantidadMinima }} {{ t('detalle_herramientas.unidades') }}</span>
          </div>
          
          <div class="col-12 mb-3">
              <span class="label-gris block mb-1">{{ t('detalle_herramientas.descripcion') }}</span>
              <div class="caja-descripcion p-3 border-round text-base md:text-lg line-height-3">
                  {{ herramienta.descripcion || t('detalle_herramientas.sin_descripcion') }}
              </div>
          </div>
      </div>
    </div>
    
    <!-- Footer solo con botón de Cerrar -->
    <template #footer>
      <div class="flex justify-content-end mt-2 md:mt-3">
          <Button 
            :label="t('detalle_herramientas.btn_cerrar')" 
            icon="pi pi-times" 
            class="btn-cancelar font-bold" 
            @click="cerrar" 
            autofocus 
          />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
/* =========================================================
   CLASES INTERNAS (Específicas de este componente)
   ========================================================= */
.label-gris {
    color: #94a3b8 !important;
}

.caja-descripcion {
    background-color: #313a46 !important;
    border: 1px solid #3f4b5b !important;
    color: #cbd5e1 !important;
}

.fondo-imagen-vacia {
    background-color: #121820 !important;
}

.icono-vacio {
    color: #4a5568 !important;
}
</style>