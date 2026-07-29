<script setup>
import { ref } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';

const props = defineProps({
    visible: Boolean,
    herramienta: Object,
    esEdicion: Boolean
});

const emit = defineEmits(['update:visible', 'guardar']);

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
    :header="esEdicion ? 'Editar Herramienta' : 'Nueva Herramienta'" 
    :modal="true" 
  >
    <div class="flex flex-column gap-2 mb-4">
      <label for="foto-herramienta" class="font-bold">Fotografía</label>
      <div class="flex align-items-center gap-4">
          <img v-if="herramienta.imagen" :src="herramienta.imagen" class="shadow-2 border-round" style="width: 80px; height: 80px; object-fit: cover;" />
          <div v-else class="flex align-items-center justify-content-center surface-200 border-round" style="width: 80px; height: 80px;">
              <i class="pi pi-image text-4xl text-500"></i>
          </div>
          
          <div class="flex flex-column gap-2 w-full">
              <input 
                  ref="fileInputRef" 
                  id="foto-herramienta" 
                  name="foto-herramienta" 
                  type="file" 
                  accept="image/*" 
                  @change="procesarImagen" 
                  class="p-inputtext p-component p-2 w-full" 
              />
              <!-- Botón para quitar la imagen si ya tiene una asignada -->
              <Button 
                  v-if="herramienta.imagen" 
                  type="button" 
                  label="Quitar imagen" 
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
      <label for="codigo" class="font-bold">Código</label>
      <InputText id="codigo" name="codigo" v-model="herramienta.codigo" required autofocus placeholder="Ej. TL-001" autocomplete="off" />
    </div>

    <div class="flex flex-column gap-2 mb-3">
      <label for="nombre" class="font-bold">Nombre</label>
      <InputText id="nombre" name="nombre" v-model="herramienta.nombre" required placeholder="Ej. Taladro Percutor 20V" autocomplete="off" />
    </div>

    <div class="formgrid grid mb-3">
      <div class="col flex flex-column gap-2">
        <label for="tipo" class="font-bold">Tipo / Categoría</label>
        <InputText id="tipo" name="tipo" v-model="herramienta.tipo" placeholder="Ej. Eléctrica" autocomplete="off" />
      </div>
      <div class="col flex flex-column gap-2">
        <label for="ubicacion" class="font-bold">Ubicación</label>
        <InputText id="ubicacion" name="ubicacion" v-model="herramienta.ubicacion" placeholder="Ej. Gabinete A" autocomplete="off" />
      </div>
    </div>

    <div class="flex flex-column gap-2 mb-3">
      <label for="marca" class="font-bold">Marca / Proveedor</label>
      <InputText id="marca" name="marca" v-model="herramienta.marca" placeholder="Ej. DeWalt, Truper..." autocomplete="off" />
    </div>

    <div class="flex flex-column gap-2 mb-3">
      <label for="descripcion" class="font-bold">Descripción / Detalles</label>
      <Textarea id="descripcion" name="descripcion" v-model="herramienta.descripcion" rows="3" placeholder="Especificaciones, notas, cuidados especiales..." />
    </div>

    <div class="formgrid grid mb-4">
      <div class="col flex flex-column gap-2">
        <label for="cantidadMinima" class="font-bold">Stock Mínimo</label>
        <InputNumber inputId="cantidadMinima" name="cantidadMinima" v-model="herramienta.cantidadMinima" integeronly />
      </div>
      <div class="col flex flex-column gap-2">
        <label for="cantidadDisponible" class="font-bold">Stock Físico</label>
        <InputNumber inputId="cantidadDisponible" name="cantidadDisponible" v-model="herramienta.cantidadDisponible" integeronly />
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" icon="pi pi-times" text @click="cerrar" />
      <Button label="Guardar" icon="pi pi-check" @click="guardar" />
    </template>
  </Dialog>
</template>