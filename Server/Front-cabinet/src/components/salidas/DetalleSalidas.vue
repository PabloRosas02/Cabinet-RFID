<script setup>
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import AutoComplete from 'primevue/autocomplete';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import ModalDetalleHerramienta from '@/components/ModalDetalleHerramienta.vue';

const props = defineProps({
    pedido: {
        type: Array,
        required: true
    },
    trabajador: {
        type: Object,
        required: true
    },
    administradores: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['quitar', 'registrar', 'update:trabajador', 'update:pedido']);
const { t } = useI18n();

// =====================================================================
// MOTIVOS UNIFICADOS (Valores en Español coincidiendo con las opciones)
// =====================================================================
const opcionesMotivo = computed(() => [
    { label: t('detalle_pedido.motivos.fin_vida', 'End of life'), value: 'end_of_life' },
    { label: t('detalle_pedido.motivos.dano_operador', 'Operator damage'), value: 'operator_damage' },
    { label: t('detalle_pedido.motivos.extravio', 'Lost'), value: 'lost' },
    { label: t('detalle_pedido.motivos.set_up', 'Set up'), value: 'set_up' },
    { label: t('detalle_pedido.motivos.mala_calidad', 'Poor tool quality'), value: 'poor_quality' },
    { label: t('detalle_pedido.motivos.otro', 'Other'), value: 'other' }
]);

const actualizarTrabajador = (clave, valor) => {
    emit('update:trabajador', { ...props.trabajador, [clave]: valor });
};

const actualizarCantidad = (idItem, nuevaCantidad) => {
    const item = props.pedido.find(i => i.id === idItem);
    if (!item) return;
    
    const cantidadValidada = Math.max(1, Math.min(item.cantidadDisponible, nuevaCantidad));
    const nuevoPedido = props.pedido.map(i =>
        i.id === idItem ? { ...i, cantidadLlevada: cantidadValidada } : i
    );
    emit('update:pedido', nuevoPedido);
};

// Evaluador flexible para detectar "Otro" independientemente de si viene como 'Otro', 'otro' o 'Other'
const esMotivoOtro = computed(() => {
    if (!props.trabajador.motivo) return false;
    const m = String(props.trabajador.motivo).toLowerCase();
    return m === 'otro' || m === 'other';
});

// Evaluador flexible para detectar "Daño por operador"
const esDanoOperador = computed(() => {
    if (!props.trabajador.motivo) return false;
    const m = String(props.trabajador.motivo).toLowerCase();
    return m === 'operator_damage' || m.includes('daño') || m.includes('dano') || m === 'operator damage';
});

// =====================================================================
// BÚSQUEDA Y VALIDACIÓN DE TRABAJADOR
// =====================================================================
const resultadosSugeridos = ref([]);
const cargandoBusqueda = ref(false);
const usuarioConfirmado = ref(null);
let timeoutBusqueda = null;

const buscarUsuario = (event) => {
    const query = event.query.toLowerCase().trim();
    if (!query) {
        resultadosSugeridos.value = [];
        return;
    }
    
    cargandoBusqueda.value = true;
    clearTimeout(timeoutBusqueda);

    timeoutBusqueda = setTimeout(async () => {
        try {
            const response = await axios.get(`/api/usuarios/buscar?q=${query}`);
            let datosCrudos = response.data;
            if (response.data && response.data.data) {
                datosCrudos = response.data.data;
            } else if (response.data && response.data.usuarios) {
                datosCrudos = response.data.usuarios;
            } else if (Array.isArray(response.data)) {
                datosCrudos = response.data;
            }
            
            resultadosSugeridos.value = datosCrudos.map((u) => ({
                numTrabajador: u.numTrabajador || u.numero_empleado || u.id || u.numero,
                nombre: u.nombre || u.name || u.nombreCompleto
            }));
        } catch (error) {
            console.error("Error al buscar usuario:", error);
            resultadosSugeridos.value = [];
        } finally {
            cargandoBusqueda.value = false;
        }
    }, 400);
};

const seleccionarUsuario = (event) => {
    const usuario = event.value;
    if (usuario && typeof usuario === 'object') {
        emit('update:trabajador', {
            ...props.trabajador,
            numero: usuario.numTrabajador,
            nombre: usuario.nombre
        });
        usuarioConfirmado.value = usuario;
    }
};

const trabajadorConfirmado = computed(() => {
    const tr = props.trabajador;
    return usuarioConfirmado.value &&
           tr.numero && tr.nombre &&
           usuarioConfirmado.value.numTrabajador.toString() === tr.numero.toString().trim() &&
           usuarioConfirmado.value.nombre.toLowerCase() === tr.nombre.toString().trim().toLowerCase();
});

const camposCompletos = computed(() => {
    const tr = props.trabajador;
    if (!tr.orden || !tr.maquina || !tr.motivo) return false;
    if (esMotivoOtro.value && (!tr.motivoOtro || tr.motivoOtro.trim() === '')) return false;
    return true;
});

const trabajadorValido = computed(() => trabajadorConfirmado.value && camposCompletos.value);

// =====================================================================
// AUTORIZACIÓN POR DAÑOS
// =====================================================================
const mostrarModalAuth = ref(false);
const adminSeleccionado = ref(null);
const codigoAdmin = ref('');
const hashValidacion = ref(null);
const enviandoCodigo = ref(false);
const codigoEnviado = ref(false);
const verificandoCodigo = ref(false);
const errorAuth = ref('');

const manejarRegistro = () => {
    if (esDanoOperador.value) {
        mostrarModalAuth.value = true;
    } else {
        emit('registrar');
    }
};

const solicitarCodigoAutorizacion = async () => {
    if (!adminSeleccionado.value) return;
    enviandoCodigo.value = true;
    errorAuth.value = '';
    try {
        const respuesta = await axios.post('/api/salidas/solicitar-codigo-dano', {
            administradorId: adminSeleccionado.value,
            trabajadorNombre: props.trabajador.nombre,
            herramientaNombre: props.pedido.map(item => item.nombre).join(', ')
        });
        hashValidacion.value = respuesta.data.hashValidacion;
        codigoEnviado.value = true;
        codigoAdmin.value = '';
    } catch (error) {
        errorAuth.value = error.response?.data?.error || 'Error al solicitar el código.';
    } finally {
        enviandoCodigo.value = false;
    }
};

// Emisión corregida al confirmar código PIN
const confirmarAutorizacion = async () => {
    errorAuth.value = '';
    verificandoCodigo.value = true;
    try {
        await axios.post('/api/salidas/verificar-codigo-dano', {
            administradorId: adminSeleccionado.value,
            codigoAdmin: codigoAdmin.value,
            hashValidacion: hashValidacion.value
        });

        // Aseguramos que la propiedad coincida con lo esperado por el padre (codigo)
        emit('registrar', {
            adminId: adminSeleccionado.value,
            codigo: codigoAdmin.value,
            hashValidacion: hashValidacion.value
        });
        limpiarModalAuth();
    } catch (error) {
        errorAuth.value = error.response?.data?.error || 'Código incorrecto.';
        codigoAdmin.value = '';
    } finally {
        verificandoCodigo.value = false;
    }
};

const limpiarModalAuth = () => {
    mostrarModalAuth.value = false;
    adminSeleccionado.value = null;
    codigoAdmin.value = '';
    hashValidacion.value = null;
    codigoEnviado.value = false;
    verificandoCodigo.value = false;
    errorAuth.value = '';
};

// =====================================================================
// MODAL DE DETALLES Y STOCK
// =====================================================================
const mostrarDetalles = ref(false);
const herramientaActual = ref(null);

const verDetalles = (item) => {
    herramientaActual.value = item;
    mostrarDetalles.value = true;
};
</script>

<template>
    <div 
        class="panel-principal flex flex-column p-4 border-round-xl shadow-2 overflow-hidden transition-all transition-duration-300"
        :class="{ 'h-full': pedido.length > 0 }"
    >
        <h3 class="m-0 mb-4 text-2xl font-bold text-color tracking-tight">
            {{ t('detalle_pedido.titulo', 'Detalle de la Salida') }}
        </h3>

        <!-- Formulario del Trabajador -->
        <div 
            class="formulario-trabajador flex flex-column gap-3 transition-all transition-duration-200"
            :class="[pedido.length === 0 ? 'mb-3' : 'mb-4']"
        >
            <!-- 1. Número de Empleado -->
            <div class="field m-0">
                <label for="buscarNumEmpleado" class="text-color font-semibold block mb-2">{{ t('detalle_pedido.label_num_empleado', 'No. de Empleado (Buscar o Escribir)') }}</label>
                <AutoComplete
                    inputId="buscarNumEmpleado"
                    :modelValue="trabajador.numero"
                    @update:modelValue="(val) => actualizarTrabajador('numero', typeof val === 'object' ? val?.numTrabajador : val)"
                    :suggestions="resultadosSugeridos"
                    @complete="buscarUsuario"
                    @item-select="seleccionarUsuario"
                    field="numTrabajador"
                    :placeholder="t('detalle_pedido.ph_num_empleado', 'Ej. 1045...')"
                    class="w-full input-oscuro"
                    panelClass="panel-autocomplete-overlay"
                    :forceSelection="false"
                    :loading="cargandoBusqueda"
                    appendTo="body"
                >
                    <template #option="slotProps">
                        <div class="flex flex-column py-1">
                            <span class="font-bold text-primary text-base">{{ slotProps.option.numTrabajador }}</span>
                            <span class="text-sm text-color-secondary">{{ slotProps.option.nombre }}</span>
                        </div>
                    </template>
                </AutoComplete>
            </div>

            <!-- 2. Nombre del Trabajador -->
            <div class="field m-0">
                <label for="buscarNomEmpleado" class="text-color font-semibold block mb-2">{{ t('detalle_pedido.label_nom_empleado', 'Nombre del Trabajador') }}</label>
                <AutoComplete
                    inputId="buscarNomEmpleado"
                    :modelValue="trabajador.nombre"
                    @update:modelValue="(val) => actualizarTrabajador('nombre', typeof val === 'object' ? val?.nombre : val)"
                    :suggestions="resultadosSugeridos"
                    @complete="buscarUsuario"
                    @item-select="seleccionarUsuario"
                    field="nombre"
                    :placeholder="t('detalle_pedido.ph_nom_empleado', 'Ej. Eduardo Cruz...')"
                    class="w-full input-oscuro"
                    panelClass="panel-autocomplete-overlay"
                    :forceSelection="false"
                    :loading="cargandoBusqueda"
                    appendTo="body"
                >
                    <template #option="slotProps">
                        <div class="flex flex-column py-1">
                            <span class="font-bold text-color text-base">{{ slotProps.option.nombre }}</span>
                            <span class="text-sm text-primary">{{ slotProps.option.numTrabajador }}</span>
                        </div>
                    </template>
                </AutoComplete>
            </div>

            <!-- 3. Num. de Orden -->
            <div class="field m-0">
                <label for="ordenTrabajo" class="text-color font-semibold block mb-2">{{ t('detalle_pedido.label_orden', 'Num. de Orden') }}</label>
                <InputText
                    id="ordenTrabajo"
                    :modelValue="trabajador.orden"
                    @update:modelValue="(val) => actualizarTrabajador('orden', val)"
                    :placeholder="t('detalle_pedido.ph_num_orden', 'e.j., OT-1024...')"
                    class="w-full input-oscuro"
                />
            </div>

            <!-- 4. Máquina / Equipo -->
            <div class="field m-0">
                <label for="maquinaTrabajo" class="text-color font-semibold block mb-2">{{ t('detalle_pedido.label_maquina', 'Máquina / Equipo') }}</label>
                <InputText
                    id="maquinaTrabajo"
                    :modelValue="trabajador.maquina"
                    @update:modelValue="(val) => actualizarTrabajador('maquina', val)"
                    :placeholder="t('detalle_pedido.ph_maquina', 'e.j., CNC-02...')"
                    class="w-full input-oscuro"
                />
            </div>
            
            <!-- 5. Motivo de Salida -->
            <div class="field m-0">
                <label for="motivoSalida" class="text-color font-semibold block mb-2">{{ t('detalle_pedido.label_motivo', 'Motivo de salida') }}</label>
                <Select
                    inputId="motivoSalida"
                    :modelValue="trabajador.motivo"
                    :options="opcionesMotivo"
                    optionLabel="label"
                    optionValue="value"
                    :placeholder="t('detalle_pedido.ph_motivo_select', 'Selecciona una razón')"
                    class="w-full input-oscuro"
                    panelClass="panel-autocomplete-overlay"
                    appendTo="body"
                    @update:modelValue="(val) => {
                        const m = String(val).toLowerCase();
                        const esOtroVal = m === 'otro' || m === 'other';
                        emit('update:trabajador', {
                            ...props.trabajador,
                            motivo: val,
                            motivoOtro: esOtroVal ? props.trabajador.motivoOtro : ''
                        });
                    }"
                />
                <InputText
                    v-if="esMotivoOtro"
                    :modelValue="trabajador.motivoOtro"
                    @update:modelValue="(val) => actualizarTrabajador('motivoOtro', val)"
                    :placeholder="t('detalle_pedido.ph_motivo_escribe', 'Escribe la razón...')"
                    class="w-full input-oscuro mt-2"
                    autocomplete="off"
                />
            </div>
        </div>

        <!-- Lista de Herramientas -->
        <h4 class="text-color text-lg font-bold border-top-1 surface-border pt-3 mb-3">
            {{ t('detalle_pedido.titulo_herramientas', 'Herramientas a entregar:') }}
        </h4>
        
        <div v-if="pedido.length === 0" class="mensaje-vacio text-500 text-base italic mb-3">
            {{ t('detalle_pedido.mensaje_vacio', 'Aún no has agregado herramientas.') }}
        </div>

        <ul v-else class="list-none p-0 m-0 flex flex-column gap-3 overflow-y-auto">
            <li 
                v-for="item in pedido" 
                :key="item.id" 
                class="tarjeta-herramienta flex flex-column p-3 border-round-xl transition-all transition-duration-200 gap-3 shadow-1"
            >
                <div class="flex align-items-center justify-content-between gap-2">
                    <div class="flex flex-column min-w-0">
                        <span class="badge-codigo text-xs font-mono font-bold">{{ item.codigo }}</span>
                        <span class="text-base font-bold text-color line-height-2 mt-1">{{ item.nombre }}</span>
                    </div>
                    
                    <Button
                        icon="pi pi-eye"
                        class="p-button-rounded p-button-text p-button-info p-0 w-2rem h-2rem flex-shrink-0"
                        @click="verDetalles(item)"
                        :aria-label="t('detalle_pedido.aria_ver_detalles', 'Ver detalles')"
                    />
                </div>

                <div class="flex align-items-center justify-content-between border-top-1 surface-border pt-2">
                    <div class="flex align-items-center gap-3">
                        <div class="control-stepper flex align-items-center border-round-lg overflow-hidden border-1 surface-border">
                            <button 
                                type="button" 
                                class="btn-stepper flex align-items-center justify-content-center"
                                :disabled="item.cantidadLlevada <= 1"
                                @click="actualizarCantidad(item.id, item.cantidadLlevada - 1)"
                            >
                                <i class="pi pi-minus text-sm"></i>
                            </button>
                            
                            <input
                                :id="'cantidad_' + item.id"
                                type="number"
                                :value="item.cantidadLlevada"
                                @input="(e) => actualizarCantidad(item.id, Number(e.target.value))"
                                min="1"
                                :max="item.cantidadDisponible"
                                class="input-stepper text-center font-bold text-base text-color border-none"
                            />

                            <button 
                                type="button" 
                                class="btn-stepper flex align-items-center justify-content-center"
                                :disabled="item.cantidadLlevada >= item.cantidadDisponible"
                                @click="actualizarCantidad(item.id, item.cantidadLlevada + 1)"
                            >
                                <i class="pi pi-plus text-sm"></i>
                            </button>
                        </div>

                        <span class="text-sm text-color-secondary font-medium">
                            / {{ item.cantidadDisponible }} disp.
                        </span>
                    </div>
                    
                    <Button
                        icon="pi pi-trash"
                        class="p-button-rounded p-button-text p-button-danger p-0 w-2rem h-2rem flex-shrink-0"
                        @click="emit('quitar', item.id)"
                        :aria-label="t('detalle_pedido.aria_quitar', 'Quitar')"
                    />
                </div>
            </li>
        </ul>

        <!-- Botón de Registro -->
        <div :class="[pedido.length === 0 ? 'mt-2' : 'mt-auto pt-4']">
            <div v-if="(trabajador.numero || trabajador.nombre) && !trabajadorConfirmado" class="text-red-400 text-xs mb-2 flex align-items-center font-semibold">
                <i class="pi pi-exclamation-triangle mr-2"></i> {{ t('detalle_pedido.error_trabajador', 'Empleado no seleccionado de la lista') }}
            </div>
            
            <div v-else-if="trabajadorConfirmado && !camposCompletos" class="text-orange-400 text-xs mb-2 flex align-items-center font-semibold">
                <i class="pi pi-info-circle mr-2"></i> Completa Orden, Máquina y Motivo.
            </div>
            
            <Button
                :label="t('detalle_pedido.btn_registrar', 'Registrar Salida')"
                icon="pi pi-check"
                class="w-full p-button-success p-button-lg shadow-2"
                :disabled="!trabajadorValido || pedido.length === 0"
                @click="manejarRegistro"
            />
        </div>

        <!-- Componente Modal de Detalles Reutilizable -->
        <ModalDetalleHerramienta 
            v-model:visible="mostrarDetalles" 
            :herramienta="herramientaActual" 
            :ocultarBotonAgregar="true"
        />

        <!-- Modal Autorización por Daños -->
        <Dialog v-model:visible="mostrarModalAuth" modal header="Autorización Requerida" :style="{ width: '90vw', maxWidth: '420px' }" @hide="limpiarModalAuth">
            <div class="flex flex-column gap-3 pt-2">
                <p class="m-0 text-color-secondary text-sm">El motivo requiere código PIN enviado al correo del administrador.</p>
                <div class="field mb-0">
                    <label for="adminSelect" class="font-semibold block mb-2 text-sm">Administrador</label>
                    <div class="flex gap-2">
                        <Select inputId="adminSelect" v-model="adminSeleccionado" :options="administradores" optionLabel="nombre" optionValue="id" placeholder="Elegir..." class="w-full" :disabled="enviandoCodigo || verificandoCodigo" />
                        <Button :icon="codigoEnviado ? 'pi pi-refresh' : 'pi pi-send'" class="p-button-primary flex-shrink-0" :loading="enviandoCodigo" :disabled="!adminSeleccionado || enviandoCodigo || verificandoCodigo" @click="solicitarCodigoAutorizacion" />
                    </div>
                </div>
                <div v-if="codigoEnviado && !errorAuth" class="text-green-400 text-xs flex align-items-center font-medium"><i class="pi pi-check-circle mr-1"></i> Código enviado.</div>
                <div v-if="errorAuth" class="text-red-400 text-xs flex align-items-center font-medium"><i class="pi pi-times-circle mr-1"></i> {{ errorAuth }}</div>
                <div class="field mb-0">
                    <label for="adminPin" class="font-semibold block mb-2 text-sm">Código PIN</label>
                    <InputText id="adminPin" v-model="codigoAdmin" type="password" maxlength="6" placeholder="PIN de 6 dígitos" class="w-full" autocomplete="off" :disabled="!codigoEnviado || verificandoCodigo" />
                </div>
            </div>
            <template #footer>
                <div class="flex justify-content-end gap-2">
                    <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="limpiarModalAuth" />
                    <Button label="Autorizar" icon="pi pi-check" class="p-button-success" :loading="verificandoCodigo" :disabled="!codigoAdmin || codigoAdmin.length < 6 || !hashValidacion || verificandoCodigo" @click="confirmarAutorizacion" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
/* =======================================================
   HOMOLOGACIÓN EXACTA DE AUTOCOMPLETE Y SELECT
   ======================================================= */

/* 1. Contenedor de AutoComplete */
:deep(.p-autocomplete.input-oscuro) {
    display: flex;
    width: 100%;
    border-radius: var(--content-border-radius, 6px) !important;
    overflow: hidden;
}

/* 2. Input interno del AutoComplete */
:deep(.p-autocomplete.input-oscuro .p-autocomplete-input) {
    width: 100% !important;
    background-color: transparent !important;
    border: none !important;
    border-radius: inherit !important;
    color: inherit !important;
    box-shadow: none !important;
    padding: 0.5rem 0.75rem !important;
    font-size: 1rem !important;
}

/* 3. Ajuste para Select */
:deep(.p-select.input-oscuro) {
    display: flex;
    align-items: center;
    width: 100%;
    border-radius: var(--content-border-radius, 6px) !important;
}

/* =======================================================
   ESTILOS GENERALES DEL COMPONENTE
   ======================================================= */
.panel-principal {
    background-color: var(--surface-card);
    border: 1px solid var(--surface-border);
}

.tarjeta-herramienta {
    background-color: var(--surface-section);
    border: 1px solid var(--surface-border);
}

.tarjeta-herramienta:hover {
    border-color: var(--primary-color) !important;
}

.badge-codigo {
    color: var(--primary-color);
    letter-spacing: 0.5px;
}

/* Stepper */
.control-stepper {
    background-color: var(--surface-ground);
}

.btn-stepper {
    border: none;
    background: transparent;
    color: var(--text-color);
    width: 2.5rem;
    height: 2.2rem;
    cursor: pointer;
    transition: background-color 0.15s;
}

.btn-stepper:hover:not(:disabled) {
    background-color: var(--surface-hover);
}

.btn-stepper:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.input-stepper {
    width: 2.5rem;
    background: transparent;
    outline: none;
    padding: 0;
}

.input-stepper::-webkit-inner-spin-button, 
.input-stepper::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}

.input-stepper[type=number] {
  appearance: textfield;      
  -moz-appearance: textfield;  
}
</style>

<style>
/* 1. MODO OSCURO (Por defecto) */
.panel-autocomplete-overlay {
    background-color: #121820 !important;
    border: 1px solid #4a5568 !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
    z-index: 9999 !important;
}

.panel-autocomplete-overlay .p-autocomplete-option,
.panel-autocomplete-overlay .p-select-option {
    color: #ffffff !important;
    background-color: #121820 !important;
}

.panel-autocomplete-overlay .p-autocomplete-option:hover,
.panel-autocomplete-overlay .p-select-option:hover {
    background-color: #1f2937 !important;
}

/* 2. MODO CLARO (Activado por html.light-theme) */
html.light-theme .panel-autocomplete-overlay {
    background-color: #ffffff !important;
    border: 1px solid #cbd5e1 !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
}

html.light-theme .panel-autocomplete-overlay .p-autocomplete-option,
html.light-theme .panel-autocomplete-overlay .p-select-option {
    color: #0f172a !important;
    background-color: #ffffff !important;
}

html.light-theme .panel-autocomplete-overlay .p-autocomplete-option:hover,
html.light-theme .panel-autocomplete-overlay .p-select-option:hover {
    background-color: #f1f5f9 !important;
}
</style>