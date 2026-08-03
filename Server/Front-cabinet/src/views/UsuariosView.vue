<script setup>
import { ref } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Password from 'primevue/password'; 
import Select from 'primevue/select';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast'; 
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

// Función de validación de campos obligatorios
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

        <div class="flex flex-column md:flex-row justify-content-between mb-4 gap-3 align-items-start md:align-items-center">
            <div class="w-full md:w-auto">
                <IconField iconPosition="left" class="w-full md:w-30rem">
                    <InputIcon class="pi pi-search" />
                    <InputText 
                        name="buscadorGeneral" 
                        :aria-label="t('view_usuarios.buscar_aria')" 
                        v-model="filtros['global'].value" 
                        :placeholder="t('view_usuarios.buscar_placeholder')" 
                        class="w-full input-oscuro" 
                    />
                </IconField>
            </div>
            
            <div class="w-full md:w-auto">
                <Button 
                    v-if="rolLogueado === 'ADMINISTRADOR'"
                    :label="t('view_usuarios.btn_nuevo')" 
                    icon="pi pi-user-plus" 
                    class="btn-nuevo font-bold w-full md:w-auto" 
                    @click="prepararNuevoUsuario" 
                />
            </div>
        </div>

        <!-- ========================================================= -->
        <!-- LLAMADA A NUESTRO NUEVO COMPONENTE EXTRAÍDO -->
        <!-- ========================================================= -->
        <TablaUsuarios
            :usuarios="usuarios"
            :filtros="filtros"
            :rolLogueado="rolLogueado"
            @editar="prepararEdicion"
            @eliminar="eliminarUsuario"
        />

        <!-- VENTANA EMERGENTE (MODAL) PARA CREAR/EDITAR -->
        <Dialog 
            v-model:visible="mostrarModal" 
            :header="esEdicion ? t('view_usuarios.modal_titulo_editar') : t('view_usuarios.modal_titulo_nuevo')" 
            :modal="true" 
            :breakpoints="{ '1199px': '75vw', '575px': '95vw' }" 
            :style="{ width: '420px' }" 
            class="modal-oscuro"
            dismissableMask
        >
            <div class="flex flex-column gap-2 pt-2">
                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">{{ t('view_usuarios.label_num_empleado') }}</span>
                    <InputNumber 
                        name="numTrabajador"
                        :aria-label="t('view_usuarios.val_num_empleado')"
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
                        :aria-label="t('view_usuarios.val_nombre')"
                        v-model="usuarioActual.nombre" 
                        class="w-full input-oscuro" 
                    />
                </div>

                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">
                        {{ esEdicion ? t('view_usuarios.label_pass_editar') : t('view_usuarios.label_pass_nuevo') }}
                    </span>
                    <Password 
                        name="contrasena"
                        :aria-label="t('view_usuarios.val_pass')"
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
                        :aria-label="t('view_usuarios.val_departamento')"
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
                        :aria-label="t('view_usuarios.val_rol')"
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