<script setup>
import { ref, computed, watch } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Password from 'primevue/password'; 
import Select from 'primevue/select';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast'; 
import Chip from 'primevue/chip';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n'; 

import { useUsuarios } from '@/composables/useUsuarios';
import TablaUsuarios from '@/components/usuarios/TablaUsuarios.vue';

const rolLogueado = ref('ADMINISTRADOR'); 
const toast = useToast();
const { t } = useI18n(); 

const { 
    usuarios, filtros, mostrarModal, usuarioActual, esEdicion,
    prepararNuevoUsuario, prepararEdicion, guardarUsuario, eliminarUsuario 
} = useUsuarios();

const opcionesDepartamentos = ref(['INGENIERIA', 'MANTENIMIENTO', 'ADMINISTRACION']);
const opcionesRoles = ref(['ADMINISTRADOR', 'SUPERVISOR_ALMACEN', 'ALMACENISTA', 'OPERADOR']);

// Búsqueda y Filtros por Categoría
const busquedaTexto = ref('');

// Definición de categorías traducidas dinámicamente
const categoriasDisponibles = computed(() => [
    { key: 'numTrabajador', label: t('view_usuarios.categorias.num_empleado') },
    { key: 'nombre', label: t('view_usuarios.categorias.nombre') },
    { key: 'correo', label: t('view_usuarios.categorias.correo') },
    { key: 'telefono', label: t('view_usuarios.categorias.telefono') },
    { key: 'depart', label: t('view_usuarios.categorias.departamento') },
    { key: 'rol', label: t('view_usuarios.categorias.rol') }
]);

const categoriasSeleccionadas = ref(['numTrabajador', 'nombre', 'correo', 'telefono', 'depart', 'rol']);

const toggleCategoria = (key) => {
    const idx = categoriasSeleccionadas.value.indexOf(key);
    if (idx > -1) {
        if (categoriasSeleccionadas.value.length > 1) {
            categoriasSeleccionadas.value.splice(idx, 1);
        }
    } else {
        categoriasSeleccionadas.value.push(key);
    }
};

// Placeholder reactivo que cambia con las categorías y el idioma activo
const placeholderDinamico = computed(() => {
    if (categoriasSeleccionadas.value.length === categoriasDisponibles.value.length) {
        return t('view_usuarios.ph_buscar_todos');
    }
    const nombres = categoriasDisponibles.value
        .filter(c => categoriasSeleccionadas.value.includes(c.key))
        .map(c => c.label.toLowerCase())
        .join(', ');
    return `${t('view_usuarios.buscar_en')} ${nombres}...`;
});

// Sincronización del input con el filtro global
watch(busquedaTexto, (nuevoTexto) => {
    if (filtros.value && filtros.value.global) {
        filtros.value.global.value = nuevoTexto;
    }
});

// Validación de correo
const esCorreoValido = (email) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validarYGuardar = async () => {
    let camposFaltantes = [];

    if (!usuarioActual.value.numTrabajador || usuarioActual.value.numTrabajador.toString().trim() === '') {
        camposFaltantes.push(t('view_usuarios.val_num_empleado'));
    }
    if (!usuarioActual.value.nombre || usuarioActual.value.nombre.trim() === '') {
        camposFaltantes.push(t('view_usuarios.val_nombre'));
    }
    if (!esEdicion.value && (!usuarioActual.value.contrasena || usuarioActual.value.contrasena.trim() === '')) {
        camposFaltantes.push(t('view_usuarios.val_pass'));
    }
    if (!usuarioActual.value.depart || usuarioActual.value.depart.toString().trim() === '') {
        camposFaltantes.push(t('view_usuarios.val_departamento'));
    }
    if (!usuarioActual.value.rol || usuarioActual.value.rol.toString().trim() === '') {
        camposFaltantes.push(t('view_usuarios.val_rol'));
    }

    if (usuarioActual.value.correo && !esCorreoValido(usuarioActual.value.correo)) {
        toast.add({ 
            severity: 'warn', 
            summary: t('view_usuarios.toast_correo_invalido_titulo', 'Correo inválido'), 
            detail: t('view_usuarios.toast_correo_invalido_detalle', 'Por favor ingrese un correo electrónico con formato válido.'), 
            life: 4000 
        });
        return;
    }

    if (camposFaltantes.length > 0) {
        toast.add({ 
            severity: 'warn', 
            summary: t('view_usuarios.toast_campos_faltantes_titulo'), 
            detail: t('view_usuarios.toast_campos_faltantes_detalle', { campos: camposFaltantes.join(', ') }), 
            life: 5000 
        });
        return;
    }

    try {
        await guardarUsuario();
    } catch (error) { }
};
</script>

<template>
    <Toast /> 
    
    <div class="panel-principal p-3 md:p-4 border-round-xl shadow-1 mt-4">
        
        <div class="flex justify-content-between align-items-center mb-4">
            <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">{{ t('view_usuarios.titulo') }}</h2>
        </div>

        <!-- Toolbar Superior traducida dinámicamente -->
        <div class="flex flex-column gap-3 mb-4 p-3 toolbar-oscuro border-round">

            <div class="flex flex-wrap align-items-center justify-content-between gap-2">
                <div class="flex flex-wrap align-items-center gap-2">
                    <span class="text-sm font-bold text-400 mr-2">{{ t('view_usuarios.buscar_en') }}:</span>
                    <Chip 
                        v-for="cat in categoriasDisponibles" 
                        :key="cat.key"
                        :label="cat.label"
                        :class="['chip-categoria cursor-pointer', { 'active': categoriasSeleccionadas.includes(cat.key) }]"
                        @click="toggleCategoria(cat.key)"
                    />
                </div>

                <Button 
                    v-if="rolLogueado === 'ADMINISTRADOR'"
                    :label="t('view_usuarios.btn_nuevo')" 
                    icon="pi pi-user-plus" 
                    class="btn-nuevo font-bold w-full sm:w-auto" 
                    @click="prepararNuevoUsuario" 
                />
            </div>

            <div class="w-full">
                <IconField iconPosition="left" class="w-full">
                    <InputIcon class="pi pi-search" />
                    <InputText 
                        id="buscador-usuarios"
                        name="buscadorGeneral" 
                        v-model="busquedaTexto" 
                        :placeholder="placeholderDinamico" 
                        class="input-oscuro w-full input-buscador-grande" 
                        autocomplete="off"
                    />
                </IconField>
            </div>

        </div>

        <TablaUsuarios
            :usuarios="usuarios"
            :filtros="filtros"
            :camposBusqueda="categoriasSeleccionadas"
            :rolLogueado="rolLogueado"
            @editar="prepararEdicion"
            @eliminar="eliminarUsuario"
        />

        <!-- Modal permanece igual -->
        <Dialog 
            v-model:visible="mostrarModal" 
            :header="esEdicion ? t('view_usuarios.modal_titulo_editar') : t('view_usuarios.modal_titulo_nuevo')" 
            :modal="true" 
            :breakpoints="{ '1199px': '75vw', '575px': '95vw' }" 
            :style="{ width: '480px' }" 
            class="modal-oscuro"
            dismissableMask
        >
            <div class="flex flex-column gap-2 pt-2">
                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">{{ t('view_usuarios.label_num_empleado') }}</span>
                    <InputNumber 
                        name="numTrabajador"
                        v-model="usuarioActual.numTrabajador" 
                        :useGrouping="false" 
                        class="w-full" 
                        inputClass="w-full input-oscuro" 
                    />
                </div>

                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">{{ t('view_usuarios.label_nombre') }}</span>
                    <InputText 
                        name="nombreCompleto"
                        v-model="usuarioActual.nombre" 
                        class="w-full input-oscuro" 
                    />
                </div>

                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">{{ t('view_usuarios.categorias.correo') }}</span>
                    <InputText 
                        name="correo"
                        type="email"
                        v-model="usuarioActual.correo" 
                        placeholder="ejemplo@crissair.com"
                        class="w-full input-oscuro" 
                    />
                </div>

                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">{{ t('view_usuarios.categorias.telefono') }}</span>
                    <InputText 
                        name="telefono"
                        v-model="usuarioActual.telefono" 
                        placeholder="Ej. 6641234567"
                        class="w-full input-oscuro" 
                    />
                </div>

                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">
                        {{ esEdicion ? t('view_usuarios.label_pass_editar') : t('view_usuarios.label_pass_nuevo') }}
                    </span>
                    <Password 
                        name="contrasena"
                        v-model="usuarioActual.contrasena" 
                        :feedback="false" 
                        toggleMask 
                        class="w-full" 
                        inputClass="w-full input-oscuro" 
                        :placeholder="esEdicion ? t('view_usuarios.ph_pass_editar') : t('view_usuarios.ph_pass_nuevo')" 
                    />
                </div>

                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">{{ t('view_usuarios.label_departamento') }}</span>
                    <Select 
                        name="departamento"
                        v-model="usuarioActual.depart" 
                        :options="opcionesDepartamentos" 
                        :placeholder="t('view_usuarios.ph_departamento')"
                        class="w-full input-oscuro" 
                        overlayClass="menu-oscuro-global" 
                        panelClass="menu-oscuro-global" 
                    />
                </div>

                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">{{ t('view_usuarios.label_rol') }}</span>
                    <Select 
                        name="rol"
                        v-model="usuarioActual.rol" 
                        :options="opcionesRoles" 
                        :placeholder="t('view_usuarios.ph_rol')"
                        class="w-full input-oscuro" 
                        overlayClass="menu-oscuro-global" 
                        panelClass="menu-oscuro-global" 
                    />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-content-end gap-2 mt-2">
                    <Button :label="t('view_usuarios.btn_cancelar')" icon="pi pi-times" class="btn-cancelar" @click="mostrarModal = false" />
                    <Button :label="t('view_usuarios.btn_guardar')" icon="pi pi-check" class="btn-nuevo font-bold" @click="validarYGuardar" />
                </div>
            </template>
        </Dialog>

    </div>
</template>

<style scoped>
.input-buscador-grande {
    font-size: 1.05rem;
    padding: 0.75rem 1rem 0.75rem 2.5rem !important;
}

.chip-categoria {
    background-color: #1e293b;
    color: #94a3b8;
    border: 1px solid #334155;
    transition: all 0.2s ease;
    user-select: none;
}
.chip-categoria:hover {
    border-color: #5ab1ce;
    color: #e2e8f0;
}
.chip-categoria.active {
    background-color: #0284c7;
    color: #ffffff;
    border-color: #38bdf8;
    font-weight: 600;
}
</style>