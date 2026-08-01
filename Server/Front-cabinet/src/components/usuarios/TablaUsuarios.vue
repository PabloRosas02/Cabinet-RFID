<script setup>
import { computed } from 'vue';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import TablaGenerica from '@/components/TablaGenerica.vue';

const props = defineProps({
    usuarios: {
        type: Array,
        required: true
    },
    filtros: {
        type: Object,
        required: true
    },
    rolLogueado: {
        type: String,
        required: true
    }
});

const emit = defineEmits(['editar', 'eliminar']);

const getSeverityRol = (rol) => {
    switch (rol) {
        case 'ADMINISTRADOR': return 'danger';
        case 'SUPERVISOR_ALMACEN': return 'warn';
        case 'ALMACENISTA': return 'info';
        case 'OPERADOR': return 'success';
        default: return 'secondary';
    }
};

// =====================================================
// DEFINICIÓN DINÁMICA DE COLUMNAS
// =====================================================
const columnasUsuarios = computed(() => {
    const cols = [
        { field: 'numTrabajador', header: 'No. Empleado', sortable: true, width: '15%', minWidth: '140px', slotName: 'numTrabajador' },
        { field: 'nombre', header: 'Nombre Completo', sortable: true, width: '25%', minWidth: '220px', slotName: 'nombre' },
        { field: 'depart', header: 'Departamento', sortable: true, width: '15%', minWidth: '160px' },
        { field: 'rol', header: 'Rol (Acceso)', width: '15%', minWidth: '200px', slotName: 'rol' }
    ];

    // La columna de acciones solo se inyecta si es administrador
    if (props.rolLogueado === 'ADMINISTRADOR') {
        cols.push({ header: 'Acciones', width: '15%', minWidth: '120px', slotName: 'acciones' });
    }

    return cols;
});
</script>

<template>
    <TablaGenerica
        :datos="usuarios"
        :columnas="columnasUsuarios"
        :filtros="filtros"
        :globalFilterFields="['nombre', 'numTrabajador', 'depart']"
        llaveMemoria="usuarios_sistema"
        dataKey="id"
        iconoVacio="pi-users"
        mensajeVacio="No se encontraron usuarios registrados que coincidan con la búsqueda."
    >
        <!-- Slot Personalizado: No. Empleado -->
        <template #numTrabajador="{ data }">
            <span class="font-bold text-400">{{ data.numTrabajador }}</span>
        </template>

        <!-- Slot Personalizado: Nombre -->
        <template #nombre="{ data }">
            <span class="text-white">{{ data.nombre }}</span>
        </template>

        <!-- Slot Personalizado: Rol -->
        <template #rol="{ data }">
            <Tag :value="data.rol.replace('_', ' ')" :severity="getSeverityRol(data.rol)" class="px-3 py-1 font-bold tag-rol" />
        </template>

        <!-- Slot Personalizado: Acciones -->
        <template #acciones="{ data }">
            <div class="action-buttons flex gap-2">
                <Button 
                    icon="pi pi-pencil" 
                    class="p-button-rounded btn-accion p-button-info" 
                    @click="emit('editar', data)" 
                    tooltip="Editar" 
                    tooltipOptions="{position: 'top'}" 
                />
                <Button 
                    icon="pi pi-trash" 
                    class="p-button-rounded btn-accion p-button-danger" 
                    @click="emit('eliminar', data)" 
                    tooltip="Eliminar" 
                    tooltipOptions="{position: 'top'}" 
                />
            </div>
        </template>
    </TablaGenerica>
</template>

<style scoped>
:deep(.btn-accion.p-button-info) { background-color: rgba(56, 189, 248, 0.15) !important; color: #38bdf8 !important; border: none !important; }
:deep(.btn-accion.p-button-danger) { background-color: rgba(239, 68, 68, 0.15) !important; color: #f87171 !important; border: none !important; }
:deep(.btn-accion:hover) { filter: brightness(1.3); }

/* Etiquetas de Roles */
:deep(.tag-rol) { border-radius: 6px !important; }
:deep(.p-tag.p-tag-danger) { background-color: rgba(239, 68, 68, 0.15) !important; color: #f87171 !important; }
:deep(.p-tag.p-tag-warning), :deep(.p-tag.p-tag-warn) { background-color: rgba(245, 158, 11, 0.15) !important; color: #fbbf24 !important; }
:deep(.p-tag.p-tag-info) { background-color: rgba(56, 189, 248, 0.15) !important; color: #38bdf8 !important; }
:deep(.p-tag.p-tag-success) { background-color: rgba(34, 197, 94, 0.15) !important; color: #4ade80 !important; }
:deep(.p-tag.p-tag-secondary) { background-color: rgba(148, 163, 184, 0.15) !important; color: #cbd5e1 !important; }
</style>