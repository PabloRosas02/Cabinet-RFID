<script setup>
import { ref } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import AutoComplete from 'primevue/autocomplete';

const props = defineProps({
    pedido: { type: Array, required: true },
    trabajador: { type: Object, required: true },
    listaUsuarios: { type: Array, default: () => [] } 
});

const emit = defineEmits(['quitar', 'registrar']);

const resultadosSugeridos = ref([]);

const buscarUsuario = (event) => {
    if (!props.listaUsuarios) return;

    const query = event.query.toLowerCase();
    
    resultadosSugeridos.value = props.listaUsuarios.filter((u) => 
        u.numTrabajador?.toString().includes(query) || 
        u.nombre?.toLowerCase().includes(query)
    );
};

const seleccionarUsuario = (event) => {
    const usuario = event.value;
    if (usuario && typeof usuario === 'object') {
        props.trabajador.numero = usuario.numTrabajador;
        props.trabajador.nombre = usuario.nombre;
    }
};

const mostrarDetalles = ref(false);
const herramientaActual = ref(null);

const verDetalles = (item) => {
    herramientaActual.value = item; 
    mostrarDetalles.value = true;
};

const obtenerSeveridadStock = (h) => {
    if (!h) return 'success';
    if (h.cantidadDisponible < h.cantidadMinima) return 'danger';
    if (h.cantidadDisponible === h.cantidadMinima) return 'warning';
    return 'success';
};

const obtenerTextoStock = (h) => {
    if (!h) return '';
    if (h.cantidadDisponible < h.cantidadMinima) return 'CRÍTICO';
    if (h.cantidadDisponible === h.cantidadMinima) return 'ALERTA';
    return 'NORMAL';
};
</script>

<template>
    <div class="panel-pedido p-3 md:p-4 border-round-xl shadow-1">
        <h3 class="subtitulo text-xl md:text-2xl font-bold">Detalle del Pedido</h3>

        <!-- Formulario del Trabajador -->
        <div class="formulario-trabajador mb-4">
            
            <!-- Búsqueda por Número -->
            <div class="field mb-3">
                <label for="buscarNumEmpleado" class="label-blanco">No. de Empleado (Buscar o Escribir)</label>
                <AutoComplete 
                    inputId="buscarNumEmpleado"
                    v-model="trabajador.numero" 
                    :suggestions="resultadosSugeridos" 
                    @complete="buscarUsuario" 
                    @item-select="seleccionarUsuario"
                    field="numTrabajador"
                    placeholder="Ej. 1045..." 
                    class="w-full"
                    inputClass="w-full input-oscuro"
                    panelClass="panel-autocomplete-oscuro"
                    :forceSelection="false"
                >
                    <template #option="slotProps">
                        <div class="flex flex-column">
                            <span class="font-bold text-blue-400">{{ slotProps.option.numTrabajador }}</span>
                            <span class="text-sm text-white">{{ slotProps.option.nombre }}</span>
                        </div>
                    </template>
                </AutoComplete>
            </div>
            
            <!-- Búsqueda por Nombre -->
            <div class="field">
                <label for="buscarNomEmpleado" class="label-blanco">Nombre del Trabajador</label>
                <AutoComplete 
                    inputId="buscarNomEmpleado"
                    v-model="trabajador.nombre" 
                    :suggestions="resultadosSugeridos" 
                    @complete="buscarUsuario" 
                    @item-select="seleccionarUsuario"
                    field="nombre"
                    placeholder="Ej. Eduardo Cruz..." 
                    class="w-full"
                    inputClass="w-full input-oscuro"
                    panelClass="panel-autocomplete-oscuro"
                    :forceSelection="false"
                >
                    <template #option="slotProps">
                        <div class="flex flex-column">
                            <span class="font-bold text-white">{{ slotProps.option.nombre }}</span>
                            <span class="text-sm text-blue-400">{{ slotProps.option.numTrabajador }}</span>
                        </div>
                    </template>
                </AutoComplete>
            </div>
            
        </div>

        <!-- Lista de Herramientas Seleccionadas -->
        <h4 class="subtitulo-menor mt-4 border-top-1 border-gray-600 pt-3">Herramientas a entregar:</h4>
        
        <div v-if="pedido.length === 0" class="mensaje-vacio">Aún no has agregado herramientas.</div>

        <ul v-else class="lista-pedido">
            <li v-for="item in pedido" :key="item.id" class="item-pedido flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-3 sm:gap-0">

                <div class="item-info w-full sm:w-5">
                    <span class="item-codigo block mb-1 sm:mb-0">{{ item.codigo }}</span>
                    <span class="item-nombre block text-lg sm:text-base">{{ item.nombre }}</span>
                </div>

                <div class="item-acciones w-full sm:w-7 flex justify-content-between sm:justify-content-end align-items-center">
                    <Button icon="pi pi-eye" class="p-button-rounded p-button-info p-button-text p-button-sm mr-2" @click="verDetalles(item)" aria-label="Ver Detalles" />
                    
                    <div class="control-cantidad">
                        <span class="etiqueta-cant">Cant:</span>
                        <input 
                            type="number" 
                            v-model.number="item.cantidadLlevada" 
                            min="1" 
                            :max="item.cantidadDisponible" 
                            class="input-oscuro input-numero" 
                            aria-label="Cantidad a llevar"
                        />
                        <span class="etiqueta-stock">/ {{ item.cantidadDisponible }}</span>
                    </div>
                    
                    <Button icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text p-button-sm ml-2" @click="emit('quitar', item.id)" aria-label="Quitar" />
                </div>
            </li>
        </ul>

        <!-- Botón de Registro -->
        <Button 
            label="Registrar Pedido" 
            icon="pi pi-check" 
            class="w-full mt-4 boton-registrar" 
            @click="emit('registrar')" 
            :disabled="pedido.length === 0 || !trabajador.numero || !trabajador.nombre"
        />
        <Dialog 
            v-model:visible="mostrarDetalles" 
            :style="{width: '700px'}" 
            :breakpoints="{ '1199px': '75vw', '768px': '90vw', '575px': '95vw' }"
            header="Detalles de la Herramienta" 
            :modal="true" 
            dismissableMask 
            class="modal-oscuro-primeflex"
        >
            <div v-if="herramientaActual" class="p-2 md:p-4">
                <div class="flex flex-column align-items-center mb-5">
                    <img v-if="herramientaActual.imagen" :src="herramientaActual.imagen" @error="$event.target.src='https://via.placeholder.com/250x150/1e252d/ffffff?text=Error'" class="shadow-3 border-round" style="max-width: 100%; max-height: 300px; object-fit: contain;" />
                    <div v-else class="flex align-items-center justify-content-center surface-200 border-round shadow-1" style="width: 100%; max-width: 200px; height: 200px;"><i class="pi pi-image text-7xl text-400"></i></div>
                    <div class="mt-4"><Tag class="text-lg md:text-xl px-4 py-2" :severity="obtenerSeveridadStock(herramientaActual)" :value="obtenerTextoStock(herramientaActual)" /></div>
                </div>

                <div class="grid">
                    <div class="col-12 md:col-6 mb-3"><span class="text-500 block mb-1">Código</span><span class="text-xl font-bold" style="color: #38bdf8;">{{ herramientaActual.codigo }}</span></div>
                    <div class="col-12 md:col-6 mb-3"><span class="text-500 block mb-1">Nombre</span><span class="text-xl font-bold text-white">{{ herramientaActual.nombre }}</span></div>
                    <div class="col-12 md:col-6 mb-3"><span class="text-500 block mb-1">Tipo / Categoría</span><span class="text-lg text-white">{{ herramientaActual.tipo || 'N/A' }}</span></div>
                    <div class="col-12 md:col-6 mb-3"><span class="text-500 block mb-1">Ubicación Física</span><span class="text-lg text-white">{{ herramientaActual.ubicacion || 'N/A' }}</span></div>
                    <div class="col-12 md:col-6 mb-3"><span class="text-500 block mb-1">Marca / Proveedor</span><span class="text-lg text-white">{{ herramientaActual.marca || 'N/A' }}</span></div>
                    <div class="col-12 md:col-6 mb-3"><span class="text-500 block mb-1">Stock Actual vs Mínimo</span><span class="text-lg font-bold text-white">{{ herramientaActual.cantidadDisponible }} / {{ herramientaActual.cantidadMinima }} unidades</span></div>
                    <div class="col-12 mb-3"><span class="text-500 block mb-1">Descripción y Notas</span><div class="surface-100 p-3 border-round text-base md:text-lg line-height-3 text-300">{{ herramientaActual.descripcion || 'Sin descripción disponible.' }}</div></div>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-content-end mt-2 md:mt-3">
                    <Button label="Cerrar" icon="pi pi-times" class="p-button-text text-500 hover:text-white w-full sm:w-auto" @click="mostrarDetalles = false" autofocus />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.panel-pedido { background-color: #2a323d; display: flex; flex-direction: column; height: 100%; }
.subtitulo { color: #ffffff; margin-top: 0; margin-bottom: 1.5rem; }
.subtitulo-menor { color: #cbd5e1; font-size: 1.1rem; }
.label-blanco { display: block; color: #cbd5e1; margin-bottom: 0.5rem; font-weight: 500; }

:deep(.input-oscuro) { background-color: #1e252d !important; color: #ffffff !important; border: 1px solid #4a5568 !important; }
:deep(.input-oscuro:focus) { border-color: #5ab1ce !important; box-shadow: 0 0 0 1px #5ab1ce !important; }

.mensaje-vacio { color: #94a3b8; font-style: italic; text-align: center; padding: 1rem 0; }
.lista-pedido { list-style: none; padding: 0; margin: 0; flex-grow: 1; overflow-y: auto; max-height: 350px; }
.item-pedido { padding: 0.75rem; background-color: #1e252d; border: 1px solid #4a5568; border-radius: 8px; margin-bottom: 0.5rem; }

/* Eliminamos los anchos fijos, PrimeFlex se encarga ahora */
.item-info { display: flex; flex-direction: column; }
.item-codigo { font-size: 0.8rem; color: #94a3b8; }
.item-nombre { font-weight: bold; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.item-acciones { display: flex; }
.control-cantidad { display: flex; align-items: center; background-color: #2a323d; padding: 0.2rem 0.5rem; border-radius: 6px; border: 1px solid #3f4b5b; }
.etiqueta-cant, .etiqueta-stock { color: #94a3b8; font-size: 0.85rem; }
.input-numero { width: 50px; text-align: center; margin: 0 0.5rem; padding: 0.3rem; border-radius: 4px; }
.input-numero::-webkit-outer-spin-button, .input-numero::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.input-numero[type=number] { -moz-appearance: textfield; appearance: textfield; }

.boton-registrar { background-color: #3b82f6 !important; border: none !important; padding: 1rem !important; font-weight: bold !important; transition: all 0.2s; }
.boton-registrar:disabled { background-color: #4a5568 !important; color: #94a3b8 !important; cursor: not-allowed; }

:deep(.surface-100) { background-color: #313a46 !important; border: 1px solid #3f4b5b !important; }
:deep(.surface-200) { background-color: #1e252d !important; }
:deep(.text-500) { color: #94a3b8 !important; }
:deep(.text-300) { color: #cbd5e1 !important; }

/* Modal responsivo */
:deep(.modal-oscuro-primeflex .p-dialog-header), 
:deep(.modal-oscuro-primeflex .p-dialog-content), 
:deep(.modal-oscuro-primeflex .p-dialog-footer) { 
    background-color: #1e252d !important; 
    color: #ffffff !important; 
    border: none; 
    padding-left: 1rem !important; 
    padding-right: 1rem !important;
}

@media (min-width: 768px) {
    :deep(.modal-oscuro-primeflex .p-dialog-header), 
    :deep(.modal-oscuro-primeflex .p-dialog-content), 
    :deep(.modal-oscuro-primeflex .p-dialog-footer) { 
        padding-left: 1.5rem !important; 
        padding-right: 1.5rem !important;
    }
}

:deep(.modal-oscuro-primeflex .p-dialog-header) { border-bottom: 1px solid #2a323d !important; }
:deep(.modal-oscuro-primeflex .p-dialog-footer) { border-top: 1px solid #2a323d !important; }
:deep(.modal-oscuro-primeflex .p-dialog-header-icon) { color: #94a3b8 !important; }
:deep(.modal-oscuro-primeflex .p-dialog-header-icon:hover) { background-color: rgba(255, 255, 255, 0.05) !important; color: #ffffff !important; }
</style>

<style>
/* Estilos globales para AutoComplete */
.panel-autocomplete-oscuro {
    background-color: #1e252d !important;
    border: 1px solid #4a5568 !important;
    color: #ffffff !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5) !important;
}
.panel-autocomplete-oscuro .p-autocomplete-list {
    background-color: transparent !important;
    padding: 0 !important;
}
.panel-autocomplete-oscuro .p-autocomplete-option {
    color: #cbd5e1 !important;
    background-color: transparent !important;
    padding: 0.75rem 1rem !important;
}
.panel-autocomplete-oscuro .p-autocomplete-option:hover,
.panel-autocomplete-oscuro .p-autocomplete-option.p-focus {
    background-color: #36464d !important;
    color: #ffffff !important;
}
</style>