<script setup>
import { ref } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import { useI18n } from 'vue-i18n'; 

const props = defineProps({
    visible: Boolean,
    herramienta: Object,
    esEdicion: Boolean
});

const emit = defineEmits(['update:visible', 'guardar']);

const { t } = useI18n();

const fileInputRef = ref(null);

const cerrar = () => emit('update:visible', false);
const guardar = () => emit('guardar');

// Función para eliminar la imagen actual
const quitarImagen = () => {
    props.herramienta.imagen = null;
    if (fileInputRef.value) {
        fileInputRef.value.value = ''; // Limpia el selector de archivos
    }
};

// =====================================================================
// Procesamiento y Optimización de Imagen (WebP)
// =====================================================================
const procesarImagen = (evento) => {
    const archivo = evento.target.files[0];
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
        return;
    }

    const lector = new FileReader();
    lector.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const MAX_WIDTH = 800;
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);

            const webpBase64 = canvas.toDataURL('image/webp', 0.8);
            props.herramienta.imagen = webpBase64;
        };
        
        img.src = e.target.result;
    };
    lector.readAsDataURL(archivo);
};
</script>

<template>
  <Dialog 
    :visible="visible" 
    @update:visible="(val) => emit('update:visible', val)"
    :style="{width: '600px'}" 
    :header="esEdicion ? t('formulario_herramientas.titulo_editar') : t('formulario_herramientas.titulo_nueva')" 
    :modal="true" 
    class="modal-oscuro" 
    dismissableMask
  >
    <!-- Contenido del Modal -->
    <div class="flex flex-column gap-2 mb-4 pt-2">
      <label for="foto-herramienta" class="label-blanco">{{ t('formulario_herramientas.fotografia') }}</label>
      <div class="flex align-items-center gap-4">
          <img v-if="herramienta.imagen" :src="herramienta.imagen" class="shadow-2 border-round" style="width: 80px; height: 80px; object-fit: cover;" />
          <div v-else class="flex align-items-center justify-content-center border-round fondo-imagen-vacia" style="width: 80px; height: 80px;">
              <i class="pi pi-image text-4xl icono-vacio"></i>
          </div>
          
          <div class="flex flex-column gap-2 w-full">
              <input 
                  ref="fileInputRef" 
                  id="foto-herramienta" 
                  name="foto-herramienta" 
                  type="file" 
                  accept="image/*" 
                  @change="procesarImagen" 
                  class="w-full input-archivo-oscuro" 
              />
              <Button 
                  v-if="herramienta.imagen" 
                  type="button" 
                  :label="t('formulario_herramientas.btn_quitar_imagen')" 
                  icon="pi pi-trash" 
                  severity="danger" 
                  size="small" 
                  outlined 
                  class="w-auto align-self-start py-1 px-2 text-xs"
                  @click="quitarImagen" 
              />
          </div>
      </div>
    </div>

    <div class="flex flex-column gap-2 mb-3">
      <label for="codigo" class="label-blanco">{{ t('formulario_herramientas.codigo') }}</label>
      <InputText id="codigo" name="codigo" v-model="herramienta.codigo" required autofocus :placeholder="t('formulario_herramientas.ph_codigo')" autocomplete="off" class="w-full input-oscuro" />
    </div>

    <div class="flex flex-column gap-2 mb-3">
      <label for="nombre" class="label-blanco">{{ t('formulario_herramientas.nombre') }}</label>
      <InputText id="nombre" name="nombre" v-model="herramienta.nombre" required :placeholder="t('formulario_herramientas.ph_nombre')" autocomplete="off" class="w-full input-oscuro" />
    </div>

    <div class="formgrid grid mb-3">
      <div class="col flex flex-column gap-2">
        <label for="tipo" class="label-blanco">{{ t('formulario_herramientas.tipo') }}</label>
        <InputText id="tipo" name="tipo" v-model="herramienta.tipo" :placeholder="t('formulario_herramientas.ph_tipo')" autocomplete="off" class="w-full input-oscuro" />
      </div>
      <div class="col flex flex-column gap-2">
        <label for="ubicacion" class="label-blanco">{{ t('formulario_herramientas.ubicacion') }}</label>
        <InputText id="ubicacion" name="ubicacion" v-model="herramienta.ubicacion" :placeholder="t('formulario_herramientas.ph_ubicacion')" autocomplete="off" class="w-full input-oscuro" />
      </div>
    </div>

    <div class="flex flex-column gap-2 mb-3">
      <label for="marca" class="label-blanco">{{ t('formulario_herramientas.marca') }}</label>
      <InputText id="marca" name="marca" v-model="herramienta.marca" :placeholder="t('formulario_herramientas.ph_marca')" autocomplete="off" class="w-full input-oscuro" />
    </div>

    <div class="flex flex-column gap-2 mb-3">
      <label for="descripcion" class="label-blanco">{{ t('formulario_herramientas.descripcion') }}</label>
      <Textarea id="descripcion" name="descripcion" v-model="herramienta.descripcion" rows="3" :placeholder="t('formulario_herramientas.ph_descripcion')" class="w-full input-oscuro" />
    </div>

    <div class="formgrid grid mb-4">
      <div class="col-12 md:col-4 flex flex-column gap-2">
        <label for="cantidadMinima" class="label-blanco">{{ t('formulario_herramientas.stock_minimo') }}</label>
        <InputNumber inputId="cantidadMinima" name="cantidadMinima" v-model="herramienta.cantidadMinima" integeronly class="w-full" inputClass="w-full input-oscuro" />
      </div>
      <div class="col-12 md:col-4 flex flex-column gap-2">
        <label for="cantidadMaxima" class="label-blanco">{{ t('formulario_herramientas.stock_maximo', 'Stock Máximo') }}</label>
        <InputNumber inputId="cantidadMaxima" name="cantidadMaxima" v-model="herramienta.cantidadMaxima" integeronly class="w-full" inputClass="w-full input-oscuro" />
      </div>
      <div class="col-12 md:col-4 flex flex-column gap-2">
        <label for="cantidadDisponible" class="label-blanco">{{ t('formulario_herramientas.stock_fisico') }}</label>
        <InputNumber inputId="cantidadDisponible" name="cantidadDisponible" v-model="herramienta.cantidadDisponible" integeronly class="w-full" inputClass="w-full input-oscuro" />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-content-end gap-2 mt-3">
          <Button :label="t('formulario_herramientas.btn_cancelar')" icon="pi pi-times" class="btn-cancelar" @click="cerrar" />
          <Button :label="t('formulario_herramientas.btn_guardar')" icon="pi pi-check" class="btn-nuevo" @click="guardar" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
/* =========================================================
   ELEMENTOS EXCLUSIVOS DE ESTE COMPONENTE
   ========================================================= */

/* Input Tipo File Nativo (Subida de Imagen) */
.input-archivo-oscuro {
    background-color: #121820 !important;
    color: #94a3b8 !important;
    border: 1px solid #4a5568 !important;
    border-radius: 6px;
    padding: 0.5rem;
    font-family: inherit;
}

/* Estilo para el botón interno del Input File ("Choose File") */
.input-archivo-oscuro::file-selector-button {
    background-color: #313a46;
    color: #ffffff;
    border: 1px solid #4a5568;
    border-radius: 4px;
    padding: 0.4rem 0.8rem;
    cursor: pointer;
    margin-right: 1rem;
    transition: background-color 0.2s;
    font-weight: 600;
}
.input-archivo-oscuro::file-selector-button:hover {
    background-color: #3f4b5b;
}

/* Placeholder cuando no hay imagen seleccionada */
.fondo-imagen-vacia {
    background-color: #121820 !important;
    border: 1px dashed #4a5568 !important;
}
.icono-vacio {
    color: #4a5568 !important;
}
</style>