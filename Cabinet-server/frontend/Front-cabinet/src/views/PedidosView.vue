<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import CatalogoHerramientas from '../components/pedidos/CatalogoHerramientas.vue';
import DetallePedido from '../components/pedidos/DetallePedido.vue';

// 1. Estados reactivos
const trabajador = ref({
    numero: '',
    nombre: ''
});

const inventario = ref([]);
const pedidoActual = ref([]);
const usuarios = ref([]); 
const cargando = ref(false);

// 2. Cargar datos desde tu backend real (PostgreSQL)
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

// 3. Lógica del Carrito
const manejarAgregar = (herramienta) => {
    const itemExistente = pedidoActual.value.find(h => h.id === herramienta.id);
    
    if (itemExistente) {
        if (itemExistente.cantidadLlevada < herramienta.cantidadDisponible) {
            itemExistente.cantidadLlevada++;
        } else {
            alert("Has alcanzado el límite de stock disponible.");
        }
    } else {
        pedidoActual.value.push({ ...herramienta, cantidadLlevada: 1 });
    }
};

const manejarQuitar = (id) => {
    pedidoActual.value = pedidoActual.value.filter(h => h.id !== id);
};

// 4. Registro de Pedido
const procesarPedido = async () => {
    try {
        // Recuperamos el usuario logueado desde el localStorage (quien entrega la herramienta en este turno)
        const usuarioSesion = JSON.parse(localStorage.getItem('usuario')) || JSON.parse(localStorage.getItem('usuarioActivo'));

        if (!usuarioSesion || !usuarioSesion.id) {
            throw new Error('No se encontró una sesión activa. Por favor, vuelve a iniciar sesión.');
        }

        const payload = {
            trabajadorNumero: trabajador.value.numero,
            trabajadorNombre: trabajador.value.nombre,
            prestadorId: usuarioSesion.id, // <-- ID del almacenista en turno que entrega la herramienta
            herramientas: pedidoActual.value.map(item => ({
                id: item.id,
                cantidadPrestada: item.cantidadLlevada
            }))
        };

        await axios.post('/api/pedidos', payload);

        alert("¡Pedido registrado exitosamente! El inventario ha sido actualizado.");
        
        // Recargar inventario para ver los nuevos niveles de stock
        await cargarInventario();
        
        // Limpiar formulario
        trabajador.value = { numero: '', nombre: '' };
        pedidoActual.value = [];

    } catch (error) {
        console.error("Error al guardar el pedido:", error);
        alert("Ocurrió un error al registrar el pedido: " + (error.response?.data?.error || error.message || "Error de conexión"));
    }
};
</script>

<template>
  <div class="pedidos-contenedor">
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
.titulo-seccion { color: #5ab1ce; margin-bottom: 1.5rem; }
.layout-dos-columnas { display: flex; gap: 1.5rem; align-items: stretch; }
.columna-inventario { flex: 2; min-width: 0; }
.columna-pedido { flex: 1.2; min-width: 350px; }

@media (max-width: 992px) {
    .layout-dos-columnas { flex-direction: column; }
    .columna-inventario, .columna-pedido { width: 100%; flex: none; }
}
</style>