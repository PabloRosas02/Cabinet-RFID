<script setup>
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast'; 
import { useI18n } from 'vue-i18n';
import { comprimirImagenWebP } from '@/utils/imageHelper';
import VisorImagen from '@/components/common/VisorImage.vue';

const props = defineProps({
    cargando: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['guardar', 'error', 'limpiar-mensajes']);
const toast = useToast(); 
const { t } = useI18n(); 

const formularioBasico = {
    codigo: '', nombre: '', tipo: '', ubicacion: '',
    marca: '', descripcion: '', cantidadMinima: 1, cantidadMaxima: 1,
    cantidadDisponible: 1, esDesechable: false, imagen: null
};

const herramienta = ref({ ...formularioBasico });
const camposInvalidos = ref(false); 
const inputArchivoImagen = ref(null);

// =====================================================================
// Procesamiento y Optimización de Imagen
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

const removerImagen = () => {
    herramienta.value.imagen = null;
    if (inputArchivoImagen.value) {
        inputArchivoImagen.value.value = '';
    }
};

const limpiar = () => {
    herramienta.value = { ...formularioBasico };
    camposInvalidos.value = false; 
    if (inputArchivoImagen.value) {
        inputArchivoImagen.value.value = '';
    }
    emit('limpiar-mensajes');
};

const intentarGuardar = () => {
    toast.removeAllGroups();
    emit('limpiar-mensajes');
    
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

    const payload = {
        ...herramienta.value,
        cantidad_minima: herramienta.value.cantidadMinima,
        cantidad_maxima: herramienta.value.cantidadMaxima,
        cantidad_disponible: herramienta.value.cantidadDisponible,
        es_desechable: herramienta.value.esDesechable
    };

    emit('guardar', payload);
};

defineExpose({ limpiar });
</script>

<template>
    <div class="p-2 md:p-3">
        <div class="grid formgrid p-fluid">
            
            <!-- BLOQUE IZQUIERDO: Campos principales y cantidades -->
            <div class="col-12 lg:col-8 p-0">
                <div class="grid formgrid p-fluid m-0">
                    
                    <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                        <label for="codigoProducto" class="font-bold text-color">{{ t('formulario_producto.label_codigo') }}</label>
                        <InputText 
                            id="codigoProducto" 
                            name="codigoProducto" 
                            v-model="herramienta.codigo" 
                            required 
                            :placeholder="t('formulario_producto.ph_codigo')" 
                            autocomplete="off" 
                            :class="{'p-invalid': camposInvalidos && !herramienta.codigo?.trim()}" 
                        />
                    </div>
                    
                    <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                        <label for="nombreProducto" class="font-bold text-color">{{ t('formulario_producto.label_nombre') }}</label>
                        <InputText 
                            id="nombreProducto" 
                            name="nombreProducto" 
                            v-model="herramienta.nombre" 
                            required 
                            :placeholder="t('formulario_producto.ph_nombre')" 
                            autocomplete="off" 
                            :class="{'p-invalid': camposInvalidos && !herramienta.nombre?.trim()}"
                        />
                    </div>

                    <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                        <label for="tipoProducto" class="font-bold text-color">{{ t('formulario_producto.label_tipo') }}</label>
                        <InputText 
                            id="tipoProducto" 
                            name="tipoProducto" 
                            v-model="herramienta.tipo" 
                            :placeholder="t('formulario_producto.ph_tipo')" 
                            autocomplete="off" 
                        />
                    </div>

                    <div class="col-12 md:col-6 mb-3 flex flex-column gap-2">
                        <label for="marcaProducto" class="font-bold text-color">{{ t('formulario_producto.label_marca') }}</label>
                        <InputText 
                            id="marcaProducto" 
                            name="marcaProducto" 
                            v-model="herramienta.marca" 
                            :placeholder="t('formulario_producto.ph_marca')" 
                            autocomplete="off" 
                        />
                    </div>

                    <!-- Stock Físico, Mínimo y Máximo -->
                    <div class="col-4 mb-3 flex flex-column gap-2">
                        <label for="stockFisico" class="font-bold text-color text-xs sm:text-base">{{ t('formulario_producto.label_stock_fisico') }}</label>
                        <InputNumber 
                            inputId="stockFisico" 
                            name="stockFisico" 
                            v-model="herramienta.cantidadDisponible" 
                            integeronly 
                            class="w-full"
                            inputClass="w-full"
                        />
                    </div>

                    <div class="col-4 mb-3 flex flex-column gap-2">
                        <label for="stockMinimo" class="font-bold text-color text-xs sm:text-base">{{ t('formulario_producto.label_stock_minimo') }}</label>
                        <InputNumber 
                            inputId="stockMinimo" 
                            name="stockMinimo" 
                            v-model="herramienta.cantidadMinima" 
                            integeronly 
                            class="w-full"
                            inputClass="w-full"
                        />
                    </div>

                    <div class="col-4 mb-3 flex flex-column gap-2">
                        <label for="stockMaximo" class="font-bold text-color text-xs sm:text-base">{{ t('formulario_producto.label_stock_maximo', 'Stock Máximo') }}</label>
                        <InputNumber 
                            inputId="stockMaximo" 
                            name="stockMaximo" 
                            v-model="herramienta.cantidadMaxima" 
                            integeronly 
                            class="w-full"
                            inputClass="w-full"
                        />
                    </div>

                    <!-- Ubicación Física -->
                    <div class="col-12 md:col-8 mb-3 flex flex-column gap-2">
                        <label for="ubicacionFisica" class="font-bold text-color">{{ t('formulario_producto.label_ubicacion') }}</label>
                        <InputText 
                            id="ubicacionFisica" 
                            name="ubicacionFisica" 
                            v-model="herramienta.ubicacion" 
                            :placeholder="t('formulario_producto.ph_ubicacion')" 
                            autocomplete="off" 
                        />
                    </div>

                    <!-- Es Desechable -->
                    <div class="col-12 md:col-4 mb-3 flex flex-column justify-content-end pb-1">
                        <div class="flex align-items-center gap-2 border-1 surface-border p-2 border-round background-card h-full min-h-2rem">
                            <Checkbox id="esDesechable" v-model="herramienta.esDesechable" :binary="true" />
                            <label for="esDesechable" class="font-bold text-color cursor-pointer text-sm mb-0">
                                {{ t('formulario_producto.label_es_desechable', 'Es Desechable') }}
                            </label>
                        </div>
                    </div>

                </div>
            </div>

            <!-- BLOQUE DERECHO: Fotografía -->
            <div class="col-12 lg:col-4 mb-3 flex flex-column gap-2 pl-0 lg:pl-3">
                <label for="inputFileImagen" class="font-bold text-color">{{ t('formulario_producto.label_fotografia') }}</label>
                <div class="area-imagen-dinamica flex flex-column align-items-center justify-content-between p-3 border-round border-1 surface-border w-full h-full min-h-custom">
                    
                    <VisorImagen 
                        :src="herramienta.imagen"
                        :alt="herramienta.nombre || 'Herramienta'"
                        ancho="100%"
                        alto="180px"
                        :mostrarBotonEliminar="!!herramienta.imagen"
                        @eliminar="removerImagen"
                        class="w-full mb-3"
                    />
                    
                    <input 
                        v-show="!herramienta.imagen"
                        id="inputFileImagen" 
                        name="inputFileImagen"
                        type="file" 
                        accept="image/*" 
                        capture="environment"
                        ref="inputArchivoImagen"
                        @change="procesarImagen" 
                        class="p-inputtext p-component p-2 w-full text-xs overflow-hidden input-file-dinamico" 
                    />
                </div>
            </div>

            <!-- BLOQUE INFERIOR: Descripción -->
            <div class="col-12 mb-4 flex flex-column gap-2">
                <label for="descripcionProducto" class="font-bold text-color">{{ t('formulario_producto.label_descripcion') }}</label>
                <Textarea 
                    id="descripcionProducto" 
                    name="descripcionProducto" 
                    v-model="herramienta.descripcion" 
                    rows="3" 
                    :placeholder="t('formulario_producto.ph_descripcion')" 
                    class="w-full"
                />
            </div>
            
            <!-- Botones de Acción -->
            <div class="col-12 flex flex-column sm:flex-row gap-3 mt-2">
                <Button 
                    :label="t('formulario_producto.btn_registrar')" 
                    icon="pi pi-check" 
                    @click="intentarGuardar" 
                    :loading="cargando" 
                    class="boton-anadir-verde px-4 w-full sm:w-auto" 
                />
                <Button 
                    :label="t('formulario_producto.btn_limpiar')" 
                    icon="pi pi-eraser" 
                    severity="secondary" 
                    @click="limpiar" 
                    class="btn-limpiar w-full sm:w-auto" 
                />
            </div>

        </div>
    </div>
</template>

<style scoped>
.min-h-custom {
    min-height: 280px;
}

.input-file-dinamico {
    max-width: 100%;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.background-card {
    background-color: rgba(255, 255, 255, 0.03);
}
</style>