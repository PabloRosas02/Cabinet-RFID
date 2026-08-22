<script setup>
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import AutoComplete from 'primevue/autocomplete';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select'; 
import { useI18n } from 'vue-i18n';

const props = defineProps({
    pedido: { 
        type: Array, 
        required: true 
    },
    trabajador: { 
        type: Object, 
        required: true 
    },
    listaUsuarios: { 
        type: Array, 
        default: () => [] 
    } 
});

const emit = defineEmits(['quitar', 'registrar']);
const { t } = useI18n(); 

const opcionesMotivo = ref([
    'Fin de vida util',
    'Daño por operador',
    'Extravio',
    'Set up',
    'Mala calidad de la herramienta',
    'Otro'
]);

// Variables para controlar el Select y el Input libre
const motivoSeleccionado = ref(props.trabajador.motivo || '');
const motivoOtro = ref(props.trabajador.motivoOtro || '');

// Función directa para asignar el motivo sin romper el objeto reactivo original
const manejarCambioMotivo = (e) => {
    const valor = e.value;
    if (valor !== 'Otro') {
        props.trabajador.motivo = valor;
        props.trabajador.motivoOtro = null; // Limpiamos el texto libre si selecciona una opción normal
        motivoOtro.value = '';
    } else {
        props.trabajador.motivo = 'Otro';
        props.trabajador.motivoOtro = motivoOtro.value;
    }
};

// Función para capturar cuando escribe en la opción "Otro"
const manejarMotivoOtro = (e) => {
    const texto = e.target.value;
    motivoOtro.value = texto;
    props.trabajador.motivoOtro = texto;
};

// =====================================================================
// LÓGICA DE BÚSQUEDA Y VALIDACIÓN DE TRABAJADOR
// =====================================================================
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

const trabajadorValido = computed(() => {
    if (!props.trabajador.numero || !props.trabajador.nombre || !props.trabajador.orden || !props.trabajador.maquina || !props.trabajador.motivo || !props.listaUsuarios) return false;
    
    const numIngresado = props.trabajador.numero.toString().trim();
    const nomIngresado = props.trabajador.nombre.toString().trim().toLowerCase();

    return props.listaUsuarios.some(u => 
        u.numTrabajador?.toString() === numIngresado && 
        u.nombre?.toString().toLowerCase() === nomIngresado
    );
});

// =====================================================================
// LÓGICA DEL MODAL DE DETALLES Y STOCK
// =====================================================================
const mostrarDetalles = ref(false);
const herramientaActual = ref(null);

const verDetalles = (item) => {
    herramientaActual.value = item; 
    mostrarDetalles.value = true;
};

const obtenerSeveridadStock = (h) => {
    if (!h) return 'success';
    if (h.cantidadDisponible <= 0) return 'danger';
    if (h.cantidadDisponible < h.cantidadMinima) return 'danger';
    if (h.cantidadDisponible === h.cantidadMinima) return 'warning';
    return 'success';
};

const obtenerTextoStock = (h) => {
    if (!h) return '';
    if (h.cantidadDisponible <= 0) return t('detalle_pedido.estado_agotado');
    if (h.cantidadDisponible < h.cantidadMinima) return t('detalle_pedido.estado_critico');
    if (h.cantidadDisponible === h.cantidadMinima) return t('detalle_pedido.estado_alerta');
    return t('detalle_pedido.estado_normal');
};
</script>

<template>
    <div class="panel-principal flex flex-column h-full p-3 md:p-4 border-round-xl shadow-1">
        <h3 class="m-0 mb-4 text-xl md:text-2xl font-bold text-white">
            {{ t('detalle_pedido.titulo') }}
        </h3>

        <!-- Formulario del Trabajador -->
        <div class="formulario-trabajador mb-4">
            
            <!-- Búsqueda por Número -->
            <div class="field mb-3">
                <label for="buscarNumEmpleado" class="label-blanco">{{ t('detalle_pedido.label_num_empleado') }}</label>
                <AutoComplete 
                    inputId="buscarNumEmpleado"
                    v-model="trabajador.numero" 
                    :suggestions="resultadosSugeridos" 
                    @complete="buscarUsuario" 
                    @item-select="seleccionarUsuario"
                    field="numTrabajador"
                    :placeholder="t('detalle_pedido.ph_num_empleado')" 
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
            <div class="field mb-3">
                <label for="buscarNomEmpleado" class="label-blanco">{{ t('detalle_pedido.label_nom_empleado') }}</label>
                <AutoComplete 
                    inputId="buscarNomEmpleado"
                    v-model="trabajador.nombre" 
                    :suggestions="resultadosSugeridos" 
                    @complete="buscarUsuario" 
                    @item-select="seleccionarUsuario"
                    field="nombre"
                    :placeholder="t('detalle_pedido.ph_nom_empleado')" 
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

            <!-- Orden de Trabajo -->
            <div class="field mb-3">
                <label for="ordenTrabajo" class="label-blanco">No. de Orden</label>
                <InputText 
                    id="ordenTrabajo"
                    v-model="trabajador.orden" 
                    placeholder="Ej. OT-1024..." 
                    class="w-full input-oscuro" 
                />
            </div>

            <!-- Máquina / Equipo -->
            <div class="field mb-3">
                <label for="maquinaTrabajo" class="label-blanco">Máquina / Equipo</label>
                <InputText 
                    id="maquinaTrabajo"
                    v-model="trabajador.maquina" 
                    placeholder="Ej. CNC-02..." 
                    class="w-full input-oscuro" 
                />
            </div>
            
            <!-- Motivo de Salida  -->
            <div class="field mb-3">
                <label for="motivoSalida" class="label-blanco">Motivo de Salida</label>
                
                <Select 
                    id="motivoSalida"
                    v-model="motivoSeleccionado" 
                    :options="opcionesMotivo"
                    placeholder="Selecciona el motivo" 
                    class="w-full input-oscuro" 
                    panelClass="panel-autocomplete-oscuro"
                    @change="manejarCambioMotivo"
                />

                <!-- Input extra que solo aparece si eligen "Otro" -->
                <InputText 
                    v-if="motivoSeleccionado === 'Otro'"
                    :value="motivoOtro"
                    @input="manejarMotivoOtro"
                    placeholder="Escribe el motivo..." 
                    class="w-full input-oscuro mt-2" 
                    autocomplete="off"
                />
            </div>
            
        </div>

        <!-- Lista de Herramientas Seleccionadas -->
        <h4 class="text-300 text-lg mt-4 border-top-1 border-gray-600 pt-3">
            {{ t('detalle_pedido.titulo_herramientas') }}
        </h4>
        
        <div v-if="pedido.length === 0" class="mensaje-vacio">
            {{ t('detalle_pedido.mensaje_vacio') }}
        </div>

        <ul v-else class="lista-pedido">
            <li v-for="item in pedido" :key="item.id" class="item-pedido flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-3 sm:gap-0">

                <div class="item-info w-full sm:w-5">
                    <span class="item-codigo block mb-1 sm:mb-0">{{ item.codigo }}</span>
                    <span class="item-nombre block text-lg sm:text-base">{{ item.nombre }}</span>
                </div>

                <div class="item-acciones w-full sm:w-7 flex justify-content-between sm:justify-content-end align-items-center">
                    <Button 
                        icon="pi pi-eye" 
                        class="p-button-rounded p-button-info p-button-text p-button-sm mr-2" 
                        @click="verDetalles(item)" 
                        :aria-label="t('detalle_pedido.aria_ver_detalles')" 
                    />
                    
                    <div class="control-cantidad">
                        <span class="etiqueta-cant">{{ t('detalle_pedido.etiqueta_cant') }}</span>
                        <input 
                            type="number" 
                            v-model.number="item.cantidadLlevada" 
                            min="1" 
                            :max="item.cantidadDisponible" 
                            class="input-oscuro input-numero" 
                            :aria-label="t('detalle_pedido.aria_cantidad')"
                        />
                        <span class="etiqueta-stock">/ {{ item.cantidadDisponible }}</span>
                    </div>
                    
                    <Button 
                        icon="pi pi-trash" 
                        class="p-button-rounded p-button-danger p-button-text p-button-sm ml-2" 
                        @click="emit('quitar', item.id)" 
                        :aria-label="t('detalle_pedido.aria_quitar')" 
                    />
                </div>
            </li>
        </ul>

        <!-- Botón de Registro y Validaciones -->
        <div class="mt-4">
            <div v-if="(trabajador.numero || trabajador.nombre) && !trabajadorValido" class="text-red-400 text-sm mb-3 flex align-items-center font-semibold">
                <i class="pi pi-exclamation-triangle mr-2"></i> {{ t('detalle_pedido.error_trabajador') }}
            </div>
            
            <Button 
                :label="t('detalle_pedido.btn_registrar')" 
                icon="pi pi-check" 
                class="w-full boton-registrar" 
                @click="emit('registrar')" 
                :disabled="pedido.length === 0 || !trabajadorValido"
            />
        </div>

        <!-- Modal Detalles de Herramienta -->
        <Dialog 
            v-model:visible="mostrarDetalles" 
            :style="{width: '700px'}" 
            :breakpoints="{ '1199px': '75vw', '768px': '90vw', '575px': '95vw' }"
            :header="t('detalle_pedido.modal_titulo')" 
            :modal="true" 
            dismissableMask 
            class="modal-oscuro"
        >
            <div v-if="herramientaActual" class="p-2 md:p-4">
                <div class="flex flex-column align-items-center mb-5">
                    <img 
                        v-if="herramientaActual.imagen" 
                        :src="herramientaActual.imagen" 
                        @error="$event.target.src='https://via.placeholder.com/250x150/1e252d/ffffff?text=Error'" 
                        class="shadow-3 border-round" 
                        style="max-width: 100%; max-height: 300px; object-fit: contain;" 
                    />
                    <div v-else class="flex align-items-center justify-content-center surface-200 border-round shadow-1" style="width: 100%; max-width: 200px; height: 200px;">
                        <i class="pi pi-image text-7xl text-400"></i>
                    </div>
                    <div class="mt-4">
                        <Tag class="text-lg md:text-xl px-4 py-2" :severity="obtenerSeveridadStock(herramientaActual)" :value="obtenerTextoStock(herramientaActual)" />
                    </div>
                </div>

                <div class="grid">
                    <div class="col-12 md:col-6 mb-3">
                        <span class="text-500 block mb-1">{{ t('detalle_pedido.col_codigo') }}</span>
                        <span class="text-xl font-bold" style="color: #38bdf8;">{{ herramientaActual.codigo }}</span>
                    </div>
                    <div class="col-12 md:col-6 mb-3">
                        <span class="text-500 block mb-1">{{ t('detalle_pedido.col_nombre') }}</span>
                        <span class="text-xl font-bold text-white">{{ herramientaActual.nombre }}</span>
                    </div>
                    <div class="col-12 md:col-6 mb-3">
                        <span class="text-500 block mb-1">{{ t('detalle_pedido.modal_tipo') }}</span>
                        <span class="text-lg text-white">{{ herramientaActual.tipo || t('detalle_pedido.no_aplica') }}</span>
                    </div>
                    <div class="col-12 md:col-6 mb-3">
                        <span class="text-500 block mb-1">{{ t('detalle_pedido.modal_ubicacion') }}</span>
                        <span class="text-lg text-white">{{ herramientaActual.ubicacion || t('detalle_pedido.no_aplica') }}</span>
                    </div>
                    <div class="col-12 md:col-6 mb-3">
                        <span class="text-500 block mb-1">{{ t('detalle_pedido.modal_marca') }}</span>
                        <span class="text-lg text-white">{{ herramientaActual.marca || t('detalle_pedido.no_aplica') }}</span>
                    </div>
                    
                    <div class="col-12 md:col-6 mb-3">
                        <span class="text-500 block mb-1">{{ t('detalle_pedido.modal_stock_vs') }} / Máx</span>
                        <span class="text-lg font-bold text-white">
                            {{ herramientaActual.cantidadDisponible }} / {{ herramientaActual.cantidadMinima }} / <span class="text-green-400">{{ herramientaActual.cantidadMaxima || 'N/A' }}</span> {{ t('detalle_pedido.modal_unidades') }}
                        </span>
                    </div>
                    
                    <div class="col-12 mb-3">
                        <span class="text-500 block mb-1">{{ t('detalle_pedido.modal_descripcion') }}</span>
                        <div class="surface-100 p-3 border-round text-base md:text-lg line-height-3 text-300">
                            {{ herramientaActual.descripcion || t('detalle_pedido.modal_sin_descripcion') }}
                        </div>
                    </div>
                </div>
            </div>
            
            <template #footer>
                <div class="flex justify-content-end mt-2 md:mt-3">
                    <Button 
                        :label="t('detalle_pedido.btn_cerrar')" 
                        icon="pi pi-times" 
                        class="btn-cancelar font-bold w-full sm:w-auto" 
                        @click="mostrarDetalles = false" 
                        autofocus 
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.label-blanco {
    display: block;
    margin-bottom: 0.5rem;
    color: #cbd5e1;
    font-size: 0.9rem;
    font-weight: 500;
}

.mensaje-vacio { color: #94a3b8; font-style: italic; text-align: center; padding: 1rem 0; }
.lista-pedido { list-style: none; padding: 0; margin: 0; flex-grow: 1; overflow-y: auto; max-height: 350px; }
.item-pedido { padding: 0.75rem; background-color: #1e252d; border: 1px solid #4a5568; border-radius: 8px; margin-bottom: 0.5rem; }

.item-info { display: flex; flex-direction: column; }
.item-codigo { font-size: 0.8rem; color: #94a3b8; }
.item-nombre { font-weight: bold; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.item-acciones { display: flex; }
.control-cantidad { display: flex; align-items: center; background-color: #2a323d; padding: 0.2rem 0.5rem; border-radius: 6px; border: 1px solid #3f4b5b; }
.etiqueta-cant, .etiqueta-stock { color: #94a3b8; font-size: 0.85rem; }
.input-numero { width: 50px; text-align: center; margin: 0 0.5rem; padding: 0.3rem; border-radius: 4px; color: #ffffff; }
.input-numero::-webkit-outer-spin-button, .input-numero::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.input-numero[type=number] { -moz-appearance: textfield; appearance: textfield; }

.boton-registrar { background-color: #3b82f6 !important; border: none !important; padding: 1rem !important; font-weight: bold !important; transition: all 0.2s; }
.boton-registrar:disabled { background-color: #4a5568 !important; color: #94a3b8 !important; cursor: not-allowed; }

:deep(.surface-100) { background-color: #313a46 !important; border: 1px solid #3f4b5b !important; }
:deep(.surface-200) { background-color: #1e252d !important; }
:deep(.text-500) { color: #94a3b8 !important; }
:deep(.text-300) { color: #cbd5e1 !important; }
</style>

<style>
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