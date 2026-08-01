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

import { useUsuarios } from '@/composables/useUsuarios';
import TablaUsuarios from '@/components/usuarios/TablaUsuarios.vue';

const rolLogueado = ref('ADMINISTRADOR'); 
const toast = useToast();

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
        camposFaltantes.push('Número de Empleado');
    }
    if (!usuarioActual.value.nombre || usuarioActual.value.nombre.trim() === '') {
        camposFaltantes.push('Nombre Completo');
    }
    if (!esEdicion.value && (!usuarioActual.value.contrasena || usuarioActual.value.contrasena.trim() === '')) {
        camposFaltantes.push('Contraseña');
    }
    if (!usuarioActual.value.depart || usuarioActual.value.depart.toString().trim() === '') {
        camposFaltantes.push('Departamento');
    }
    if (!usuarioActual.value.rol || usuarioActual.value.rol.toString().trim() === '') {
        camposFaltantes.push('Nivel de Acceso (Rol)');
    }

    if (camposFaltantes.length > 0) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Campos obligatorios faltantes', 
            detail: `Te falta completar: ${camposFaltantes.join(', ')}.`, 
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
            <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">Administración de Usuarios</h2>
        </div>

        <div class="flex flex-column md:flex-row justify-content-between mb-4 gap-3 align-items-start md:align-items-center">
            <div class="w-full md:w-auto">
                <IconField iconPosition="left" class="w-full md:w-30rem">
                    <InputIcon class="pi pi-search" />
                    <InputText 
                        name="buscadorGeneral" 
                        aria-label="Buscar empleado" 
                        v-model="filtros['global'].value" 
                        placeholder="Buscar empleado por número o nombre..." 
                        class="w-full input-oscuro" 
                    />
                </IconField>
            </div>
            
            <div class="w-full md:w-auto">
                <Button 
                    v-if="rolLogueado === 'ADMINISTRADOR'"
                    label="Nuevo Empleado" 
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
            :header="esEdicion ? 'Editar Empleado' : 'Nuevo Empleado'" 
            :modal="true" 
            :breakpoints="{ '1199px': '75vw', '575px': '95vw' }" 
            :style="{ width: '420px' }" 
            class="modal-oscuro"
            dismissableMask
        >
            <div class="flex flex-column gap-2 pt-2">
                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">Número de Empleado *</span>
                    <InputNumber 
                        name="numTrabajador"
                        aria-label="Número de Empleado"
                        v-model="usuarioActual.numTrabajador" 
                        :useGrouping="false" 
                        class="w-full" 
                        inputClass="w-full input-oscuro" 
                    />
                </div>

                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">Nombre Completo *</span>
                    <InputText 
                        name="nombreCompleto"
                        aria-label="Nombre Completo"
                        v-model="usuarioActual.nombre" 
                        class="w-full input-oscuro" 
                    />
                </div>

                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">
                        {{ esEdicion ? 'Nueva Contraseña (Opcional)' : 'Contraseña *' }}
                    </span>
                    <Password 
                        name="contrasena"
                        aria-label="Contraseña"
                        v-model="usuarioActual.contrasena" 
                        :feedback="false" 
                        toggleMask 
                        class="w-full" 
                        inputClass="w-full input-oscuro" 
                        :placeholder="esEdicion ? 'Dejar en blanco para no cambiar' : 'Asigna una contraseña segura'" 
                    />
                </div>

                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">Departamento *</span>
                    <Select 
                        name="departamento"
                        aria-label="Departamento"
                        v-model="usuarioActual.depart" 
                        :options="opcionesDepartamentos" 
                        placeholder="Seleccione departamento"
                        class="w-full input-oscuro" 
                        overlayClass="menu-oscuro-global" 
                        panelClass="menu-oscuro-global" 
                    />
                </div>

                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">Nivel de Acceso (Rol) *</span>
                    <Select 
                        name="rol"
                        aria-label="Nivel de Acceso"
                        v-model="usuarioActual.rol" 
                        :options="opcionesRoles" 
                        placeholder="Seleccione rol"
                        class="w-full input-oscuro" 
                        overlayClass="menu-oscuro-global" 
                        panelClass="menu-oscuro-global" 
                    />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-content-end gap-2 mt-2">
                    <Button label="Cancelar" icon="pi pi-times" class="btn-cancelar" @click="mostrarModal = false" />
                    <Button label="Guardar" icon="pi pi-check" class="btn-nuevo font-bold" @click="validarYGuardar" />
                </div>
            </template>
        </Dialog>

    </div>
</template>