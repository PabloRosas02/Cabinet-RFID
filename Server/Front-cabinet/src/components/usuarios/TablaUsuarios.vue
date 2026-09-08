<script setup>
import { computed } from 'vue';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import TablaGenerica from '@/components/TablaGenerica.vue';
import { useI18n } from 'vue-i18n'; 

const props = defineProps({
    usuarios: {
        type: Array,
        required: true
    },
    filtros: {
        type: Object,
        required: true
    },
    camposBusqueda: { 
        type: Array, 
        default: () => ['numTrabajador', 'nombre', 'correo', 'telefono', 'depart', 'rol'] },
    rolLogueado: {
        type: String,
        required: true
    }
});

const emit = defineEmits(['editar', 'eliminar']);
const { t } = useI18n(); 

const getSeverityRol = (rol) => {
    switch (rol) {
        case 'ADMINISTRADOR': return 'danger';
        case 'SUPERVISOR_ALMACEN': return 'warn';
        case 'ALMACENISTA': return 'info';
        case 'OPERADOR': return 'success';
        default: return 'secondary';
    }
};

// DEFINICIÓN DINÁMICA DE COLUMNAS ACTUALIZADA
const columnasUsuarios = computed(() => {
    const cols = [
        { field: 'numTrabajador', header: t('tabla_usuarios.col_empleado'), sortable: true, width: '10%', minWidth: '120px', slotName: 'numTrabajador' },
        { field: 'nombre', header: t('tabla_usuarios.col_nombre'), sortable: true, width: '20%', minWidth: '180px', slotName: 'nombre' },
        { field: 'correo', header: 'Correo Electrónico', sortable: true, width: '20%', minWidth: '180px', slotName: 'correo' },
        { field: 'telefono', header: 'Teléfono', width: '12%', minWidth: '130px', slotName: 'telefono' },
        { field: 'depart', header: t('tabla_usuarios.col_departamento'), sortable: true, width: '13%', minWidth: '140px' },
        { field: 'rol', header: t('tabla_usuarios.col_rol'), width: '15%', minWidth: '160px', slotName: 'rol' }
    ];

    if (props.rolLogueado === 'ADMINISTRADOR') {
        cols.push({ header: t('tabla_usuarios.col_acciones'), width: '10%', minWidth: '110px', slotName: 'acciones' });
    }

    return cols;
});
</script>

<template>
    <TablaGenerica
        :datos="usuarios"
        :columnas="columnasUsuarios"
        :filtros="filtros"
        :globalFilterFields="camposBusqueda"
        llaveMemoria="usuarios_sistema"
        dataKey="id"
        iconoVacio="pi-users"
        :mensajeVacio="t('tabla_usuarios.mensaje_vacio')"
    >
        <!-- Slot: No. Empleado -->
        <template #numTrabajador="{ data }">
            <span class="font-bold">{{ data.numTrabajador }}</span>
        </template>

        <!-- Slot: Nombre -->
        <template #nombre="{ data }">
            <span>{{ data.nombre }}</span>
        </template>

        <!-- Slot: Correo -->
        <template #correo="{ data }">
            <span class="text-sm">{{ data.correo || '-' }}</span>
        </template>

        <!-- Slot: Teléfono -->
        <template #telefono="{ data }">
            <span class="text-sm">{{ data.telefono || '-' }}</span>
        </template>

        <!-- Slot: Rol -->
        <template #rol="{ data }">
            <Tag :value="data.rol ? data.rol.replace('_', ' ') : ''" :severity="getSeverityRol(data.rol)" class="px-2 py-1 font-bold text-xs" />
        </template>

        <!-- Slot: Acciones -->
        <template #acciones="{ data }">
            <div class="action-buttons flex gap-2">
                <Button 
                    icon="pi pi-pencil" 
                    class="p-button-rounded btn-accion p-button-info" 
                    @click="emit('editar', data)" 
                    :tooltip="t('tabla_usuarios.tooltip_editar')" 
                    :tooltipOptions="{position: 'top'}" 
                />
                <Button 
                    icon="pi pi-trash" 
                    class="p-button-rounded btn-accion p-button-danger" 
                    @click="emit('eliminar', data)" 
                    :tooltip="t('tabla_usuarios.tooltip_eliminar')" 
                    :tooltipOptions="{position: 'top'}" 
                />
            </div>
        </template>
    </TablaGenerica>
</template>