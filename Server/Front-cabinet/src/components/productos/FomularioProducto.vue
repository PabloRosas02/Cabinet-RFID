<script setup>
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast'; 
import { useI18n } from 'vue-i18n';
import { comprimirImagenWebP } from '@/utils/imageHelper';

const props = defineProps({
    cargando: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['guardar', 'error', 'limpiar-mensajes']);
const toast = useToast(); 
const { t } = useI18n(); 

// 1. Agregamos cantidadMaxima al objeto base
const formularioBasico = {
    codigo: '', nombre: '', tipo: '', ubicacion: '',
    marca: '', descripcion: '', cantidadMinima: 1, cantidadMaxima: null,
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
        herramienta.value.imagen = await comprimirImagenWebP(archivo);
    } catch (mensajeError) {
        toast.removeAllGroups();
        toast.add({ severity: 'error', summary: t('formulario_producto.toast_error_imagen'), detail: mensajeError, life: 5000 });
        evento.target.value = ''; 
    }
};

const limpiar = () => {
    herramienta.value = { ...formularioBasico };
    camposInvalidos.value = false; 
    emit('limpiar-mensajes');
};

const intentarGuardar = () => {
    toast.removeAllGroups();
    emit('limpiar-mensajes');
    
    // VALIDACIÓN DIRECTA Y VISUAL
    if (!herramienta.value.codigo?.trim() || !herramienta.value.nombre?.trim()) {
        camposInvalidos.value = true;
        toast.add({ 
            severity: 'warn', 
            summary: t('formulario_producto.toast_campos_obligatorios'), 
            detail: t('formulario_producto.toast_campos_detalle'), 
            life: 4000 
        });
        return; 
    }
    
    camposInvalidos.value = false;
    emit('guardar', { ...herramienta.value });
};

defineExpose({ limpiar });
</script>

<template>
    <div class="p-3 md:p-4 border-round">
        <div class="grid formgrid p-fluid">
            
            <div class="col-12 lg:col-8 grid m-0 p-0">
                <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                    <label for="codigoProducto" class="font-bold label-blanco">{{ t('formulario_producto.label_codigo') }}</label>
                    <InputText 
                        id="codigoProducto" 
                        name="codigoProducto" 
                        v-model="herramienta.codigo" 
                        required 
                        :placeholder="t('formulario_producto.ph_codigo')" 
                        autocomplete="off" 
                        class="input-oscuro"
                        :class="{'p-invalid': camposInvalidos && !herramienta.codigo?.trim()}" 
                    />
                </div>
                
                <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                    <label for="nombreProducto" class="font-bold label-blanco">{{ t('formulario_producto.label_nombre') }}</label>
                    <InputText 
                        id="nombreProducto" 
                        name="nombreProducto" 
                        v-model="herramienta.nombre" 
                        required 
                        :placeholder="t('formulario_producto.ph_nombre')" 
                        autocomplete="off" 
                        class="input-oscuro"
                        :class="{'p-invalid': camposInvalidos && !herramienta.nombre?.trim()}"
                    />
                </div>

                <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                    <label for="tipoProducto" class="font-bold label-blanco">{{ t('formulario_producto.label_tipo') }}</label>
                    <InputText id="tipoProducto" name="tipoProducto" v-model="herramienta.tipo" :placeholder="t('formulario_producto.ph_tipo')" autocomplete="off" class="input-oscuro" />
                </div>

                <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                    <label for="marcaProducto" class="font-bold label-blanco">{{ t('formulario_producto.label_marca') }}</label>
                    <InputText id="marcaProducto" name="marcaProducto" v-model="herramienta.marca" :placeholder="t('formulario_producto.ph_marca')" autocomplete="off" class="input-oscuro" />
                </div>

                <div class="col-12 md:col-4 mb-3 flex flex-column gap-2">
                    <label for="stockFisico" class="font-bold label-blanco">{{ t('formulario_producto.label_stock_fisico') }}</label>
                    <InputNumber inputId="stockFisico" name="stockFisico" v-model="herramienta.cantidadDisponible" integeronly inputClass="input-oscuro" />
                </div>

                <div class="col-12 md:col-4 mb-3 flex flex-column gap-2">
                    <label for="stockMinimo" class="font-bold label-blanco">{{ t('formulario_producto.label_stock_minimo') }}</label>
                    <InputNumber inputId="stockMinimo" name="stockMinimo" v-model="herramienta.cantidadMinima" integeronly inputClass="input-oscuro" />
                </div>

                <div class="col-12 md:col-4 mb-3 flex flex-column gap-2">
                    <label for="stockMaximo" class="font-bold label-blanco">{{ t('formulario_producto.label_stock_maximo', 'Stock Máximo') }}</label>
                    <InputNumber inputId="stockMaximo" name="stockMaximo" v-model="herramienta.cantidadMaxima" integeronly inputClass="input-oscuro" />
                </div>

                <div class="col-12 mb-3 flex flex-column gap-2">
                    <label for="ubicacionFisica" class="font-bold label-blanco">{{ t('formulario_producto.label_ubicacion') }}</label>
                    <InputText id="ubicacionFisica" name="ubicacionFisica" v-model="herramienta.ubicacion" :placeholder="t('formulario_producto.ph_ubicacion')" autocomplete="off" class="input-oscuro" />
                </div>
            </div>

            <div class="col-12 lg:col-4 mb-3 flex flex-column gap-2">
                <label for="inputFileImagen" class="font-bold label-blanco">{{ t('formulario_producto.label_fotografia') }}</label>
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
                <label for="descripcionProducto" class="font-bold label-blanco">{{ t('formulario_producto.label_descripcion') }}</label>
                <Textarea id="descripcionProducto" name="descripcionProducto" v-model="herramienta.descripcion" rows="3" :placeholder="t('formulario_producto.ph_descripcion')" class="input-oscuro" />
            </div>
            
            <!-- Botones de Acción -->
            <div class="col-12 flex flex-column sm:flex-row gap-3 mt-2">
                <Button :label="t('formulario_producto.btn_registrar')" icon="pi pi-check" @click="intentarGuardar" :loading="cargando" class="boton-anadir-verde px-4 w-full sm:w-auto" />
                <Button :label="t('formulario_producto.btn_limpiar')" icon="pi pi-eraser" severity="secondary" @click="limpiar" class="btn-limpiar w-full sm:w-auto" />
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ESTILO PARA LOS BORDES ROJOS CUANDO HAY ERROR EN EL FORMULARIO */
:deep(.p-invalid) {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 1px #ef4444 !important;
}

/* INPUT FILE ESPECÍFICO */
.input-file-oscuro { background-color: #121820 !important; color: #ffffff !important; border: 1px solid #4a5568 !important; border-radius: 6px; cursor: pointer; }
.area-imagen { background-color: #1e252d !important; border: 1px solid #3f4b5b !important; }
.placeholder-imagen { background-color: #121820 !important; border: 1px dashed #4a5568 !important; }

/* BOTÓN DE LIMPIAR */
.btn-limpiar { background-color: #4a5568 !important; border: none !important; padding: 0.75rem 1.5rem !important; color: white !important; }
.btn-limpiar:hover { background-color: #3f4b5b !important; }
</style>