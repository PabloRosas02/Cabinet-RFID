<script setup>
import { computed } from 'vue';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import { useI18n } from 'vue-i18n';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    herramienta: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'editar']);

const { t } = useI18n();

const cerrar = () => emit('update:visible', false);

const stockFisico = computed(() => props.herramienta?.cantidadDisponible ?? props.herramienta?.stockFisico ?? 0);
const stockMinimo = computed(() => props.herramienta?.cantidadMinima ?? props.herramienta?.stockMinimo ?? 0);
const stockMaximo = computed(() => props.herramienta?.cantidadMaxima ?? props.herramienta?.stockMaximo ?? 0);
const tipoCategoria = computed(() => props.herramienta?.tipo ?? props.herramienta?.category ?? '-');
const codigo = computed(() => props.herramienta?.codigo ?? props.herramienta?.code ?? '-');
const nombre = computed(() => props.herramienta?.nombre ?? props.herramienta?.name ?? '-');

const getEstadoStock = computed(() => {
    if (!props.herramienta) return { label: t('detalle_herramientas.estado_optimo'), severity: 'success' };
    const disponible = stockFisico.value;
    const minimo = stockMinimo.value;

    if (disponible <= 0 || disponible < minimo) {
        return { label: t('detalle_herramientas.estado_agotado'), severity: 'danger' };
    }
    if (disponible === minimo) {
        return { label: t('detalle_herramientas.estado_alerta'), severity: 'warn' };
    }
    return { label: t('detalle_herramientas.estado_optimo'), severity: 'success' };
});
</script>

<template>
  <Dialog 
    :visible="visible" 
    @update:visible="(val) => emit('update:visible', val)"
    :style="{ width: '600px' }" 
    :breakpoints="{ '1199px': '75vw', '768px': '90vw', '575px': '95vw' }"
    :header="t('detalle_herramientas.titulo')" 
    :modal="true" 
    class="modal-oscuro" 
    dismissableMask
  >
    <div v-if="herramienta" class="flex flex-column gap-3 pt-2">
      <!-- Encabezado Principal -->
      <div class="flex flex-column sm:flex-row align-items-center sm:align-items-start gap-3 p-3 border-round contenedor-resumen">
        <div class="flex-shrink-0">
          <img 
            v-if="herramienta.imagen" 
            :src="herramienta.imagen" 
            :alt="nombre"
            class="shadow-2 border-round object-cover" 
            style="width: 90px; height: 90px;" 
          />
          <div v-else class="flex align-items-center justify-content-center border-round fondo-imagen-vacia" style="width: 90px; height: 90px;">
            <i class="pi pi-box text-4xl icono-vacio"></i>
          </div>
        </div>

        <div class="flex flex-column gap-2 w-full text-center sm:text-left">
          <div class="flex flex-wrap align-items-center justify-content-center sm:justify-content-start gap-2">
            <Tag :value="codigo" severity="secondary" class="font-mono text-xs" />
            <Tag :value="getEstadoStock.label" :severity="getEstadoStock.severity" />
            <Tag v-if="herramienta.esDesechable" :value="t('detalle_herramientas.consumible')" severity="info" icon="pi pi-refresh" />
          </div>
          <h3 class="m-0 text-xl font-bold label-blanco">{{ nombre }}</h3>
          <p class="m-0 text-xs text-subtitulo">{{ herramienta.descripcion || t('detalle_herramientas.sin_descripcion') }}</p>
        </div>
      </div>

      <!-- Datos Logísticos -->
      <div class="grid text-xs m-0">
        <div class="col-6 sm:col-3 mb-2 p-2">
          <span class="block text-subtitulo font-semibold mb-1">{{ t('detalle_herramientas.categoria') }}</span>
          <span class="label-blanco font-medium">{{ tipoCategoria }}</span>
        </div>

        <div class="col-6 sm:col-3 mb-2 p-2">
          <span class="block text-subtitulo font-semibold mb-1">{{ t('detalle_herramientas.marca') }}</span>
          <span class="label-blanco font-medium">{{ herramienta.marca || '-' }}</span>
        </div>

        <div class="col-6 sm:col-3 mb-2 p-2">
          <span class="block text-subtitulo font-semibold mb-1">{{ t('detalle_herramientas.ubicacion') }}</span>
          <span class="label-blanco font-medium">{{ herramienta.ubicacion || '-' }}</span>
        </div>

        <div class="col-6 sm:col-3 mb-2 p-2">
          <span class="block text-subtitulo font-semibold mb-1">{{ t('detalle_herramientas.estado_logico') }}</span>
          <span class="label-blanco font-medium">{{ herramienta.activo !== false ? 'Activo' : 'Inactivo' }}</span>
        </div>
      </div>

      <!-- Niveles de Stock -->
      <div class="p-3 border-round contenedor-resumen">
        <h4 class="m-0 mb-2 text-xs uppercase font-bold text-subtitulo tracking-wider">{{ t('detalle_herramientas.seccion_stock') }}</h4>
        <div class="grid text-center m-0">
          <div class="col-4 border-right-1 surface-border p-2">
            <span class="block text-xs text-subtitulo">{{ t('detalle_herramientas.stock_min') }}</span>
            <span class="text-lg font-bold text-yellow-500">{{ stockMinimo }}</span>
          </div>
          <div class="col-4 border-right-1 surface-border p-2">
            <span class="block text-xs text-subtitulo">{{ t('detalle_herramientas.stock_fisico') }}</span>
            <span class="text-xl font-black label-blanco">{{ stockFisico }}</span>
          </div>
          <div class="col-4 p-2">
            <span class="block text-xs text-subtitulo">{{ t('detalle_herramientas.stock_max') }}</span>
            <span class="text-lg font-bold text-green-500">{{ stockMaximo }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-content-end gap-2 mt-2">
        <Button 
          :label="t('detalle_herramientas.btn_editar')" 
          icon="pi pi-pencil" 
          class="btn-nuevo text-xs" 
          @click="emit('editar', herramienta); cerrar()" 
        />
        <Button 
          :label="t('detalle_herramientas.btn_cerrar')" 
          icon="pi pi-times" 
          class="btn-cancelar text-xs" 
          @click="cerrar" 
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
/* ESTILOS TEMA OSCURO (Por defecto) */
.contenedor-resumen {
    background-color: #1a222d;
    border: 1px solid #2d3748;
}

.text-subtitulo {
    color: #94a3b8;
}

.label-blanco {
    color: #f8fafc;
}

.fondo-imagen-vacia {
    background-color: #121820;
    border: 1px dashed #4a5568;
}

.icono-vacio {
    color: #4a5568;
}

/* ESTILOS ADAPTATIVOS TEMA CLARO */
:global(html.light-theme) .contenedor-resumen {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
}

:global(html.light-theme) .text-subtitulo {
    color: #64748b;
}

:global(html.light-theme) .label-blanco {
    color: #0f172a;
}

:global(html.light-theme) .fondo-imagen-vacia {
    background-color: #f1f5f9;
    border: 1px dashed #cbd5e1;
}

:global(html.light-theme) .icono-vacio {
    color: #94a3b8;
}
</style>