<script setup>
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast'; 
import { comprimirImagenWebP } from '@/utils/imageHelper';

const props = defineProps({
    cargando: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['guardar', 'error', 'limpiar-mensajes']);
const toast = useToast(); 

const formularioBasico = {
    codigo: '', nombre: '', tipo: '', ubicacion: '',
    marca: '', descripcion: '', cantidadMinima: 1,
    cantidadDisponible: 1, imagen: null
};

const herramienta = ref({ ...formularioBasico });
const camposInvalidos = ref(false); 

// =====================================================================
// Procesamiento y Optimización de Imagen (Usando el Helper)
// =====================================================================
const procesarImagen = async (evento) => {
    const archivo = evento.target.files[0];
    if (!archivo) return;

    try {
        // Le pasamos el archivo al helper y esperamos que nos devuelva el Base64 listo
        herramienta.value.imagen = await comprimirImagenWebP(archivo);
    } catch (mensajeError) {
        // Si la imagen es muy pesada o no es válida, el helper nos manda el error aquí
        toast.add({ severity: 'error', summary: 'Error de Imagen', detail: mensajeError, life: 5000 });
        evento.target.value = ''; // Limpiamos el input
    }
};

const limpiar = () => {
    herramienta.value = { ...formularioBasico };
    camposInvalidos.value = false; 
    emit('limpiar-mensajes');
};

const intentarGuardar = () => {
    emit('limpiar-mensajes');
    
    // VALIDACIÓN DIRECTA Y VISUAL
    if (!herramienta.value.codigo?.trim() || !herramienta.value.nombre?.trim()) {
        camposInvalidos.value = true; // Activa los bordes rojos en el HTML
        toast.add({ 
            severity: 'warn', 
            summary: 'Campos Obligatorios', 
            detail: 'El Código y el Nombre son obligatorios para registrar el producto.', 
            life: 4000 
        });
        return; // Detiene la ejecución
    }
    
    camposInvalidos.value = false; // Quita los bordes rojos si todo está bien
    emit('guardar', { ...herramienta.value });
};

defineExpose({ limpiar });
</script>

<template>
    <div class="p-3 md:p-4 border-round">
        <div class="grid formgrid p-fluid">
            
            <div class="col-12 lg:col-8 grid m-0 p-0">
                <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                    <label for="codigoProducto" class="font-bold label-oscura">Código *</label>
                    <InputText 
                        id="codigoProducto" 
                        name="codigoProducto" 
                        v-model="herramienta.codigo" 
                        required 
                        placeholder="Código único del producto" 
                        autocomplete="off" 
                        :class="{'p-invalid': camposInvalidos && !herramienta.codigo?.trim()}" 
                    />
                </div>
                
                <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                    <label for="nombreProducto" class="font-bold label-oscura">Nombre *</label>
                    <InputText 
                        id="nombreProducto" 
                        name="nombreProducto" 
                        v-model="herramienta.nombre" 
                        required 
                        placeholder="Nombre del producto" 
                        autocomplete="off" 
                        :class="{'p-invalid': camposInvalidos && !herramienta.nombre?.trim()}"
                    />
                </div>

                <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                    <label for="tipoProducto" class="font-bold label-oscura">Tipo / Categoría</label>
                    <InputText id="tipoProducto" name="tipoProducto" v-model="herramienta.tipo" placeholder="Ej. Eléctrica" autocomplete="off" />
                </div>

                <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                    <label for="marcaProducto" class="font-bold label-oscura">Marca / Proveedor</label>
                    <InputText id="marcaProducto" name="marcaProducto" v-model="herramienta.marca" placeholder="Ej. Truper" autocomplete="off" />
                </div>

                <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                    <label for="stockFisico" class="font-bold label-oscura">Stock Físico Inicial</label>
                    <InputNumber inputId="stockFisico" name="stockFisico" v-model="herramienta.cantidadDisponible" integeronly />
                </div>

                <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                    <label for="stockMinimo" class="font-bold label-oscura">Stock Mínimo (Alerta)</label>
                    <InputNumber inputId="stockMinimo" name="stockMinimo" v-model="herramienta.cantidadMinima" integeronly />
                </div>

                <div class="col-12 mb-3 flex flex-column gap-2">
                    <label for="ubicacionFisica" class="font-bold label-oscura">Ubicación Física</label>
                    <InputText id="ubicacionFisica" name="ubicacionFisica" v-model="herramienta.ubicacion" placeholder="Ej. Gabinete A" autocomplete="off" />
                </div>
            </div>

            <div class="col-12 lg:col-4 mb-3 flex flex-column gap-2">
                <label for="inputFileImagen" class="font-bold label-oscura">Fotografía</label>
                <div class="area-imagen flex flex-column align-items-center justify-content-center p-3 border-round shadow-1 w-full h-full" style="min-height: 250px;">
                    
                    <img v-if="herramienta.imagen" 
                         :src="herramienta.imagen" 
                         class="shadow-2 border-round mb-3" 
                         style="width: 100%; max-height: 240px; object-fit: contain; background-color: #121820;" />
                    
                    <div v-else class="placeholder-imagen flex align-items-center justify-content-center border-round mb-3" style="width: 100%; height: 240px;">
                        <i class="pi pi-image text-6xl" style="color: #4a5568;"></i>
                    </div>
                    
                    <input 
                        id="inputFileImagen" 
                        name="inputFileImagen"
                        type="file" 
                        accept="image/*" 
                        capture="environment"
                        @change="procesarImagen" 
                        class="p-inputtext p-component p-2 w-full text-sm mt-auto input-file-oscuro" 
                    />
                </div>
            </div>

            <!-- Descripción -->
            <div class="col-12 mb-4 flex flex-column gap-2">
                <label for="descripcionProducto" class="font-bold label-oscura">Descripción / Detalles</label>
                <Textarea id="descripcionProducto" name="descripcionProducto" v-model="herramienta.descripcion" rows="3" placeholder="Especificaciones adicionales..." />
            </div>
            
            <!-- Botones de Acción -->
            <div class="col-12 flex flex-column sm:flex-row gap-3 mt-2">
                <Button label="Registrar Producto" icon="pi pi-check" @click="intentarGuardar" :loading="cargando" class="btn-registrar w-full sm:w-auto" />
                <Button label="Limpiar" icon="pi pi-eraser" severity="secondary" @click="limpiar" class="btn-limpiar w-full sm:w-auto" />
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

/* ESTILO PARA LOS BORDES ROJOS CUANDO HAY ERROR */
:deep(.p-invalid) {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 1px #ef4444 !important;
}

.input-file-oscuro { background-color: #121820 !important; color: #ffffff !important; border: 1px solid #4a5568 !important; border-radius: 6px; cursor: pointer; }
.area-imagen { background-color: #1e252d !important; border: 1px solid #3f4b5b !important; }
.placeholder-imagen { background-color: #121820 !important; border: 1px dashed #4a5568 !important; }

.btn-registrar { background-color: #22c55e !important; border: none !important; padding: 0.75rem 1.5rem !important; color: #000000 !important; font-weight: bold; }
.btn-registrar:hover { background-color: #16a34a !important; }
.btn-limpiar { background-color: #4a5568 !important; border: none !important; padding: 0.75rem 1.5rem !important; color: white !important; }
.btn-limpiar:hover { background-color: #3f4b5b !important; }
</style>