<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Recibimos el estado de apertura desde App.vue
const props = defineProps({
  menuAbierto: Boolean
});

// Emitimos la señal de cierre al componente padre
const emit = defineEmits(['toggle', 'update:menuAbierto']);
const route = useRoute();
const router = useRouter();

// =========================================================
// LÓGICA DE CIERRE RESPONSIVO
// =========================================================
const cerrarMenuMovil = () => {
  // Solo forzamos el cierre si estamos en móvil/tablet
  if (window.innerWidth <= 992) {
    emit('toggle'); 
    emit('update:menuAbierto', false); // Por si usas v-model en App.vue
  }
};

const manejarNavegacion = (ruta) => {
  router.push(ruta);
  cerrarMenuMovil();
};

const cerrarSesion = () => {
  localStorage.removeItem('usuarioActivo');
  router.push('/login');
  cerrarMenuMovil();
};

// =========================================================
// LÓGICA DE ROLES
// =========================================================
const obtenerRolUsuario = () => {
  try {
    const usuarioStr = localStorage.getItem('usuarioActivo');
    if (usuarioStr) {
      const usuario = JSON.parse(usuarioStr);
      return usuario.rol || 'OPERADOR';
    }
  } catch (e) {
    console.error('Error al leer el usuario activo:', e);
  }
  return 'OPERADOR'; 
};

const menuCompleto = [
  { titulo: 'Pedidos', icono: 'pi pi-chart-bar', ruta: '/pedidos', rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN', 'ALMACENISTA'] },
  { titulo: 'Devoluciones', icono: 'pi pi-replay', ruta: '/devoluciones', rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN', 'ALMACENISTA'] },
  { titulo: 'Historial', icono: 'pi pi-book', ruta: '/historial', rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN', 'OPERADOR','ALMACENISTA'] },
  { titulo: 'Nuevo producto', icono: 'pi pi-plus-circle', ruta: '/nuevo-producto', rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN'] },
  { titulo: 'Inventario', icono: 'pi pi-box', ruta: '/inventario', rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN'] },
  { titulo: 'Usuarios', icono: 'pi pi-users', ruta: '/usuarios', rolesPermitidos: ['ADMINISTRADOR'] }
];

const menuFiltrado = computed(() => {
  const rolActual = obtenerRolUsuario();
  return menuCompleto.filter(item => item.rolesPermitidos.includes(rolActual));
});
</script>

<template>
  <div 
    v-if="props.menuAbierto" 
    class="menu-overlay" 
    @click.stop="cerrarMenuMovil">
  </div>

  <aside :class="['sidebar', props.menuAbierto ? 'abierto' : 'cerrado']">
    <div class="sidebar-header">
      <h2 v-if="props.menuAbierto" class="titulo-menu">INVENTARIO</h2>
      <i v-else class="pi pi-box icono-central"></i>
    </div>

    <ul class="nav-list">
      <li 
        v-for="item in menuFiltrado" 
        :key="item.ruta"
        @click.stop="manejarNavegacion(item.ruta)" 
        :class="['nav-item', { 'activo': route.path === item.ruta }]"
      >
        <i :class="item.icono"></i>
        <span v-if="props.menuAbierto" class="ml-3 font-semibold">{{ item.titulo }}</span>
      </li>
      
      <!-- <li class="nav-item mt-auto" @click.stop="cerrarMenuMovil">
        <i class="pi pi-cog"></i>
        <span v-if="props.menuAbierto" class="ml-3 font-semibold">Configuración</span>
      </li> -->

      <li @click.stop="cerrarSesion" class="nav-item btn-salir mt-auto">
        <i class="pi pi-sign-out"></i>
        <span v-if="props.menuAbierto" class="ml-3 font-semibold">Cerrar Sesión</span>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
/* =========================================================
   ESTILOS ESCRITORIO (Monitor de PC)
   ========================================================= */
.sidebar {
  background-color: #063b69; 
  color: white;
  height: 100vh;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-x: hidden;
  box-shadow: 2px 0 5px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  z-index: 1000;
  position: relative; 
}

.sidebar.abierto { width: 250px; transform: translateX(0); }
.sidebar.cerrado { width: 70px; transform: translateX(0); }

.menu-overlay { display: none; }

.sidebar-header {
  background-color: #042a4d; 
  height: 65px; 
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.titulo-menu { 
  color: white; margin: 0; font-size: 1.25rem; font-weight: 900; 
  letter-spacing: 0.5px; text-transform: uppercase;
}
.icono-central { font-size: 1.5rem; }

.nav-list { 
  list-style: none; padding: 0.75rem; margin: 0; 
  display: flex; flex-direction: column; flex-grow: 1; gap: 0.35rem; 
}

.nav-item {
  display: flex; align-items: center; padding: 0.85rem 1rem;
  color: #ffffff; cursor: pointer; border-radius: 8px; 
  transition: all 0.2s; font-weight: 700; white-space: nowrap; 
}

.nav-item:hover { background-color: rgba(255, 255, 255, 0.1); }
.nav-item.activo { background-color: #cca253; color: #042a4d; }

.btn-salir { color: #fca5a5; }
.btn-salir:hover { background-color: #ef4444; color: #ffffff; }

.nav-item i { min-width: 32px; text-align: left; font-size: 1.25rem; }
.ml-3 { margin-left: 0.5rem; }

/* =========================================================
   NUEVO ESTILO "FLOATING PANEL" PARA MÓVILES (Hasta 992px)
   ========================================================= */
@media (max-width: 992px) {
  
  /* El menú se vuelve un panel flotante con bordes redondeados */
  .sidebar {
    position: fixed;
    top: 1rem;        /* Separación superior */
    left: 1rem;       /* Separación izquierda */
    height: calc(100dvh - 2rem); /* Altura dinámica para celulares modernos */
    border-radius: 16px; /* Bordes suaves estilo app */
  }

  .sidebar.abierto {
    width: 260px;
    transform: translateX(0);
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
  }

  .sidebar.cerrado {
    width: 260px; 
    transform: translateX(-120%); /* Se esconde más allá del borde izquierdo */
  }

  .sidebar-header {
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
  }

  /* Capa oscura que cubre toda la pantalla realzando el menú flotante */
  .menu-overlay {
    display: block;
    position: fixed;
    top: 0; left: 0; 
    width: 100vw; height: 100vh;
    background-color: rgba(11, 26, 38, 0.6); /* Fondo azul muy oscuro y translúcido */
    backdrop-filter: blur(3px); /* Efecto cristal borroso (iOS style) */
    -webkit-backdrop-filter: blur(3px);
    z-index: 999;
    cursor: pointer; 
  }
}
</style>