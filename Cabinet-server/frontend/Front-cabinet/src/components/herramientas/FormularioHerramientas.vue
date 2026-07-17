<script setup>
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

const cerrar = () => emit('update:visible', false);
const guardar = () => emit('guardar');

const procesarImagen = (evento) => {
    const archivo = evento.target.files[0];
    if (archivo) {
        const lector = new FileReader();
        lector.onload = (e) => {
            props.herramienta.imagen = e.target.result;
        };
        lector.readAsDataURL(archivo);
    }
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
      <label class="font-bold">Fotografía</label>
      <div class="flex align-items-center gap-4">
          <img v-if="herramienta.imagen" :src="herramienta.imagen" class="shadow-2 border-round" style="width: 80px; height: 80px; object-fit: cover;" />
          <div v-else class="flex align-items-center justify-content-center surface-200 border-round" style="width: 80px; height: 80px;">
              <i class="pi pi-image text-4xl text-500"></i>
          </div>
          <input type="file" accept="image/*" @change="procesarImagen" class="p-inputtext p-component p-2 w-full" />
      </div>
    </div>

    <div class="flex flex-column gap-2 mb-3">
      <label for="codigo" class="font-bold">Código</label>
      <InputText id="codigo" v-model="herramienta.codigo" required autofocus placeholder="Ej. TL-001" />
    </div>

    <div class="flex flex-column gap-2 mb-3">
      <label for="nombre" class="font-bold">Nombre</label>
      <InputText id="nombre" v-model="herramienta.nombre" required placeholder="Ej. Taladro Percutor 20V" />
    </div>

    <div class="formgrid grid mb-3">
      <div class="col flex flex-column gap-2">
        <label for="tipo" class="font-bold">Tipo / Categoría</label>
        <InputText id="tipo" v-model="herramienta.tipo" placeholder="Ej. Eléctrica" />
      </div>
      <div class="col flex flex-column gap-2">
        <label for="ubicacion" class="font-bold">Ubicación</label>
        <InputText id="ubicacion" v-model="herramienta.ubicacion" placeholder="Ej. Gabinete A" />
      </div>
    </div>

    <div class="flex flex-column gap-2 mb-3">
      <label for="marca" class="font-bold">Marca / Proveedor</label>
      <InputText id="marca" v-model="herramienta.marca" placeholder="Ej. DeWalt, Truper..." />
    </div>

    <div class="flex flex-column gap-2 mb-3">
      <label for="descripcion" class="font-bold">Descripción / Detalles</label>
      <Textarea id="descripcion" v-model="herramienta.descripcion" rows="3" placeholder="Especificaciones, notas, cuidados especiales..." />
    </div>

    <div class="formgrid grid mb-4">
      <div class="col flex flex-column gap-2">
        <label for="cantidadMinima" class="font-bold">Stock Mínimo</label>
        <InputNumber id="cantidadMinima" v-model="herramienta.cantidadMinima" integeronly />
      </div>
      <div class="col flex flex-column gap-2">
        <label for="cantidadDisponible" class="font-bold">Stock Físico</label>
        <InputNumber id="cantidadDisponible" v-model="herramienta.cantidadDisponible" integeronly />
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" icon="pi pi-times" text @click="cerrar" />
      <Button label="Guardar" icon="pi pi-check" @click="guardar" />
    </template>
  </Dialog>
</template>