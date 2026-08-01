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
    class="modal-oscuro-formulario"
    dismissableMask
  >
    <!-- Contenido del Modal -->
    <div class="flex flex-column gap-2 mb-4 pt-2">
      <label for="foto-herramienta" class="label-blanca">Fotografía</label>
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
      <label for="codigo" class="label-blanca">Código</label>
      <InputText id="codigo" name="codigo" v-model="herramienta.codigo" required autofocus placeholder="Ej. TL-001" autocomplete="off" class="w-full input-oscuro" />
    </div>

    <div class="flex flex-column gap-2 mb-3">
      <label for="nombre" class="label-blanca">Nombre</label>
      <InputText id="nombre" name="nombre" v-model="herramienta.nombre" required placeholder="Ej. Taladro Percutor 20V" autocomplete="off" class="w-full input-oscuro" />
    </div>

    <div class="formgrid grid mb-3">
      <div class="col flex flex-column gap-2">
        <label for="tipo" class="label-blanca">Tipo / Categoría</label>
        <InputText id="tipo" name="tipo" v-model="herramienta.tipo" placeholder="Ej. Eléctrica" autocomplete="off" class="w-full input-oscuro" />
      </div>
      <div class="col flex flex-column gap-2">
        <label for="ubicacion" class="label-blanca">Ubicación</label>
        <InputText id="ubicacion" name="ubicacion" v-model="herramienta.ubicacion" placeholder="Ej. Gabinete A" autocomplete="off" class="w-full input-oscuro" />
      </div>
    </div>

    <div class="flex flex-column gap-2 mb-3">
      <label for="marca" class="label-blanca">Marca / Proveedor</label>
      <InputText id="marca" name="marca" v-model="herramienta.marca" placeholder="Ej. DeWalt, Truper..." autocomplete="off" class="w-full input-oscuro" />
    </div>

    <div class="flex flex-column gap-2 mb-3">
      <label for="descripcion" class="label-blanca">Descripción / Detalles</label>
      <Textarea id="descripcion" name="descripcion" v-model="herramienta.descripcion" rows="3" placeholder="Especificaciones, notas, cuidados especiales..." class="w-full input-oscuro" />
    </div>

    <div class="formgrid grid mb-4">
      <div class="col flex flex-column gap-2">
        <label for="cantidadMinima" class="label-blanca">Stock Mínimo</label>
        <InputNumber inputId="cantidadMinima" name="cantidadMinima" v-model="herramienta.cantidadMinima" integeronly class="w-full" inputClass="w-full input-oscuro" />
      </div>
      <div class="col flex flex-column gap-2">
        <label for="cantidadDisponible" class="label-blanca">Stock Físico</label>
        <InputNumber inputId="cantidadDisponible" name="cantidadDisponible" v-model="herramienta.cantidadDisponible" integeronly class="w-full" inputClass="w-full input-oscuro" />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-content-end gap-2 mt-3">
          <Button label="Cancelar" icon="pi pi-times" class="btn-cancelar" @click="cerrar" />
          <Button label="Guardar" icon="pi pi-check" class="btn-guardar" @click="guardar" />
      </div>
    </template>
  </Dialog>
</template>

<style>
/* =========================================================
   ESTILOS GLOBALES DEL MODAL (Sin 'scoped' por el Teleport)
   ========================================================= */

/* Contenedor Principal del Dialog */
.modal-oscuro-formulario {
    background-color: #1e252d !important;
    border: 1px solid #4a5568 !important;
    border-radius: 8px !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
}

/* Cabecera, Contenido y Pie del Dialog */
.modal-oscuro-formulario .p-dialog-header,
.modal-oscuro-formulario .p-dialog-content,
.modal-oscuro-formulario .p-dialog-footer {
    background-color: #1e252d !important;
    color: #ffffff !important;
    border: none !important;
    padding-left: 1.5rem !important;
    padding-right: 1.5rem !important;
}

.modal-oscuro-formulario .p-dialog-header {
    border-bottom: 1px solid #2a323d !important;
    padding-top: 1.5rem !important;
}

.modal-oscuro-formulario .p-dialog-footer {
    border-top: 1px solid #2a323d !important;
    padding-bottom: 1.5rem !important;
}

/* Botón 'X' de la esquina superior derecha */
.modal-oscuro-formulario .p-dialog-header-icon { color: #94a3b8 !important; }
.modal-oscuro-formulario .p-dialog-header-icon:hover {
    background-color: rgba(255, 255, 255, 0.05) !important;
    color: #ffffff !important;
}

/* =========================================================
   ELEMENTOS INTERNOS DEL FORMULARIO
   ========================================================= */

/* Etiquetas */
.modal-oscuro-formulario .label-blanca {
    color: #cbd5e1 !important;
    font-weight: 600;
}

/* Inputs de PrimeVue (Texto, Textarea, Number) */
.modal-oscuro-formulario .input-oscuro {
    background-color: #121820 !important;
    color: #ffffff !important;
    border: 1px solid #4a5568 !important;
}
.modal-oscuro-formulario .input-oscuro:focus {
    border-color: #5ab1ce !important;
    box-shadow: 0 0 0 1px #5ab1ce !important;
}
.modal-oscuro-formulario .input-oscuro::placeholder {
    color: #64748b !important;
}

/* Input Tipo File Nativo (Subida de Imagen) */
.modal-oscuro-formulario .input-archivo-oscuro {
    background-color: #121820 !important;
    color: #94a3b8 !important;
    border: 1px solid #4a5568 !important;
    border-radius: 6px;
    padding: 0.5rem;
    font-family: inherit;
}
/* Estilo para el botón interno del Input File ("Choose File") */
.modal-oscuro-formulario .input-archivo-oscuro::file-selector-button {
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
.modal-oscuro-formulario .input-archivo-oscuro::file-selector-button:hover {
    background-color: #3f4b5b;
}

/* Placeholder cuando no hay imagen seleccionada */
.modal-oscuro-formulario .fondo-imagen-vacia {
    background-color: #121820 !important;
    border: 1px dashed #4a5568 !important;
}
.modal-oscuro-formulario .icono-vacio {
    color: #4a5568 !important;
}

/* =========================================================
   BOTONES DEL FOOTER
   ========================================================= */
.modal-oscuro-formulario .btn-cancelar {
    background-color: transparent !important;
    color: #94a3b8 !important;
    border: 1px solid transparent !important;
}
.modal-oscuro-formulario .btn-cancelar:hover {
    background-color: rgba(255, 255, 255, 0.05) !important;
    color: #ffffff !important;
}

.modal-oscuro-formulario .btn-guardar {
    background-color: #3b82f6 !important; /* Azul primario */
    color: white !important;
    border: none !important;
    font-weight: bold;
}
.modal-oscuro-formulario .btn-guardar:hover {
    background-color: #2563eb !important; /* Azul más oscuro al pasar el mouse */
}
</style>