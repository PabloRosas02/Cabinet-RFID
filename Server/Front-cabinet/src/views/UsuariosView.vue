<script setup>
import { ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Password from 'primevue/password'; 
import Select from 'primevue/select';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast'; 
import { useToast } from 'primevue/usetoast';

import { useUsuarios } from '../composables/useUsuarios';

const rolLogueado = ref('ADMINISTRADOR'); 
const toast = useToast();

// Extraemos las variables y funciones del composable
const { 
    usuarios, filtros, mostrarModal, usuarioActual, esEdicion,
    prepararNuevoUsuario, prepararEdicion, guardarUsuario, eliminarUsuario 
} = useUsuarios();

// Opciones para los Selects del formulario
const opcionesDepartamentos = ref(['INGENIERIA', 'MANTENIMIENTO', 'ADMINISTRACION']);
const opcionesRoles = ref(['ADMINISTRADOR', 'SUPERVISOR_ALMACEN', 'ALMACENISTA', 'OPERADOR']);

const getSeverityRol = (rol) => {
    switch (rol) {
        case 'ADMINISTRADOR': return 'danger';
        case 'SUPERVISOR_ALMACEN': return 'warn';
        case 'ALMACENISTA': return 'info';
        case 'OPERADOR': return 'success';
        default: return 'secondary';
    }
};

// Función de validación de campos obligatorios
const validarYGuardar = async () => {
    let camposFaltantes = [];

    if (!usuarioActual.value.numTrabajador || usuarioActual.value.numTrabajador.toString().trim() === '') {
        camposFaltantes.push('Número de Empleado');
    }
    if (!usuarioActual.value.nombre || usuarioActual.value.nombre.trim() === '') {
        camposFaltantes.push('Nombre Completo');
    }
    // Si es un empleado nuevo, la contraseña es obligatoria. En edición es opcional.
    if (!esEdicion.value && (!usuarioActual.value.contrasena || usuarioActual.value.contrasena.trim() === '')) {
        camposFaltantes.push('Contraseña');
    }
    if (!usuarioActual.value.depart || usuarioActual.value.depart.toString().trim() === '') {
        camposFaltantes.push('Departamento');
    }
    if (!usuarioActual.value.rol || usuarioActual.value.rol.toString().trim() === '') {
        camposFaltantes.push('Nivel de Acceso (Rol)');
    }

    // Si falta algún campo obligatorio, se detiene el proceso y se notifica detalladamente
    if (camposFaltantes.length > 0) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Campos obligatorios faltantes', 
            detail: `Te falta completar: ${camposFaltantes.join(', ')}.`, 
            life: 5000 
        });
        return;
    }

    // Si todo está correcto (el RFID es opcional), procedemos a guardar
    try {
        await guardarUsuario();
    } catch (error) {
        // Los errores del servidor ya se manejan dentro del composable, pero evitamos excepciones no capturadas
    }
};
</script>

<template>
    <Toast /> 
    
    <!-- Contenedor Principal Oscuro (padding ajustado para móvil) -->
    <div class="panel-principal p-3 md:p-4 border-round-xl shadow-1 mt-4">
        
        <!-- Encabezado de la vista -->
        <div class="flex justify-content-between align-items-center mb-4">
            <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">Administración de Usuarios</h2>
        </div>

        <!-- Barra de herramientas (Buscador y Botón Nuevo) -->
        <div class="flex flex-column md:flex-row justify-content-between mb-4 gap-3 align-items-start md:align-items-center">
            
            <div class="w-full md:w-auto">
                <!-- Buscador 100% ancho en móvil, 20rem en escritorio -->
                <IconField iconPosition="left" class="w-full md:w-20rem">
                    <InputIcon class="pi pi-search" />
                    <InputText 
                        name="buscadorGeneral" 
                        aria-label="Buscar empleado" 
                        v-model="filtros['global'].value" 
                        placeholder="Buscar empleado..." 
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

        <!-- Tabla de Usuarios (Con scroll horizontal responsivo) -->
        <DataTable 
            :value="usuarios" 
            paginator 
            :rows="10" 
            dataKey="id" 
            v-model:filters="filtros"
            :globalFilterFields="['nombre', 'numTrabajador', 'departamento']"
            emptyMessage="No se encontraron usuarios en el sistema."
            class="tabla-oscura w-full"
            scrollable
        >
            <!-- A cada columna se le asigna un min-width para garantizar su legibilidad en móvil -->
            <Column field="numTrabajador" header="No. Empleado" sortable style="min-width: 140px; width: 15%;">
                <template #body="{ data }"><span class="font-bold text-400">{{ data.numTrabajador }}</span></template>
            </Column>
            <Column field="nombre" header="Nombre Completo" sortable style="min-width: 220px; width: 25%;">
                <template #body="{ data }"><span class="text-white">{{ data.nombre }}</span></template>
            </Column>
            <Column field="depart" header="Departamento" sortable style="min-width: 160px; width: 15%;"></Column>
            
            <Column header="Rol (Acceso)" style="min-width: 200px; width: 15%;">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.rol.replace('_', ' ')" :severity="getSeverityRol(slotProps.data.rol)" class="px-3 py-1 font-bold tag-rol" />
                </template>
            </Column>

            <Column header="Tarjeta RFID" style="min-width: 160px; width: 15%;">
                <template #body="slotProps">
                    <span v-if="slotProps.data.tarjetaRfid" class="rfid-badge font-bold" style="color: #38bdf8;">
                        <i class="pi pi-id-card mr-2"></i> {{ slotProps.data.tarjetaRfid }}
                    </span>
                    <Tag v-else value="Pendiente" severity="secondary" class="tag-rol" />
                </template>
            </Column>
            
            <Column v-if="rolLogueado === 'ADMINISTRADOR'" header="Acciones" style="min-width: 120px; width: 15%;">
                <template #body="{ data }">
                    <div class="action-buttons flex gap-2">
                        <Button icon="pi pi-pencil" class="p-button-rounded btn-accion p-button-info" @click="prepararEdicion(data)" tooltip="Editar" tooltipOptions="{position: 'top'}" />
                        <Button icon="pi pi-trash" class="p-button-rounded btn-accion p-button-danger" @click="eliminarUsuario(data)" tooltip="Eliminar" tooltipOptions="{position: 'top'}" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- VENTANA EMERGENTE (MODAL) PARA CREAR/EDITAR -->
        <Dialog 
            v-model:visible="mostrarModal" 
            :header="esEdicion ? 'Editar Empleado' : 'Nuevo Empleado'" 
            :modal="true" 
            :breakpoints="{ '1199px': '75vw', '575px': '95vw' }" 
            :style="{ width: '420px' }" 
            class="modal-oscuro"
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

                <div class="field flex flex-column gap-1">
                    <span class="label-blanco">Código RFID (Opcional)</span>
                    <InputNumber 
                        name="rfid"
                        aria-label="Código RFID"
                        v-model="usuarioActual.tarjetaRfid" 
                        :useGrouping="false" 
                        placeholder="Asignar luego..." 
                        class="w-full" 
                        inputClass="w-full input-oscuro" 
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

<style scoped>
/* =========================================================
   ESTILOS LOCALES (SOLO PARA ESTE COMPONENTE)
   ========================================================= */
.panel-principal { 
    background-color: #2a323d !important; 
    color: #ffffff; 
    border: 1px solid #4a5568 !important; 
    overflow-x: hidden; /* Evitar scroll a nivel del panel */
}
.label-blanco { color: #cbd5e1; font-weight: 500; font-size: 0.95rem; }

/* Botón Nuevo / Guardar (Azul brillante) */
.btn-nuevo {
    background-color: #3b82f6 !important; 
    border: none !important;
    color: white !important;
}
.btn-nuevo:hover { background-color: #2563eb !important; }

/* Botones de acción en la tabla (Translúcidos) */
:deep(.btn-accion.p-button-info) { background-color: rgba(56, 189, 248, 0.15) !important; color: #38bdf8 !important; border: none !important; }
:deep(.btn-accion.p-button-danger) { background-color: rgba(239, 68, 68, 0.15) !important; color: #f87171 !important; border: none !important; }
:deep(.btn-accion:hover) { filter: brightness(1.3); }

/* =========================================================
   BLINDAJE DE LA TABLA (CONSISTENCIA GLOBAL Y RESPONSIVE)
   ========================================================= */
:deep(.p-datatable), :deep(.p-datatable-wrapper), :deep(.p-datatable-table) { background-color: transparent !important; }
:deep(.p-datatable-thead > tr > th) {
    background-color: transparent !important; 
    color: #94a3b8 !important; border: none !important; border-bottom: 1px solid #4a5568 !important; padding: 1.2rem 1rem !important;
}
:deep(.p-datatable-tbody > tr > td) {
    background-color: #121820 !important; color: #94a3b8 !important; border: none !important; border-bottom: 1px solid #1e252d !important; 
}
:deep(.p-datatable-tbody > tr:hover > td) { background-color: #1e252d !important; }
:deep(.p-datatable-empty-message > td) { background-color: #121820 !important; color: #94a3b8 !important; text-align: center !important; padding: 2rem !important; }

/* Scroll horizontal fino en dispositivos móviles (Oculta la barra fea) */
:deep(.p-datatable-wrapper::-webkit-scrollbar) { height: 6px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-thumb) { background: #4a5568; border-radius: 4px; }
:deep(.p-datatable-wrapper::-webkit-scrollbar-track) { background: transparent; }

/* Paginador */
:deep(.p-paginator) { background-color: transparent !important; border: none !important; margin-top: 1rem; border-top: 1px solid #4a5568 !important; padding-top: 1rem !important; }
:deep(.p-paginator .p-paginator-page), :deep(.p-paginator .p-paginator-first), :deep(.p-paginator .p-paginator-prev), :deep(.p-paginator .p-paginator-next), :deep(.p-paginator .p-paginator-last) { color: #94a3b8 !important; background-color: transparent !important; }
:deep(.p-paginator .p-paginator-page.p-highlight) { background-color: #5ab1ce !important; color: #ffffff !important; border-radius: 50%; }

/* =========================================================
   ETIQUETAS DE ROLES - TEMA OSCURO
   ========================================================= */
:deep(.tag-rol) { border-radius: 6px !important; }
:deep(.p-tag.p-tag-danger) { background-color: rgba(239, 68, 68, 0.15) !important; color: #f87171 !important; }
:deep(.p-tag.p-tag-warning), :deep(.p-tag.p-tag-warn) { background-color: rgba(245, 158, 11, 0.15) !important; color: #fbbf24 !important; }
:deep(.p-tag.p-tag-info) { background-color: rgba(56, 189, 248, 0.15) !important; color: #38bdf8 !important; }
:deep(.p-tag.p-tag-success) { background-color: rgba(34, 197, 94, 0.15) !important; color: #4ade80 !important; }
:deep(.p-tag.p-tag-secondary) { background-color: rgba(148, 163, 184, 0.15) !important; color: #cbd5e1 !important; }
</style>

<style>
/* =========================================================
   ESTILOS GLOBALES PARA INPUTS Y VENTANAS FLOTANTES (MODALS)
   ========================================================= */
/* Buscador e Inputs generales */
input.input-oscuro, .p-iconfield input, .p-inputtext.input-oscuro, .p-inputnumber-input.input-oscuro { background-color: #121820 !important; color: #ffffff !important; border: 1px solid #4a5568 !important; }
input.input-oscuro:focus, .p-iconfield input:focus, .p-inputtext.input-oscuro:focus { border-color: #5ab1ce !important; box-shadow: 0 0 0 1px #5ab1ce !important; }
input.input-oscuro::placeholder, .p-iconfield input::placeholder { color: #94a3b8 !important; }
.p-iconfield .p-inputicon { color: #94a3b8 !important; }

/* Menú Select */
.input-oscuro.p-select { background-color: #121820 !important; color: #ffffff !important; border: 1px solid #4a5568 !important; }
.input-oscuro.p-select:focus, .input-oscuro.p-select-focus { border-color: #5ab1ce !important; box-shadow: 0 0 0 1px #5ab1ce !important; }
.input-oscuro .p-select-label { color: #ffffff !important; }

/* Overlay del Menú Select */
.menu-oscuro-global { background-color: #1e252d !important; border: 1px solid #4a5568 !important; color: #ffffff !important; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5) !important;}
.menu-oscuro-global .p-select-list { background-color: transparent !important; padding: 0 !important; }
.menu-oscuro-global .p-select-option { color: #cbd5e1 !important; background-color: transparent !important; padding: 0.75rem 1rem !important; }
.menu-oscuro-global .p-select-option:hover, .menu-oscuro-global .p-select-option.p-focus { background-color: #36464d !important; color: #ffffff !important; }
.menu-oscuro-global .p-select-option.p-select-option-selected { background-color: #5ab1ce !important; color: #ffffff !important; }

/* =========================================================
   DISEÑO OSCURO PARA EL MODAL (NUEVO / EDITAR EMPLEADO)
   ========================================================= */
.modal-oscuro {
    background-color: #1e252d !important;
    border: 1px solid #4a5568 !important; 
    border-radius: 8px !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
}
.modal-oscuro .p-dialog-header, 
.modal-oscuro .p-dialog-content, 
.modal-oscuro .p-dialog-footer {
    background-color: #1e252d !important; 
    color: #ffffff !important; 
    border: none !important;
    padding-left: 1.5rem !important;
    padding-right: 1.5rem !important;
}
.modal-oscuro .p-dialog-header { 
    border-bottom: 1px solid #2a323d !important; 
    padding-top: 1.5rem !important;
}
.modal-oscuro .p-dialog-footer { 
    border-top: 1px solid #2a323d !important; 
    padding-bottom: 1.5rem !important;
}
.modal-oscuro .p-dialog-header-icon { color: #94a3b8 !important; }
.modal-oscuro .p-dialog-header-icon:hover { background-color: rgba(255, 255, 255, 0.05) !important; color: #ffffff !important; }

/* Botón Cancelar blindado contra el modo claro */
.btn-cancelar {
    background-color: transparent !important;
    color: #94a3b8 !important;
    border: 1px solid transparent !important;
}
.btn-cancelar:hover {
    background-color: rgba(255, 255, 255, 0.05) !important;
    color: #ffffff !important;
}

/* Color del ícono del ojito en el input de contraseña */
.p-password .p-icon {
    color: #94a3b8 !important;
}
.p-password .p-icon:hover {
    color: #ffffff !important;
}
</style>