<script setup>
import { computed } from 'vue';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import { useI18n } from 'vue-i18n';
import VisorImagen from '@/components/common/VisorImage.vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    herramienta: {
        type: Object,
        default: () => null
    },
    ocultarBotonAgregar: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:visible', 'agregar']);
const { t } = useI18n();

const mostrarModal = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
});

const obtenerSeveridadStock = (h) => {
    if (!h) return 'success';
    
    // Normalizar la lectura de propiedades de stock por si vienen con distintos nombres
    const disponible = h.cantidadDisponible ?? h.stock ?? 0;
    const minima = h.cantidadMinima ?? h.minStock ?? 0;

    if (disponible <= 0) return 'danger'; 
    if (disponible < minima) return 'danger';
    if (disponible === minima) return 'warn'; // Usar 'warn' para PrimeVue Tag
    return 'success';
};

const obtenerTextoStock = (h) => {
    if (!h) return '';
    if (h.cantidadDisponible <= 0) return t('catalogo_herramientas.estado_agotado');
    if (h.cantidadDisponible < h.cantidadMinima) return t('catalogo_herramientas.estado_critico');
    if (h.cantidadDisponible === h.cantidadMinima) return t('catalogo_herramientas.estado_alerta');
    return t('catalogo_herramientas.estado_normal');
};

const agregarHerramienta = () => {
    emit('agregar', props.herramienta);
    mostrarModal.value = false;
};
</script>

<template>
    <Dialog 
        v-model:visible="mostrarModal" 
        :style="{ width: '38rem' }" 
        :header="t('catalogo_herramientas.modal_titulo_detalles')" 
        :modal="true"
        dismissableMask
        class="modal-herramienta"
    >
        <div v-if="herramienta" class="pt-2 pb-1 px-1 md:px-2">
            <div class="flex flex-column align-items-center mb-5">
                <VisorImagen 
                    :src="herramienta.imagen || herramienta.image"
                    :alt="herramienta.nombre || 'Herramienta'"
                    ancho="140px"
                    alto="140px"
                    class="mb-3"
                />
                                
                <Tag 
                    :severity="obtenerSeveridadStock(herramienta)" 
                    :value="obtenerTextoStock(herramienta)"
                    class="px-3 py-1 text-xs uppercase font-bold shadow-1"
                />
            </div>

            <div class="grid formgrid mb-4">
                <div class="col-12 md:col-6 mb-4">
                    <span class="label-gris block mb-1 text-sm">{{ t('catalogo_herramientas.col_codigo') }}</span>
                    <span class="text-lg font-bold texto-codigo">
                        {{ herramienta.codigo || herramienta.code || t('catalogo_herramientas.no_aplica') }}
                    </span>
                </div>
                
                <div class="col-12 md:col-6 mb-4">
                    <span class="label-gris block mb-1 text-sm">{{ t('catalogo_herramientas.col_nombre') }}</span>
                    <span class="text-lg font-bold texto-valor">
                        {{ herramienta.nombre || herramienta.name || t('catalogo_herramientas.no_aplica') }}
                    </span>
                </div>
                
                <div class="col-12 md:col-6 mb-4">
                    <span class="label-gris block mb-1 text-sm">{{ t('catalogo_herramientas.modal_tipo') }}</span>
                    <span class="text-lg font-bold texto-valor">
                        {{ herramienta.tipo || herramienta.type || herramienta.category || t('catalogo_herramientas.no_aplica') }}
                    </span>
                </div>
                
                <div class="col-12 md:col-6 mb-4">
                    <span class="label-gris block mb-1 text-sm">{{ t('catalogo_herramientas.modal_ubicacion') }}</span>
                    <span class="text-lg font-bold texto-valor">
                        {{ herramienta.ubicacion || herramienta.location || t('catalogo_herramientas.no_aplica') }}
                    </span>
                </div>
                
                <div class="col-12 md:col-6 mb-4">
                    <span class="label-gris block mb-1 text-sm">{{ t('catalogo_herramientas.modal_marca') }}</span>
                    <span class="text-lg font-bold texto-valor">
                        {{ herramienta.marca || herramienta.brand || herramienta.supplier || t('catalogo_herramientas.no_aplica') }}
                    </span>
                </div>

                <div class="col-12 md:col-6 mb-4">
                    <span class="label-gris block mb-1 text-sm">{{ t('catalogo_herramientas.modal_desechable') }}</span>
                    <Tag 
                        :severity="herramienta.esDesechable ? 'warning' : 'info'" 
                        :value="herramienta.esDesechable 
                            ? t('catalogo_herramientas.tag_desechable_si') 
                            : t('catalogo_herramientas.tag_desechable_no')"
                        class="px-2 py-1 text-xs font-bold"
                    />
                </div>
                
                <div class="col-12 md:col-6 mb-4">
                    <span class="label-gris block mb-1 text-sm">{{ t('catalogo_herramientas.modal_stock') }}</span>
                    <span class="text-lg font-bold texto-valor">
                        {{ herramienta.cantidadDisponible ?? herramienta.stock ?? 0 }} / 
                        {{ herramienta.cantidadMinima ?? herramienta.minStock ?? 0 }} / 
                        <template v-if="herramienta.cantidadMaxima || herramienta.maxStock">
                            {{ herramienta.cantidadMaxima ?? herramienta.maxStock }}
                        </template>
                        <template v-else>52</template>
                        {{ t('catalogo_herramientas.modal_unidades') }}
                    </span>
                </div>
            </div>

            <div class="w-full">
                <span class="label-gris block mb-2 text-sm">{{ t('catalogo_herramientas.modal_descripcion') }}</span>
                <div class="caja-descripcion p-3 text-sm">
                    {{ herramienta.descripcion || herramienta.description || t('catalogo_herramientas.modal_sin_descripcion') }}
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-content-end align-items-center gap-3 w-full">
                <Button 
                    :label="t('catalogo_herramientas.btn_cerrar')" 
                    icon="pi pi-times" 
                    text 
                    class="btn-texto-gris" 
                    @click="mostrarModal = false" 
                />
                <Button 
                    v-if="!ocultarBotonAgregar"
                    :label="t('catalogo_herramientas.btn_anadir')" 
                    icon="pi pi-plus" 
                    class="btn-agregar px-4 py-2" 
                    @click="agregarHerramienta" 
                    :disabled="!herramienta || herramienta.cantidadDisponible <= 0"
                />
            </div>
        </template>
    </Dialog>
</template>

<style>
.modal-herramienta .p-dialog-header,
.modal-herramienta .p-dialog-content,
.modal-herramienta .p-dialog-footer {
    background-color: #1a222c !important;
    color: #ffffff !important;
    border-color: #2d3748 !important;
}

.modal-herramienta .caja-descripcion,
.modal-herramienta .fondo-imagen-vacia {
    background-color: #121820 !important; 
    border: 1px solid #4a5568 !important;
    color: #ffffff !important;
    border-radius: 6px !important;
}

.modal-herramienta .texto-valor { color: #ffffff !important; }
.modal-herramienta .texto-codigo { color: #5ab1ce !important; } 
.modal-herramienta .label-gris,
.modal-herramienta .icono-vacio {
    color: #94a3b8 !important;
}

html.light-theme .modal-herramienta .p-dialog-header,
html.light-theme .modal-herramienta .p-dialog-content,
html.light-theme .modal-herramienta .p-dialog-footer {
    background-color: #ffffff !important;
    color: #334155 !important;
    border-color: #e2e8f0 !important;
}

html.light-theme .modal-herramienta .caja-descripcion,
html.light-theme .modal-herramienta .fondo-imagen-vacia {
    background-color: #f8fafc !important;
    border: 1px solid #cbd5e1 !important;
    color: #334155 !important;
}

html.light-theme .modal-herramienta .texto-valor { color: #334155 !important; }
html.light-theme .modal-herramienta .texto-codigo { color: #063b69 !important; }
html.light-theme .modal-herramienta .label-gris,
html.light-theme .modal-herramienta .icono-vacio {
    color: #64748b !important;
}

.modal-herramienta .btn-agregar {
    background-color: #34d399 !important; 
    color: #064e3b !important;
    border: none !important;
    border-radius: 6px !important;
    font-weight: 700 !important;
    transition: filter 0.2s;
}
.modal-herramienta .btn-agregar:hover { filter: brightness(1.1); }
.modal-herramienta .btn-agregar:disabled { 
    background-color: #4a5568 !important; 
    color: #94a3b8 !important; 
    cursor: not-allowed !important; 
}
html.light-theme .modal-herramienta .btn-agregar:disabled {
    background-color: #e2e8f0 !important; 
    color: #94a3b8 !important; 
}
/* Estilo amarillo exacto de la tabla para la insignia ALERTA */
.modal-herramienta .p-tag-warn,
.modal-herramienta .p-tag-warning {
    background-color: rgba(234, 179, 8, 0.18) !important; /* Fondo amarillo verdoso translúcido */
    color: #eab308 !important;                            /* Texto amarillo brillante */
    border: 1px solid rgba(234, 179, 8, 0.35) !important; /* Borde sutil */
}

/* En caso de que se use el tema claro */
html.light-theme .modal-herramienta .p-tag-warn,
html.light-theme .modal-herramienta .p-tag-warning {
    background-color: #fef9c3 !important;
    color: #854d0e !important;
    border: 1px solid #fef08a !important;
}
</style>