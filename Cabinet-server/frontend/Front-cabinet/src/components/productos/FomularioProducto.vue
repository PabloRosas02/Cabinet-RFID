<script setup>
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';

const props = defineProps({
    cargando: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['guardar', 'error', 'limpiar-mensajes']);

const formularioBasico = {
    codigo: '', nombre: '', tipo: '', ubicacion: '',
    marca: '', descripcion: '', cantidadMinima: 1,
    cantidadDisponible: 1, imagen: null
};

const herramienta = ref({ ...formularioBasico });

const procesarImagen = (evento) => {
    const archivo = evento.target.files[0];
    if (archivo) {
        const lector = new FileReader();
        lector.onload = (e) => herramienta.value.imagen = e.target.result;
        lector.readAsDataURL(archivo);
    }
};

const limpiar = () => {
    herramienta.value = { ...formularioBasico };
    emit('limpiar-mensajes');
};

const intentarGuardar = () => {
    emit('limpiar-mensajes');
    
    if (!herramienta.value.codigo || !herramienta.value.nombre) {
        emit('error', 'El código y nombre son obligatorios.');
        return;
    }
    
    emit('guardar', { ...herramienta.value });
};

// Exponemos la función limpiar para que el padre pueda llamarla cuando el API responda con éxito
defineExpose({ limpiar });
</script>

<template>
    <div class="p-4 border-round">
        <div class="grid formgrid p-fluid">
            <!-- Columna Izquierda: Datos Principales -->
            <div class="col-12 md:col-8 grid">
                <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                    <label class="font-bold label-oscura">Código *</label>
                    <InputText v-model="herramienta.codigo" required placeholder="Código único del producto" />
                </div>
                
                <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                    <label class="font-bold label-oscura">Nombre *</label>
                    <InputText v-model="herramienta.nombre" required placeholder="Nombre del producto" />
                </div>

                <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                    <label class="font-bold label-oscura">Tipo / Categoría</label>
                    <InputText v-model="herramienta.tipo" placeholder="Ej. Eléctrica" />
                </div>

                <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                    <label class="font-bold label-oscura">Marca / Proveedor</label>
                    <InputText v-model="herramienta.marca" placeholder="Ej. Truper" />
                </div>

                <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                    <label class="font-bold label-oscura">Stock Físico Inicial</label>
                    <InputNumber v-model="herramienta.cantidadDisponible" integeronly />
                </div>

                <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                    <label class="font-bold label-oscura">Stock Mínimo (Alerta)</label>
                    <InputNumber v-model="herramienta.cantidadMinima" integeronly />
                </div>

                <div class="col-12 mb-3 flex flex-column gap-2">
                    <label class="font-bold label-oscura">Ubicación Física</label>
                    <InputText v-model="herramienta.ubicacion" placeholder="Ej. Gabinete A" />
                </div>
            </div>

            <!-- Columna Derecha: Fotografía -->
            <div class="col-12 md:col-4 mb-3 flex flex-column gap-2">
                <label class="font-bold label-oscura">Fotografía</label>
                <div class="area-imagen flex flex-column align-items-center justify-content-center p-3 border-round shadow-1 w-full h-full" style="min-height: 300px;">
                    
                    <img v-if="herramienta.imagen" 
                         :src="herramienta.imagen" 
                         class="shadow-2 border-round mb-3" 
                         style="width: 100%; height: 240px; object-fit: contain; background-color: #121820;" />
                    
                    <div v-else class="placeholder-imagen flex align-items-center justify-content-center border-round mb-3" style="width: 100%; height: 240px;">
                        <i class="pi pi-image text-6xl" style="color: #4a5568;"></i>
                    </div>
                    
                    <input type="file" accept="image/*" @change="procesarImagen" class="p-inputtext p-component p-2 w-full text-sm mt-auto input-file-oscuro" />
                </div>
            </div>

            <!-- Descripción -->
            <div class="col-12 mb-4 flex flex-column gap-2">
                <label class="font-bold label-oscura">Descripción / Detalles</label>
                <Textarea v-model="herramienta.descripcion" rows="3" placeholder="Especificaciones adicionales..." />
            </div>
            
            <!-- Botones de Acción -->
            <div class="col-12 flex gap-3 mt-2">
                <Button label="Registrar Producto" icon="pi pi-check" @click="intentarGuardar" :loading="cargando" class="btn-registrar" />
                <Button label="Limpiar" icon="pi pi-eraser" severity="secondary" @click="limpiar" class="btn-limpiar" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.label-oscura { color: #cbd5e1 !important; }

:deep(.p-inputtext), :deep(.p-inputnumber-input), :deep(.p-textarea) { 
    background-color: #121820 !important;
    color: #ffffff !important;
    border: 1px solid #4a5568 !important;
    border-radius: 6px;
}
:deep(.p-inputtext:enabled:focus), :deep(.p-inputnumber-input:enabled:focus), :deep(.p-textarea:enabled:focus) { 
    border-color: #5ab1ce !important;
    box-shadow: 0 0 0 1px #5ab1ce !important; 
}

.input-file-oscuro { background-color: #121820 !important; color: #ffffff !important; border: 1px solid #4a5568 !important; border-radius: 6px; cursor: pointer; }
.area-imagen { background-color: #1e252d !important; border: 1px solid #3f4b5b !important; }
.placeholder-imagen { background-color: #121820 !important; border: 1px dashed #4a5568 !important; }

.btn-registrar { background-color: #22c55e !important; border: none !important; padding: 0.75rem 1.5rem !important; color: #000000 !important; font-weight: bold; }
.btn-registrar:hover { background-color: #16a34a !important; }
.btn-limpiar { background-color: #4a5568 !important; border: none !important; padding: 0.75rem 1.5rem !important; color: white !important; }
.btn-limpiar:hover { background-color: #3f4b5b !important; }
</style>