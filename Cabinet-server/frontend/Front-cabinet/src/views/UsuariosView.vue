<script setup>
/**
 * @file UsuariosView.vue
 * @description Panel de control para la gestión del personal.
 * Exclusivo para perfiles con rol de ADMINISTRADOR.
 */
import { ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Tag from 'primevue/tag';

// Simulación del usuario que inició sesión (Más adelante vendrá del estado global/token)
const rolLogueado = ref('ADMINISTRADOR'); 

// Variable para la barra de búsqueda
const buscar = ref('');

// Datos simulados estructurados según el schema de Prisma
const usuarios = ref([
    { id: 1, nombre: 'Pablo Yair Rosas', numTrabajador: 10452, departamento: 'INGENIERIA', rol: 'ADMINISTRADOR', tarjetaRfid: 4039779 },
    { id: 2, nombre: 'Carlos Mendoza', numTrabajador: 10453, departamento: 'MANTENIMIENTO', rol: 'SUPERVISOR_ALMACEN', tarjetaRfid: 8593021 },
    { id: 3, nombre: 'Ana López', numTrabajador: 10454, departamento: 'ADMINISTRACION', rol: 'ALMACENISTA', tarjetaRfid: null },
    { id: 4, nombre: 'Luis Torres', numTrabajador: 10455, departamento: 'MANTENIMIENTO', rol: 'OPERADOR', tarjetaRfid: 1122334 }
]);

/**
 * Asigna un color visual (severity) dependiendo del nivel de acceso
 */
const getSeverityRol = (rol) => {
    switch (rol) {
        case 'ADMINISTRADOR': return 'danger'; // Rojo para máximo nivel
        case 'SUPERVISOR_ALMACEN': return 'warn'; // Amarillo
        case 'ALMACENISTA': return 'info'; // Azul
        case 'OPERADOR': return 'success'; // Verde
        default: return 'secondary';
    }
};

// Acciones CRUD
const abrirModalNuevo = () => alert("Abriendo modal para registrar nuevo empleado...");
const editarUsuario = (user) => alert(`Abriendo edición para: ${user.nombre}`);
const eliminarUsuario = (user) => confirm(`¿Estás seguro de que deseas dar de baja permanentemente al trabajador ${user.numTrabajador}?`);
</script>

<template>
    <div class="usuarios-container">
        
        <!-- Barra de Herramientas Superior -->
        <div class="toolbar">
            <div class="toolbar-left">
                <IconField iconPosition="left">
                    <InputIcon class="pi pi-search" />
                    <InputText v-model="buscar" placeholder="Buscar por nombre o nómina..." class="search-input" />
                </IconField>
            </div>
            
            <div class="toolbar-right">
                <!-- Control de Acceso: Validamos que solo el administrador pueda crear usuarios -->
                <Button 
                    v-if="rolLogueado === 'ADMINISTRADOR'"
                    label="Nuevo Empleado" 
                    icon="pi pi-user-plus" 
                    class="btn-crissair" 
                    @click="abrirModalNuevo" 
                />
            </div>
        </div>

        <!-- Tabla de Datos -->
        <div class="table-card">
            <DataTable 
                :value="usuarios" 
                paginator 
                :rows="10" 
                dataKey="id" 
                :globalFilterFields="['nombre', 'numTrabajador', 'departamento']"
                emptyMessage="No se encontraron usuarios en el sistema."
            >
                <Column field="numTrabajador" header="No. Empleado" sortable style="width: 15%"></Column>
                <Column field="nombre" header="Nombre Completo" sortable style="width: 25%"></Column>
                <Column field="departamento" header="Departamento" sortable style="width: 15%"></Column>
                
                <Column header="Rol (Acceso)" style="width: 15%">
                    <template #body="slotProps">
                        <Tag 
                            :value="slotProps.data.rol.replace('_', ' ')" 
                            :severity="getSeverityRol(slotProps.data.rol)" 
                        />
                    </template>
                </Column>

                <Column header="Tarjeta RFID" style="width: 15%">
                    <template #body="slotProps">
                        <!-- Mostramos un aviso si el usuario aún no tiene tarjeta asignada -->
                        <span v-if="slotProps.data.tarjetaRfid" class="rfid-badge">
                            <i class="pi pi-id-card"></i> {{ slotProps.data.tarjetaRfid }}
                        </span>
                        <Tag v-else value="Pendiente" severity="secondary" />
                    </template>
                </Column>
                
                <!-- Columna de Acciones exclusiva para Administradores -->
                <Column v-if="rolLogueado === 'ADMINISTRADOR'" header="Acciones" style="width: 15%">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" text rounded severity="info" aria-label="Editar" @click="editarUsuario(slotProps.data)" />
                        <Button icon="pi pi-trash" text rounded severity="danger" aria-label="Eliminar" @click="eliminarUsuario(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

    </div>
</template>

<style scoped>
/* Compartimos la misma estructura limpia del inventario */
.usuarios-container { display: flex; flex-direction: column; gap: 1.5rem; }
.toolbar { display: flex; justify-content: space-between; align-items: center; background-color: var(--bg-white); padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.search-input { width: 300px; }
.table-card { background-color: var(--bg-white); padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

.rfid-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: monospace;
    font-size: 1rem;
    color: var(--crissair-blue);
}

:deep(.btn-crissair) { background-color: var(--crissair-gold) !important; border-color: var(--crissair-gold) !important; color: var(--crissair-blue) !important; font-weight: bold; transition: background-color 0.2s; }
:deep(.btn-crissair:hover) { background-color: var(--crissair-gold-hover) !important; border-color: var(--crissair-gold-hover) !important; }
:deep(.p-datatable-header) { background: transparent; border: none; padding: 0 0 1rem 0; }
:deep(.p-datatable-thead > tr > th) { background-color: var(--bg-app); color: var(--crissair-blue); font-weight: 700; }
</style>