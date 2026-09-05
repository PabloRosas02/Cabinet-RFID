<script setup>
import { ref, watch } from 'vue';
import Image from 'primevue/image';
import Button from 'primevue/button';

const props = defineProps({
    src: {
        type: String,
        default: null
    },
    alt: {
        type: String,
        default: 'Imagen de herramienta'
    },
    ancho: {
        type: String,
        default: '140px'
    },
    alto: {
        type: String,
        default: '140px'
    },
    mostrarBotonEliminar: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['eliminar']);

const errorCarga = ref(false);

// Si cambia el src, reiniciamos el estado de error
watch(() => props.src, () => {
    errorCarga.value = false;
});

const manejarError = () => {
    errorCarga.value = true;
};
</script>

<template>
    <div class="visor-imagen-container relative flex align-items-center justify-content-center">
        <!-- Imagen con Zoom / Pantalla Completa integrados -->
        <template v-if="src && !errorCarga">
            <Image 
                :src="src" 
                :alt="alt" 
                preview
                class="w-full h-full flex justify-content-center align-items-center"
                imageClass="shadow-2 border-round object-cover cursor-pointer hover:opacity-90 transition-opacity"
                :imageStyle="{ width: ancho, height: alto, objectFit: 'cover' }"
                @error="manejarError"
            />
            
            <!-- Botón opcional para remover la imagen (en Formularios) -->
            <Button 
                v-if="mostrarBotonEliminar"
                icon="pi pi-times" 
                severity="danger" 
                rounded 
                class="absolute z-2" 
                style="top: -0.5rem; right: -0.5rem;" 
                @click.stop="emit('eliminar')" 
                aria-label="Remover imagen"
            />
        </template>

        <!-- Estado cuando no hay imagen o falla la carga -->
        <div 
            v-else 
            class="fondo-imagen-vacia border-round flex align-items-center justify-content-center"
            :style="{ width: ancho, height: alto }"
        >
            <i class="pi pi-image text-5xl icono-vacio"></i>
        </div>
    </div>
</template>

<style scoped>
.fondo-imagen-vacia {
    background-color: #121820; 
    border: 1px solid #4a5568;
    color: #94a3b8;
}

html.light-theme .fondo-imagen-vacia {
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    color: #64748b;
}

.icono-vacio {
    color: #94a3b8;
}

html.light-theme .icono-vacio {
    color: #64748b;
}
</style>