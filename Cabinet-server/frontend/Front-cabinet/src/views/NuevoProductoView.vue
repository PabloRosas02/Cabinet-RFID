<script setup>
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import Message from 'primevue/message';

const cargando = ref(false);
const mensajeExito = ref(false);
const mensajeError = ref('');

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
    mensajeExito.value = false;
    mensajeError.value = '';
};

const guardarProducto = async () => {
    mensajeExito.value = false;
    mensajeError.value = '';

    if (!herramienta.value.codigo || !herramienta.value.nombre) {
        mensajeError.value = 'El código y nombre son obligatorios.';
        return;
    }

    cargando.value = true;
    try {
        const respuesta = await fetch('/api/herramientas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(herramienta.value)
        });

        if (!respuesta.ok) {
            const errorData = await respuesta.json();
            throw new Error(errorData.error || 'Error al guardar');
        }

        mensajeExito.value = true;
        // Limpiamos parcialmente, pero dejamos el mensaje visible
        setTimeout(() => {
            herramienta.value = { ...formularioBasico };
        }, 500);

    } catch (error) {
        mensajeError.value = error.message;
    } finally {
        cargando.value = false;
    }
};
</script>

<template>
  <div class="panel-nuevo-producto p-4 border-round-xl shadow-1 max-w-70rem mx-auto mt-4">
    <h2 class="text-2xl font-bold mb-4" style="color: #5ab1ce;">Registrar Nuevo Producto</h2>
    
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
                    
                    <!-- Imagen expandida pero contenida -->
                    <img v-if="herramienta.imagen" 
                         :src="herramienta.imagen" 
                         class="shadow-2 border-round mb-3" 
                         style="width: 100%; height: 240px; object-fit: contain; background-color: #121820;" />
                    
                    <!-- Cuadro oscuro cuando no hay imagen -->
                    <div v-else class="placeholder-imagen flex align-items-center justify-content-center border-round mb-3" style="width: 100%; height: 240px;">
                        <i class="pi pi-image text-6xl" style="color: #4a5568;"></i>
                    </div>
                    
                    <input type="file" accept="image/*" @change="procesarImagen" class="p-inputtext p-component p-2 w-full text-sm mt-auto input-file-oscuro" />
                </div>
            </div>

            <!-- Descripción (Ocupa todo el ancho) -->
            <div class="col-12 mb-4 flex flex-column gap-2">
                <label class="font-bold label-oscura">Descripción / Detalles</label>
                <Textarea v-model="herramienta.descripcion" rows="3" placeholder="Especificaciones adicionales..." />
            </div>
            
            <!-- Botones de Acción -->
            <div class="col-12 flex gap-3 mt-2">
                <Button label="Registrar Producto" icon="pi pi-check" @click="guardarProducto" :loading="cargando" class="btn-registrar" />
                <Button label="Limpiar" icon="pi pi-eraser" severity="secondary" @click="limpiar" class="btn-limpiar" />
            </div>

            <!-- Mensajes de Feedback -->
            <div class="col-12 mt-4" v-if="mensajeExito || mensajeError">
                <Message v-if="mensajeExito" severity="success" :closable="false">Producto registrado correctamente.</Message>
                <Message v-if="mensajeError" severity="error" :closable="false">{{ mensajeError }}</Message>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
/* 1. CONTENEDOR PRINCIPAL */
.panel-nuevo-producto {
    background-color: #2a323d !important;
    color: #ffffff;
}

/* 2. ETIQUETAS (LABELS) */
.label-oscura {
    color: #cbd5e1 !important; /* Gris azulado claro para buena lectura */
}

/* 3. INPUTS Y TEXTAREAS (Estilo Pedidos) */
:deep(.p-inputtext), 
:deep(.p-inputnumber-input),
:deep(.p-textarea) { /* <-- Agregamos el textarea aquí */
    background-color: #121820 !important;
    color: #ffffff !important;
    border: 1px solid #4a5568 !important;
    border-radius: 6px;
}

:deep(.p-inputtext:enabled:focus), 
:deep(.p-inputnumber-input:enabled:focus),
:deep(.p-textarea:enabled:focus) { /* <-- Y también aquí para el enfoque */
    border-color: #5ab1ce !important;
    box-shadow: 0 0 0 1px #5ab1ce !important; /* Contorno cyan de enfoque */
}

:deep(.p-inputtext:enabled:focus), 
:deep(.p-inputnumber-input:enabled:focus) {
    border-color: #5ab1ce !important;
    box-shadow: 0 0 0 1px #5ab1ce !important; /* Contorno cyan de enfoque */
}

/* 4. INPUT DE ARCHIVO (FILE) */
.input-file-oscuro {
    background-color: #121820 !important;
    color: #ffffff !important;
    border: 1px solid #4a5568 !important;
    border-radius: 6px;
    cursor: pointer;
}

/* 5. ÁREA DE IMAGEN */
.area-imagen {
    background-color: #1e252d !important; /* Tono de contraste sutil para el cuadro exterior */
    border: 1px solid #3f4b5b !important;
}

.placeholder-imagen {
    background-color: #121820 !important;
    border: 1px dashed #4a5568 !important;
}

/* 6. BOTONES MODERNOS */
.btn-registrar {
    background-color: #22c55e !important; /* Verde corporativo moderno */
    border: none !important;
    padding: 0.75rem 1.5rem !important;
    color: #000000 !important;
    font-weight: bold;
}
.btn-registrar:hover {
    background-color: #16a34a !important;
}

.btn-limpiar {
    background-color: #4a5568 !important; /* Gris corporativo */
    border: none !important;
    padding: 0.75rem 1.5rem !important;
    color: white !important;
}
.btn-limpiar:hover {
    background-color: #3f4b5b !important;
}
</style>