<script setup>
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import { useI18n } from 'vue-i18n'; 

const props = defineProps({
    visible: Boolean,
    herramienta: Object
});

const emit = defineEmits(['update:visible', 'agregar-orden']);

const { t } = useI18n();

const cerrar = () => emit('update:visible', false);
const agregarAOrden = () => emit('agregar-orden', props.herramienta);

const obtenerSeveridadStock = (h) => {
    if (!h) return 'success';
    if (h.cantidadDisponible < h.cantidadMinima) return 'danger';
    if (h.cantidadDisponible === h.cantidadMinima) return 'warning';
    return 'success';
};

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
    :style="{ width: '600px' }" 
    :breakpoints="{ '1199px': '75vw', '768px': '90vw', '575px': '95vw' }" 
    :header="t('detalle_herramientas.titulo')" 
    :modal="true"
    dismissableMask
    class="modal-oscuro-primeflex"
  >
    <div v-if="herramienta" class="pt-2 pb-1 px-2 md:px-3">
      
      <!-- Imagen y Badge -->
      <div class="flex flex-column align-items-center mb-5">
          <img 
            v-if="herramienta.imagen" 
            :src="herramienta.imagen" 
            @error="$event.target.src='https://via.placeholder.com/150x150/1e252d/ffffff?text=Error'"
            class="border-round" 
            style="width: 150px; height: 150px; object-fit: cover;" 
          />
          <div v-else class="flex align-items-center justify-content-center border-round fondo-imagen-vacia" style="width: 150px; height: 150px;">
              <i class="pi pi-image text-5xl icono-vacio"></i>
          </div>
          
          <div class="mt-4">
              <Tag class="text-sm font-bold px-3 py-2 uppercase tracking-wide" :severity="obtenerSeveridadStock(herramienta)" :value="obtenerTextoStock(herramienta)" />
          </div>
      </div>

      <!-- Grid de Datos con las claves de tu JSON -->
      <div class="grid formgrid">
          <div class="col-12 md:col-6 mb-4">
              <span class="label-gris block mb-1 text-sm">{{ t('detalle_herramientas.codigo') }}</span>
              <span class="text-lg font-bold" style="color: #38bdf8;">{{ herramienta.codigo }}</span>
          </div>
          <div class="col-12 md:col-6 mb-4">
              <span class="label-gris block mb-1 text-sm">{{ t('detalle_herramientas.nombre') }}</span>
              <!-- Cambiamos text-white por texto-valor -->
              <span class="text-lg font-bold texto-valor">{{ herramienta.nombre }}</span>
          </div>
          
          <div class="col-12 md:col-6 mb-4">
              <span class="label-gris block mb-1 text-sm">{{ t('detalle_herramientas.tipo') }}</span>
              <span class="text-lg font-bold texto-valor">{{ herramienta.tipo || t('detalle_herramientas.no_aplica') }}</span>
          </div>
          <div class="col-12 md:col-6 mb-4">
              <span class="label-gris block mb-1 text-sm">{{ t('detalle_herramientas.ubicacion') }}</span>
              <span class="text-lg font-bold texto-valor">{{ herramienta.ubicacion || t('detalle_herramientas.no_aplica') }}</span>
          </div>
          
          <div class="col-12 md:col-6 mb-4">
              <span class="label-gris block mb-1 text-sm">{{ t('detalle_herramientas.marca') }}</span>
              <span class="text-lg font-bold texto-valor">{{ herramienta.marca || t('detalle_herramientas.sin_marca') }}</span>
          </div>
          
          <div class="col-12 md:col-6 mb-4">
              <span class="label-gris block mb-1 text-sm">{{ t('detalle_herramientas.stock_niveles') }}</span>
              <span class="text-lg font-bold texto-valor">
                  {{ herramienta.cantidadDisponible }} / {{ herramienta.cantidadMinima }} / {{ herramienta.cantidadMaxima || 'N/A' }} {{ t('detalle_herramientas.unidades') }}
              </span>
          </div>
          
          <div class="col-12 mb-2">
              <span class="label-gris block mb-2 text-sm">{{ t('detalle_herramientas.descripcion') }}</span>
              <div class="caja-descripcion p-3 border-round text-sm">
                  {{ herramienta.descripcion || t('detalle_herramientas.sin_descripcion') }}
              </div>
          </div>
      </div>
    </div>
    
    <template #footer>
      <!-- Reemplazamos el style en línea por la clase footer-separador -->
      <div class="flex justify-content-end align-items-center gap-3 pt-3 mt-1 footer-separador">
          <Button 
            :label="t('detalle_herramientas.btn_cerrar')" 
            icon="pi pi-times" 
            text 
            class="btn-texto-gris" 
            @click="cerrar" 
          />
          <Button 
            label="Añadir a Orden" 
            icon="pi pi-plus" 
            class="btn-agregar font-bold px-4 py-2" 
            @click="agregarAOrden" 
            autofocus 
          />
      </div>
    </template>
  </Dialog>
</template>

<style>

/* ========================================================
   TEMA OSCURO (Por defecto)
   ======================================================== */
.modal-oscuro-primeflex .label-gris {
    color: #94a3b8 !important;
}

.modal-oscuro-primeflex .texto-valor {
    color: #ffffff !important;
}

.modal-oscuro-primeflex .caja-descripcion {
    background-color: #2a323d !important;
    border: 1px solid #3f4b5b !important;
    color: #cbd5e1 !important;
}

.modal-oscuro-primeflex .fondo-imagen-vacia {
    background-color: #1a222b !important;
}

.modal-oscuro-primeflex .icono-vacio {
    color: #4a5568 !important;
}

.modal-oscuro-primeflex .footer-separador {
    border-top: 1px solid #2a323d !important;
}

.modal-oscuro-primeflex .btn-texto-gris {
    color: #94a3b8 !important;
}
.modal-oscuro-primeflex .btn-texto-gris:hover {
    color: #ffffff !important;
    background: rgba(255, 255, 255, 0.05) !important;
}

.modal-oscuro-primeflex .btn-agregar {
    background-color: #22c55e !important;
    color: #121820 !important;
    border: none !important;
    border-radius: 6px !important;
}
.modal-oscuro-primeflex .btn-agregar:hover {
    background-color: #16a34a !important;
}

.modal-oscuro-primeflex .tracking-wide {
    letter-spacing: 0.025em;
}

/* ========================================================
   TEMA CLARO (Sobreescrituras dinámicas)
   ======================================================== */
html.light-theme .modal-oscuro-primeflex .label-gris {
    color: #64748b !important;
}

html.light-theme .modal-oscuro-primeflex .texto-valor {
    color: #334155 !important; 
}

html.light-theme .modal-oscuro-primeflex .caja-descripcion {
    background-color: #f8fafc !important;
    border: 1px solid #cbd5e1 !important;
    color: #334155 !important;
}

html.light-theme .modal-oscuro-primeflex .fondo-imagen-vacia {
    background-color: #f1f5f9 !important;
}

html.light-theme .modal-oscuro-primeflex .icono-vacio {
    color: #94a3b8 !important;
}

html.light-theme .modal-oscuro-primeflex .footer-separador {
    border-top: 1px solid #e2e8f0 !important;
}

html.light-theme .modal-oscuro-primeflex .btn-texto-gris {
    color: #64748b !important;
}
html.light-theme .modal-oscuro-primeflex .btn-texto-gris:hover {
    color: #0f172a !important;
    background: rgba(0, 0, 0, 0.05) !important;
}
</style>