<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast'; 

import CatalogoHerramientas from '../components/pedidos/CatalogoHerramientas.vue';
import DetallePedido from '../components/pedidos/DetallePedido.vue';

// Estados reactivos y utilidades
const toast = useToast(); 

const trabajador = ref({
    numero: '',
    nombre: ''
});

const inventario = ref([]);
const pedidoActual = ref([]);
const usuarios = ref([]); 
const cargando = ref(false);

// Cargar datos desde tu backend real (PostgreSQL)
const cargarInventario = async () => {
    cargando.value = true;
    try {
        const response = await axios.get('/api/herramientas');
        inventario.value = response.data;
    } catch (error) {
        console.error("Error al cargar el inventario:", error);
    } finally {
        cargando.value = false;
    }
};

const cargarUsuarios = async () => {
    try {
        const response = await axios.get('/api/usuarios');
        usuarios.value = response.data;
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
    }
};

onMounted(() => {
    cargarInventario();
    cargarUsuarios();
});

// Lógica del Carrito
const manejarAgregar = (herramienta) => {
    const itemExistente = pedidoActual.value.find(h => h.id === herramienta.id);
    
    if (itemExistente) {
        if (itemExistente.cantidadLlevada < herramienta.cantidadDisponible) {
            itemExistente.cantidadLlevada++;
        } else {
            toast.add({ 
                severity: 'warn', 
                summary: 'Límite alcanzado', 
                detail: 'Has alcanzado el límite de stock disponible para esta herramienta.', 
                life: 3000 
            });
        }
    } else {
        pedidoActual.value.push({ ...herramienta, cantidadLlevada: 1 });
    }
};

const manejarQuitar = (id) => {
    pedidoActual.value = pedidoActual.value.filter(h => h.id !== id);
};

// Registro de Pedido
const procesarPedido = async () => {
    try {
        const usuarioSesion = JSON.parse(localStorage.getItem('usuario')) || JSON.parse(localStorage.getItem('usuarioActivo'));

        if (!usuarioSesion || !usuarioSesion.id) {
            throw new Error('No se encontró una sesión activa. Por favor, vuelve a iniciar sesión.');
        }

        const payload = {
            trabajadorNumero: trabajador.value.numero,
            trabajadorNombre: trabajador.value.nombre,
            prestadorId: usuarioSesion.id, 
            herramientas: pedidoActual.value.map(item => ({
                id: item.id,
                cantidadPrestada: item.cantidadLlevada
            }))
        };

        await axios.post('/api/pedidos', payload);

        // REEMPLAZAMOS EL ALERT POR UN TOAST DE ÉXITO
        toast.add({ 
            severity: 'success', 
            summary: '¡Éxito!', 
            detail: 'Pedido registrado exitosamente. El inventario ha sido actualizado.', 
            life: 3000 
        });
        
        await cargarInventario();
        
        trabajador.value = { numero: '', nombre: '' };
        pedidoActual.value = [];

    } catch (error) {
        console.error("Error al guardar el pedido:", error);
        
        // REEMPLAZAMOS EL ALERT POR UN TOAST DE ERROR
        toast.add({ 
            severity: 'error', 
            summary: 'Error al registrar', 
            detail: error.response?.data?.error || error.message || "Error de conexión con el servidor.", 
            life: 5000 
        });
    }
};
</script>

<template>
  <div class="pedidos-contenedor">
    <!-- INYECTAMOS EL COMPONENTE TOAST AQUÍ PARA QUE FLOTE EN LA VISTA -->
    <Toast />

    <h2 class="titulo-seccion">Registro de Préstamos</h2>

    <div class="layout-dos-columnas mt-4">
      
      <!-- Panel Izquierdo: Catálogo -->
      <div class="columna-inventario">
          <CatalogoHerramientas 
            :inventario="inventario" 
            @agregar="manejarAgregar" 
          />
      </div>

      <!-- Panel Derecho: Detalle del Pedido -->
      <div class="columna-pedido">
          <DetallePedido 
            :pedido="pedidoActual" 
            :trabajador="trabajador" 
            :listaUsuarios="usuarios"
            @quitar="manejarQuitar"
            @registrar="procesarPedido"
          />
      </div>

    </div>
  </div>
</template>

<style scoped>
.pedidos-contenedor { padding: 1rem; color: #e2e8f0; }
.titulo-seccion { color: #5ab1ce; margin-bottom: 1.5rem; font-weight: bold; }
.layout-dos-columnas { display: flex; gap: 1.5rem; align-items: stretch; }
.columna-inventario { flex: 2; min-width: 0; }
.columna-pedido { flex: 1.2; min-width: 350px; }

@media (max-width: 992px) {
    .layout-dos-columnas { flex-direction: column; }
    .columna-inventario, .columna-pedido { width: 100%; flex: none; }
}
</style>