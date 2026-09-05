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

// Validación básica de correo electrónico
const esCorreoValido = (email) => {
    if (!email) return true; // Es opcional en BD
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
            summary: 'Correo inválido', 
            detail: 'Por favor ingrese un correo electrónico con formato válido.', 
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

        <TablaUsuarios
            :usuarios="usuarios"
            :filtros="filtros"
            :rolLogueado="rolLogueado"
            @editar="prepararEdicion"
            @eliminar="eliminarUsuario"
        />

        <!-- VENTANA EMERGENTE (MODAL) CON LOS NUEVOS CAMPOS -->
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
                <!-- No. Trabajador -->
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

                <!-- Nombre Completo -->
                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">{{ t('view_usuarios.label_nombre') }}</span>
                    <InputText 
                        name="nombreCompleto"
                        v-model="usuarioActual.nombre" 
                        class="w-full input-oscuro" 
                    />
                </div>

                <!-- Correo Electrónico (NUEVO) -->
                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">Correo Electrónico</span>
                    <InputText 
                        name="correo"
                        type="email"
                        v-model="usuarioActual.correo" 
                        placeholder="ejemplo@crissair.com"
                        class="w-full input-oscuro" 
                    />
                </div>

                <!-- Teléfono (NUEVO) -->
                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">Teléfono / Extensión</span>
                    <InputText 
                        name="telefono"
                        v-model="usuarioActual.telefono" 
                        placeholder="Ej. 6641234567"
                        class="w-full input-oscuro" 
                    />
                </div>

                <!-- Tarjeta RFID (NUEVO)
                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">Tarjeta RFID (UID)</span>
                    <InputNumber 
                        name="tarjetaRfid"
                        v-model="usuarioActual.tarjetaRfid" 
                        :useGrouping="false" 
                        placeholder="Número de tarjeta o tag"
                        class="w-full" 
                        inputClass="w-full input-oscuro" 
                    />
                </div> -->

                <!-- Contraseña -->
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

                <!-- Departamento -->
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

                <!-- Rol -->
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