<script setup>
import { ref } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import ToggleSwitch from 'primevue/toggleswitch';
import Button from 'primevue/button';
import { useI18n } from 'vue-i18n'; 

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    herramienta: {
        type: Object,
        default: () => ({})
    },
    esEdicion: {
        type: Boolean,
        default: false
    }
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
        console.warn("El archivo seleccionado no es una imagen válida.");
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
        
        img.onerror = () => console.error("Error al procesar la imagen en memoria.");
        img.src = e.target.result;
    };
    
    lector.onerror = () => console.error("Error al leer el archivo desde el dispositivo.");
    lector.readAsDataURL(archivo);
};
</script>

<template>
  <Dialog 
    :visible="visible" 
    @update:visible="(val) => emit('update:visible', val)"
    :style="{width: '600px'}" 
    :breakpoints="{ '1199px': '75vw', '768px': '90vw', '575px': '95vw' }"
    :header="esEdicion ? (t('formulario_herramientas.titulo_editar') || 'Editar Herramienta') : (t('formulario_herramientas.titulo_nueva') || 'Nueva Herramienta')" 
    :modal="true" 
    class="modal-oscuro" 
    dismissableMask
  >
    <!-- Fotografía -->
    <div class="flex flex-column gap-2 mb-4 pt-2">
      <label for="foto-herramienta" class="label-blanco font-bold">{{ t('formulario_herramientas.fotografia') || 'Fotografía' }}</label>
      <div class="flex align-items-center gap-4">
          <img 
            v-if="herramienta.imagen" 
            :src="herramienta.imagen" 
            alt="Vista previa de la herramienta"
            class="shadow-2 border-round" 
            style="width: 80px; height: 80px; object-fit: cover;" 
          />
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
                  class="w-full input-archivo-tema" 
              />
              <Button 
                  v-if="herramienta.imagen" 
                  type="button" 
                  :label="t('formulario_herramientas.btn_quitar_imagen') || 'Quitar Imagen'" 
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

    <!-- Código y Nombre -->
    <div class="flex flex-column gap-2 mb-3">
      <label for="codigo" class="label-blanco font-bold">{{ t('formulario_herramientas.codigo') || 'Código' }} *</label>
      <InputText id="codigo" name="codigo" v-model="herramienta.codigo" required autofocus :placeholder="t('formulario_herramientas.ph_codigo') || 'Ej: HERR-001'" autocomplete="off" class="w-full input-oscuro" />
    </div>

    <div class="flex flex-column gap-2 mb-3">
      <label for="nombre" class="label-blanco font-bold">{{ t('formulario_herramientas.nombre') || 'Nombre' }} *</label>
      <InputText id="nombre" name="nombre" v-model="herramienta.nombre" required :placeholder="t('formulario_herramientas.ph_nombre') || 'Ej: Taladro Percutor'" autocomplete="off" class="w-full input-oscuro" />
    </div>

    <!-- Categoría y Ubicación -->
    <div class="formgrid grid mb-3">
      <div class="col flex flex-column gap-2">
        <label for="tipo" class="label-blanco font-bold">{{ t('formulario_herramientas.tipo') || 'Categoría' }}</label>
        <InputText id="tipo" name="tipo" v-model="herramienta.tipo" :placeholder="t('formulario_herramientas.ph_tipo') || 'Ej: Eléctrica'" autocomplete="off" class="w-full input-oscuro" />
      </div>
      <div class="col flex flex-column gap-2">
        <label for="ubicacion" class="label-blanco font-bold">{{ t('formulario_herramientas.ubicacion') || 'Ubicación' }}</label>
        <InputText id="ubicacion" name="ubicacion" v-model="herramienta.ubicacion" :placeholder="t('formulario_herramientas.ph_ubicacion') || 'Ej: Estante A1'" autocomplete="off" class="w-full input-oscuro" />
      </div>
    </div>

    <!-- Marca -->
    <div class="flex flex-column gap-2 mb-3">
      <label for="marca" class="label-blanco font-bold">{{ t('formulario_herramientas.marca') || 'Marca' }}</label>
      <InputText id="marca" name="marca" v-model="herramienta.marca" :placeholder="t('formulario_herramientas.ph_marca') || 'Ej: Bosch'" autocomplete="off" class="w-full input-oscuro" />
    </div>

    <!-- Descripción -->
    <div class="flex flex-column gap-2 mb-3">
      <label for="descripcion" class="label-blanco font-bold">{{ t('formulario_herramientas.descripcion') || 'Descripción' }}</label>
      <Textarea id="descripcion" name="descripcion" v-model="herramienta.descripcion" rows="3" :placeholder="t('formulario_herramientas.ph_descripcion') || 'Descripción breve...'" class="w-full input-oscuro" />
    </div>

    <!-- Mínimo, Máximo y Físico -->
    <div class="formgrid grid mb-3">
      <div class="col-12 md:col-4 flex flex-column gap-2">
        <label for="cantidadMinima" class="label-blanco font-bold">{{ t('formulario_herramientas.stock_minimo') || 'Stock Mín' }}</label>
        <InputNumber inputId="cantidadMinima" name="cantidadMinima" v-model="herramienta.cantidadMinima" :min="0" integeronly class="w-full" inputClass="w-full input-oscuro text-center" />
      </div>
      <div class="col-12 md:col-4 flex flex-column gap-2">
        <label for="cantidadMaxima" class="label-blanco font-bold">{{ t('formulario_herramientas.stock_maximo') || 'Stock Máx' }}</label>
        <InputNumber inputId="cantidadMaxima" name="cantidadMaxima" v-model="herramienta.cantidadMaxima" :min="0" integeronly class="w-full" inputClass="w-full input-oscuro text-center" />
      </div>
      <div class="col-12 md:col-4 flex flex-column gap-2">
        <label for="cantidadDisponible" class="label-blanco font-bold">{{ t('formulario_herramientas.stock_fisico') || 'Stock Físico' }}</label>
        <InputNumber inputId="cantidadDisponible" name="cantidadDisponible" v-model="herramienta.cantidadDisponible" :min="0" integeronly class="w-full" inputClass="w-full input-oscuro text-center" />
      </div>
    </div>

    <!-- Desechable / Consumible -->
    <div class="flex align-items-center gap-3 mb-4 py-2 border-top-1 surface-border">
      <ToggleSwitch id="esDesechable" v-model="herramienta.esDesechable" />
      <label for="esDesechable" class="label-blanco font-bold cursor-pointer text-sm">
        {{ t('formulario_herramientas.es_desechable') || 'Es Material Consumible / Desechable' }}
      </label>
    </div>

    <template #footer>
      <div class="flex justify-content-end gap-2 mt-3 pt-2">
          <Button :label="t('formulario_herramientas.btn_cancelar') || 'Cancelar'" icon="pi pi-times" class="btn-cancelar" @click="cerrar" />
          <Button :label="t('formulario_herramientas.btn_guardar') || 'Guardar'" icon="pi pi-check" class="btn-nuevo font-bold" @click="guardar" />
      </div>
    </template>
  </Dialog>
</template>

<style>
/* TEMA OSCURO (Por Defecto) */
.modal-oscuro .input-archivo-tema {
    background-color: #121820;
    color: #94a3b8;
    border: 1px solid #4a5568;
    border-radius: 6px;
    padding: 0.5rem;
    font-family: inherit;
    outline: none;
}

.modal-oscuro .input-archivo-tema::file-selector-button {
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
.modal-oscuro .input-archivo-tema::file-selector-button:hover {
    background-color: #3f4b5b;
}

.modal-oscuro .fondo-imagen-vacia {
    background-color: #121820;
    border: 1px dashed #4a5568;
}
.modal-oscuro .icono-vacio {
    color: #4a5568;
}

/* TEMA CLARO (Sobreescritura Dinámica) */
html.light-theme .modal-oscuro .input-archivo-tema {
    background-color: #ffffff;
    color: #334155;
    border: 1px solid #cbd5e1;
}

html.light-theme .modal-oscuro .input-archivo-tema::file-selector-button {
    background-color: #f1f5f9;
    color: #0f172a;
    border: 1px solid #cbd5e1;
}

html.light-theme .modal-oscuro .input-archivo-tema::file-selector-button:hover {
    background-color: #e2e8f0;
}

html.light-theme .modal-oscuro .fondo-imagen-vacia {
    background-color: #f8fafc;
    border: 1px dashed #cbd5e1;
}
html.light-theme .modal-oscuro .icono-vacio {
    color: #94a3b8;
}
</style>