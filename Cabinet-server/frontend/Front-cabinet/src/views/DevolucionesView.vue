<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Message from 'primevue/message';

// --- ESTADOS REACTIVOS ---
const pedidosPendientes = ref([]);
const cargando = ref(false);

// Modal y selección
const mostrarModal = ref(false);
const pedidoSeleccionado = ref(null);
const procesandoDevolucion = ref(false);
const mensajeFeedback = ref({ visible: false, texto: '', tipo: 'success' });

// --- LÓGICA DE DATOS ---

// 1. Cargar pedidos que no han sido devueltos
const cargarPedidosPendientes = async () => {
    cargando.value = true;
    try {
        // Asumiendo que tu backend tiene un endpoint que trae los pendientes
        // Si trae todos, puedes filtrarlos aquí: response.data.filter(p => p.estado === 'Pendiente')
        const response = await axios.get('/api/pedidos/pendientes'); 
        pedidosPendientes.value = response.data;
    } catch (error) {
        console.error("Error al cargar pedidos pendientes:", error);
    } finally {
        cargando.value = false;
    }
};

onMounted(() => {
    cargarPedidosPendientes();
});

// 2. Abrir modal para revisar la devolución
const revisarDevolucion = (pedido) => {
    pedidoSeleccionado.value = { ...pedido };
    mostrarModal.value = true;
};

// 3. Confirmar la devolución hacia el backend
const confirmarDevolucion = async () => {
    if (!pedidoSeleccionado.value) return;

    procesandoDevolucion.value = true;
    try {
        // Llamada al backend para cambiar el estado a "Devuelto" y regresar el stock
        await axios.put(`/api/pedidos/${pedidoSeleccionado.value.id}/devolver`);
        
        mensajeFeedback.value = { visible: true, texto: '¡Devolución registrada con éxito!', tipo: 'success' };
        mostrarModal.value = false;
        
        // Recargar la tabla para que desaparezca el pedido devuelto
        await cargarPedidosPendientes();
        
        // Ocultar mensaje después de 3 segundos
        setTimeout(() => { mensajeFeedback.value.visible = false; }, 3000);

    } catch (error) {
        console.error("Error al procesar la devolución:", error);
        mensajeFeedback.value = { visible: true, texto: 'Error al procesar la devolución.', tipo: 'error' };
    } finally {
        procesandoDevolucion.value = false;
    }
};

// Utilidad para formatear fechas si vienen de la BD
const formatearFecha = (fechaString) => {
    if (!fechaString) return 'N/A';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-MX', { 
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
};
</script>

<template>
  <div class="panel-principal p-4 border-round-xl shadow-1 mt-4">
    <div class="flex justify-content-between align-items-center mb-4">
        <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">Devolución de Herramientas</h2>
    </div>

    <!-- Mensaje de éxito/error -->
    <Message v-if="mensajeFeedback.visible" :severity="mensajeFeedback.tipo" class="mb-4" :closable="false">
        {{ mensajeFeedback.texto }}
    </Message>

    <!-- Tabla de Pedidos Pendientes (Mismo estilo que TablaHerramientas) -->
    <DataTable 
      :value="pedidosPendientes" 
      :paginator="true" 
      :rows="10" 
      :loading="cargando"
      dataKey="id"
      class="tabla-oscura w-full"
      emptyMessage="No hay préstamos pendientes de devolución."
    >
      <Column field="id" header="Folio Pedido" style="width: 15%">
          <template #body="{ data }">
              <span class="font-bold text-400">#{{ data.id }}</span>
          </template>
      </Column>
      <Column field="trabajadorNumero" header="No. Empleado" style="width: 15%"></Column>
      <Column field="trabajadorNombre" header="Nombre del Trabajador" style="width: 30%"></Column>
      <Column header="Fecha de Préstamo" style="width: 20%">
          <template #body="{ data }">
              {{ formatearFecha(data.fechaPedido) }}
          </template>
      </Column>
      <Column header="Estado" style="width: 10%">
          <template #body>
              <Tag severity="warning" value="Pendiente" class="px-3 py-1 bg-yellow-500 text-900 font-bold" style="border-radius: 4px;" />
          </template>
      </Column>
      <Column header="Acción" style="width: 10%" alignFrozen="right">
        <template #body="{ data }">
            <Button 
                icon="pi pi-replay" 
                label="Devolver" 
                class="btn-accion-devolver p-button-sm" 
                @click="revisarDevolucion(data)" 
            />
        </template>
      </Column>
    </DataTable>

    <!-- Modal de Confirmación de Devolución -->
    <Dialog 
        v-model:visible="mostrarModal" 
        :style="{width: '600px'}" 
        header="Revisión de Devolución" 
        :modal="true"
        class="modal-oscuro"
        dismissableMask
    >
        <div v-if="pedidoSeleccionado" class="p-4">
            <div class="mb-4 p-3 border-round surface-ground-custom">
                <p class="m-0 mb-2"><span class="text-500 font-bold">Empleado:</span> {{ pedidoSeleccionado.trabajadorNumero }} - {{ pedidoSeleccionado.trabajadorNombre }}</p>
                <p class="m-0"><span class="text-500 font-bold">Folio de Préstamo:</span> #{{ pedidoSeleccionado.id }}</p>
            </div>

            <h3 class="text-lg font-bold mb-3" style="color: #5ab1ce;">Herramientas a regresar:</h3>
            
            <ul class="lista-herramientas p-0 m-0">
                <!-- Asumiendo que el pedido trae un arreglo de 'herramientas' -->
                <li v-for="item in pedidoSeleccionado.herramientas" :key="item.id" class="flex justify-content-between align-items-center p-3 mb-2 border-round item-herramienta">
                    <div>
                        <span class="font-bold block">{{ item.nombre }}</span>
                        <span class="text-sm text-500">Código: {{ item.codigo }}</span>
                    </div>
                    <div class="text-right">
                        <Tag severity="info" class="text-sm">Cantidad: {{ item.cantidadPrestada }}</Tag>
                    </div>
                </li>
            </ul>
        </div>
        
        <template #footer>
            <div class="flex justify-content-end gap-3 mt-3">
                <Button label="Cancelar" icon="pi pi-times" class="btn-limpiar" @click="mostrarModal = false" :disabled="procesandoDevolucion" />
                <Button label="Confirmar Devolución" icon="pi pi-check" class="btn-registrar" @click="confirmarDevolucion" :loading="procesandoDevolucion" />
            </div>
        </template>
    </Dialog>
  </div>
</template>

<style scoped>
/* 1. CONTENEDOR PRINCIPAL - Estilo Pedidos */
.panel-principal {
    background-color: #2a323d !important;
    color: #ffffff;
}

/* 2. TABLA OSCURA (Idéntica a TablaHerramientas) */
:deep(.tabla-oscura .p-datatable-thead > tr > th) {
    background-color: transparent !important; 
    color: #94a3b8 !important;
    border: none !important;
    border-bottom: 1px solid #4a5568 !important;
    padding: 1.2rem 1rem;
}

:deep(.tabla-oscura .p-datatable-tbody > tr > td) {
    background-color: #121820 !important; 
    color: #ffffff !important;
    border: none !important;
    border-bottom: 1px solid #1e252d !important;
    padding: 1rem;
}

:deep(.tabla-oscura .p-datatable-tbody > tr:hover > td) {
    background-color: #1e252d !important;
}

:deep(.p-paginator) { background-color: transparent !important; border: none !important; margin-top: 1rem;}
:deep(.p-paginator .p-paginator-page) { color: #94a3b8 !important; }
:deep(.p-paginator .p-paginator-page.p-highlight) {
    background-color: #5ab1ce !important;
    color: #ffffff !important;
    border-radius: 50%;
}

/* 3. BOTONES ESPECÍFICOS */
.btn-accion-devolver {
    background-color: #3b82f6 !important; /* Azul para acción de retorno */
    border: none !important;
    font-weight: bold;
}
.btn-accion-devolver:hover {
    background-color: #2563eb !important;
}

.btn-registrar {
    background-color: #22c55e !important; 
    border: none !important;
    color: #000000 !important;
    font-weight: bold;
}
.btn-limpiar {
    background-color: #4a5568 !important; 
    border: none !important;
    color: white !important;
}

/* 4. MODAL OSCURO */
:deep(.modal-oscuro .p-dialog-header),
:deep(.modal-oscuro .p-dialog-content),
:deep(.modal-oscuro .p-dialog-footer) {
    background-color: #1e252d !important;
    color: #ffffff !important;
    border: none;
}
:deep(.modal-oscuro .p-dialog-header) {
    border-bottom: 1px solid #2a323d !important;
}
:deep(.modal-oscuro .p-dialog-footer) {
    border-top: 1px solid #2a323d !important;
}

/* 5. LISTA DE HERRAMIENTAS EN EL MODAL */
.surface-ground-custom {
    background-color: #121820;
    border: 1px solid #3f4b5b;
}
.lista-herramientas {
    list-style: none;
}
.item-herramienta {
    background-color: #2a323d;
    border: 1px solid #3f4b5b;
}
</style>