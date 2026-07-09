<script setup>
import { ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';

// Importamos TODA nuestra lógica desde el archivo separado
import { useUsuarios } from '../composables/useUsuarios';

const rolLogueado = ref('ADMINISTRADOR'); 

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
</script>

<template>
    <div class="usuarios-container">
        
        <div class="toolbar">
            <div class="toolbar-left">
                <IconField iconPosition="left">
                    <InputIcon class="pi pi-search" />
                    <!-- El buscador ahora está correctamente conectado a filtros['global'].value -->
                    <InputText v-model="filtros['global'].value" placeholder="Buscar empleado..." class="search-input" />
                </IconField>
            </div>
            
            <div class="toolbar-right">
                <Button 
                    v-if="rolLogueado === 'ADMINISTRADOR'"
                    label="Nuevo Empleado" 
                    icon="pi pi-user-plus" 
                    class="btn-crissair" 
                    @click="prepararNuevoUsuario" 
                />
            </div>
        </div>

        <div class="table-card">
            <!-- La tabla ahora usa :filters="filtros" -->
            <DataTable 
                :value="usuarios" 
                paginator 
                :rows="10" 
                dataKey="id" 
                v-model:filters="filtros"
                :globalFilterFields="['nombre', 'numTrabajador', 'departamento']"
                emptyMessage="No se encontraron usuarios en el sistema."
            >
                <Column field="numTrabajador" header="No. Empleado" sortable style="width: 15%"></Column>
                <Column field="nombre" header="Nombre Completo" sortable style="width: 25%"></Column>
                <Column field="depart" header="Departamento" sortable style="width: 15%"></Column>
                
                <Column header="Rol (Acceso)" style="width: 15%">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.rol.replace('_', ' ')" :severity="getSeverityRol(slotProps.data.rol)" />
                    </template>
                </Column>

                <Column header="Tarjeta RFID" style="width: 15%">
                    <template #body="slotProps">
                        <span v-if="slotProps.data.tarjetaRfid" class="rfid-badge">
                            <i class="pi pi-id-card"></i> {{ slotProps.data.tarjetaRfid }}
                        </span>
                        <Tag v-else value="Pendiente" severity="secondary" />
                    </template>
                </Column>
                
                <Column v-if="rolLogueado === 'ADMINISTRADOR'" header="Acciones" style="width: 20%">
                    <template #body="{ data }">
                        <div class="action-buttons">
                            <Button label="Editar" severity="info" size="small" @click="prepararEdicion(data)" />
                            <Button label="Eliminar" severity="danger" size="small" @click="eliminarUsuario(data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- VENTANA EMERGENTE (MODAL) PARA CREAR/EDITAR -->
        <Dialog v-model:visible="mostrarModal" :header="esEdicion ? 'Editar Empleado' : 'Nuevo Empleado'" :modal="true" :style="{ width: '450px' }">
            <div class="form-grid">
                
                <div class="field">
                    <label for="numTrabajador">Número de Empleado</label>
                    <InputNumber id="numTrabajador" v-model="usuarioActual.numTrabajador" :useGrouping="false" class="w-full" />
                </div>

                <div class="field">
                    <label for="nombre">Nombre Completo</label>
                    <InputText id="nombre" v-model="usuarioActual.nombre" class="w-full" />
                </div>

                <div class="field">
                    <label for="depart">Departamento</label>
                    <Select id="depart" v-model="usuarioActual.depart" :options="opcionesDepartamentos" class="w-full" />
                </div>

                <div class="field">
                    <label for="rol">Nivel de Acceso (Rol)</label>
                    <Select id="rol" v-model="usuarioActual.rol" :options="opcionesRoles" class="w-full" />
                </div>

                <div class="field">
                    <label for="rfid">Código RFID (Opcional)</label>
                    <InputNumber id="rfid" v-model="usuarioActual.tarjetaRfid" :useGrouping="false" placeholder="Asignar luego..." class="w-full" />
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" text @click="mostrarModal = false" />
                <Button label="Guardar" icon="pi pi-check" class="btn-crissair" @click="guardarUsuario" />
            </template>
        </Dialog>

    </div>
</template>

<style scoped>
.usuarios-container { display: flex; flex-direction: column; gap: 1.5rem; }
.toolbar { display: flex; justify-content: space-between; align-items: center; background-color: var(--bg-white); padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.search-input { width: 300px; }
.table-card { background-color: var(--bg-white); padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

.rfid-badge { display: flex; align-items: center; gap: 0.5rem; font-family: monospace; font-size: 1rem; color: var(--crissair-blue); }

.form-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-top: 0.5rem;
}

.field { display: flex; flex-direction: column; gap: 0.4rem; }
.field label { font-weight: 600; font-size: 0.9rem; color: var(--text-main); }
.w-full { width: 100%; }

/* CLASE NUEVA PARA ACOMODAR LOS BOTONES DE ACCIÓN */
.action-buttons {
    display: flex;
    gap: 0.5rem;
}

:deep(.btn-crissair) { background-color: var(--crissair-gold) !important; border-color: var(--crissair-gold) !important; color: var(--crissair-blue) !important; font-weight: bold; transition: background-color 0.2s; }
:deep(.btn-crissair:hover) { background-color: var(--crissair-gold-hover) !important; border-color: var(--crissair-gold-hover) !important; }
:deep(.p-datatable-header) { background: transparent; border: none; padding: 0 0 1rem 0; }
:deep(.p-datatable-thead > tr > th) { background-color: var(--bg-app); color: var(--crissair-blue); font-weight: 700; }
</style>