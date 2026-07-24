import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
      meta: {
        hideLayout: true 
      } 
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: {
        hideLayout: true 
      }
    },
    {
      path: '/usuarios',
      name: 'usuarios',
      component: () => import('../views/UsuariosView.vue'),
      // Exclusivo del Administrador
      meta: { requiresAuth: true, rolesPermitidos: ['ADMINISTRADOR'] } 
    },
    {
      path: '/inventario',
      name: 'inventario',
      component: () => import('../views/InventarioView.vue'),
      meta: { requiresAuth: true, rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN'] }
    },
    { 
      path: '/nuevo-producto', 
      name: 'nuevoProducto', 
      component: () => import('../views/NuevoProductoView.vue'),
      meta: { requiresAuth: true, rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN'] }
    },
    { 
      path: '/movimientos', 
      name: 'movimientos', 
      component: () => import('../views/MovimientosView.vue'),
      meta: { requiresAuth: true, rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN'] }
    },
    {
      path: '/bitacora',
      name: 'bitacora',
      component: () => import('../views/BitacoraHerramientasView.vue'),
      meta: { requiresAuth: true, rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN'] }
    },
    { 
      path: '/pedidos', 
      name: 'pedidos', 
      component: () => import('../views/PedidosView.vue'),
      meta: { requiresAuth: true, rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN', 'ALMACENISTA'] }
    },
    { 
      path: '/devoluciones', 
      name: 'devoluciones', 
      component: () => import('../views/DevolucionesView.vue'),
      meta: { requiresAuth: true, rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN', 'ALMACENISTA'] }
    },
    { 
      path: '/historial', 
      name: 'historial', 
      component: () => import('../views/HistorialView.vue'),
      meta: { requiresAuth: true, rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN','ALMACENISTA', 'OPERADOR'] }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// === GUARDIA DE NAVEGACIÓN BLINDADA ===
router.beforeEach((to, from) => {
  // Leemos la sesión actual del usuario
  const usuarioStr = localStorage.getItem('usuarioActivo');
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;
  const rolUsuario = usuario ? usuario.rol : null;

  // Extraemos los permisos de la ruta
  const requiereAutenticacion = to.meta.requiresAuth;
  const rolesRequeridos = to.meta.rolesPermitidos;

  // Función de ayuda para saber a dónde mandar a cada quien
  const obtenerRutaPorDefecto = (rol) => {
    if (rol === 'ADMINISTRADOR' || rol === 'SUPERVISOR_ALMACEN') return '/inventario';
    if (rol === 'ALMACENISTA') return '/pedidos';
    if (rol === 'OPERADOR') return '/historial';
    return '/login'; 
  };

  // REGLA 1: Si el usuario ya está logueado e intenta entrar al /login o a la raíz (/)
  if ((to.path === '/login' || to.path === '/') && usuario) {
    return obtenerRutaPorDefecto(rolUsuario);
  }

  // REGLA 2: Si la ruta requiere estar logueado de forma obligatoria
  if (requiereAutenticacion) {
    // Si no hay sesión iniciada, ¡pa' fuera! Al login.
    if (!usuario) {
      return '/login';
    }

    // REGLA 3: Si además requiere un rol específico y el usuario no lo tiene
    if (rolesRequeridos && !rolesRequeridos.includes(rolUsuario)) {
      // Lo devolvemos a su panel principal por defecto
      return obtenerRutaPorDefecto(rolUsuario);
    }
  }

  // REGLA 4: Si intenta ir a una ruta suelta (y no es login) sin estar logueado
  // (Esto cubre cualquier ruta rara que se nos haya escapado proteger con requiresAuth)
  if (to.path !== '/login' && to.path !== '/' && !usuario && !requiereAutenticacion) {
    return '/login';
  }

  // Si pasa todas las aduanas, permitimos el acceso
  return true;
});

export default router;