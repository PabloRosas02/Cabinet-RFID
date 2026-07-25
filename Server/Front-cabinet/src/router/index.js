import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
      meta: { hideLayout: true } 
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { hideLayout: true }
    },
    {
      path: '/usuarios',
      name: 'usuarios',
      component: () => import('../views/UsuariosView.vue'),
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

router.beforeEach((to, from) => {
  // 1. Buscamos el GAFETE (Token) y los datos del usuario
  const token = localStorage.getItem('token');
  const usuarioStr = localStorage.getItem('usuarioActivo');
  
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;
  const rolUsuario = usuario ? usuario.rol : null;

  const requiereAutenticacion = to.meta.requiresAuth;
  const rolesRequeridos = to.meta.rolesPermitidos;

  const obtenerRutaPorDefecto = (rol) => {
    if (rol === 'ADMINISTRADOR' || rol === 'SUPERVISOR_ALMACEN') return '/inventario';
    if (rol === 'ALMACENISTA') return '/pedidos';
    if (rol === 'OPERADOR') return '/historial';
    return '/login'; 
  };

  // REGLA 1: Si TIENE TOKEN e intenta ir al login, lo regresamos a su panel
  if ((to.path === '/login' || to.path === '/') && token && usuario) {
    return obtenerRutaPorDefecto(rolUsuario);
  }

  // REGLA 2: Si la ruta es privada
  if (requiereAutenticacion) {
    // Si NO hay token o NO hay datos de usuario
    if (!token || !usuario) {
      // Limpiamos por si quedó basura en el storage
      localStorage.removeItem('token');
      localStorage.removeItem('usuarioActivo');
      return '/login';
    }

    // REGLA 3: Verificamos el rol para la UX
    if (rolesRequeridos && !rolesRequeridos.includes(rolUsuario)) {
      return obtenerRutaPorDefecto(rolUsuario);
    }
  }

  // REGLA 4: Si es una ruta rara y no está logueado
  if (to.path !== '/login' && to.path !== '/' && !token && !requiereAutenticacion) {
    return '/login';
  }

  return true;
});

export default router;