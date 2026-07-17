<script setup>
import { useRoute, useRouter } from 'vue-router';

// Recibimos el estado de apertura desde App.vue como prop
const props = defineProps({
  menuAbierto: Boolean
});

const emit = defineEmits(['toggle']);
const route = useRoute();
const router = useRouter();

const navegar = (ruta) => {
  router.push(ruta);
};

// Función para manejar el cierre de sesión
const cerrarSesion = () => {
  // 1. Limpiamos los datos del usuario en el almacenamiento local
  localStorage.removeItem('usuarioActivo');
  
  // (Opcional) Si usas tokens de sesión, elimínalos aquí también
  // localStorage.removeItem('token');
  
  // 2. Redirigimos al usuario a la pantalla de login
  router.push('/login'); // O la ruta que corresponda a tu login (ej. '/login')
};
</script>

<template>
  <aside :class="['sidebar', props.menuAbierto ? 'abierto' : 'cerrado']">
    <div class="sidebar-header">
      <h2 v-if="props.menuAbierto" class="titulo-menu">INVENTARIO</h2>
      <i v-else class="pi pi-box icono-central"></i>
    </div>

    <ul class="nav-list">
      <li @click="navegar('/pedidos')" :class="['nav-item', { 'activo': route.path === '/pedidos' }]">
        <i class="pi pi-chart-bar"></i>
        <span v-if="props.menuAbierto" class="ml-3 font-semibold">Pedidos</span>
      </li>
      
      <li @click="navegar('/nuevo-producto')" :class="['nav-item', { 'activo': route.path === '/nuevo-producto' }]">
        <i class="pi pi-plus-circle"></i>
        <span v-if="props.menuAbierto" class="ml-3 font-semibold">Nuevo producto</span>
      </li>
      
      <li @click="navegar('/movimientos')" :class="['nav-item', { 'activo': route.path === '/movimientos' }]">
        <i class="pi pi-history"></i>
        <span v-if="props.menuAbierto" class="ml-3 font-semibold">Movimientos</span>
      </li>
      
      <li @click="navegar('/inventario')" :class="['nav-item', { 'activo': route.path === '/inventario' }]">
        <i class="pi pi-box"></i>
        <span v-if="props.menuAbierto" class="ml-3 font-semibold">Inventario</span>
      </li>
      
      <!-- La clase mt-auto empuja Configuración y Cerrar Sesión hacia el fondo -->
      <li class="nav-item mt-auto">
        <i class="pi pi-cog"></i>
        <span v-if="props.menuAbierto" class="ml-3 font-semibold">Configuración</span>
      </li>

      <!-- BOTÓN DE CERRAR SESIÓN -->
      <li @click="cerrarSesion" class="nav-item btn-salir">
        <i class="pi pi-sign-out"></i>
        <span v-if="props.menuAbierto" class="ml-3 font-semibold">Cerrar Sesión</span>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
/* Fondo principal del sidebar con el Azul Crissair */
.sidebar {
  background-color: #063b69; 
  color: white;
  height: 100vh;
  transition: width 0.3s ease;
  overflow: hidden;
  box-shadow: 2px 0 5px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  z-index: 100;
}

.sidebar.abierto { width: 250px; }
.sidebar.cerrado { width: 70px; }

/* Cabecera ligeramente más oscura para contraste */
.sidebar-header {
  background-color: #042a4d; 
  height: 65px; 
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.titulo-menu { 
  color: white; 
  margin: 0; 
  font-size: 1.25rem; 
  font-weight: 900; 
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.icono-central { font-size: 1.5rem; }

/* Lista de navegación */
.nav-list { 
  list-style: none; 
  padding: 0.75rem; 
  margin: 0; 
  display: flex; 
  flex-direction: column; 
  flex-grow: 1; /* Permite que la lista ocupe el espacio restante y empuje mt-auto abajo */
  gap: 0.35rem; 
}

/* Elementos del menú normales */
.nav-item {
  display: flex;
  align-items: center;
  padding: 0.85rem 1rem;
  color: #ffffff;
  cursor: pointer;
  border-radius: 6px; 
  transition: all 0.2s;
  font-weight: 700;
}

/* Efecto al pasar el ratón (brillo sutil blanco) */
.nav-item:hover { 
  background-color: rgba(255, 255, 255, 0.1); 
}

/* El elemento ACTIVO con el Dorado Crissair */
.nav-item.activo { 
  background-color: #cca253; 
  color: #042a4d; /* Letra oscura para que resalte y sea legible sobre el dorado */
}

/* Estilo específico para el botón de Cerrar Sesión */
.btn-salir {
  color: #fca5a5; /* Un tono rojizo suave para diferenciarlo */
}

.btn-salir:hover {
  background-color: #ef4444; /* Rojo más intenso al pasar el ratón */
  color: #ffffff;
}

/* Iconos */
.nav-item i { 
  min-width: 32px; 
  text-align: left; 
  font-size: 1.25rem; 
}

.ml-3 {
  margin-left: 0.5rem; 
}
</style>