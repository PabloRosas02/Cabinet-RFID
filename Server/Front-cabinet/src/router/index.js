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
      path: '/salidas', 
      name: 'salidas', 
      component: () => import('../views/SalidasView.vue'),
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
  const token = localStorage.getItem('token');
  const usuarioStr = localStorage.getItem('usuarioActivo');
  
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;
  const rolUsuario = usuario ? usuario.rol : null;

  const requiereAutenticacion = to.meta.requiresAuth;
  const rolesRequeridos = to.meta.rolesPermitidos;

  const obtenerRutaPorDefecto = (rol) => {
    if (rol === 'ADMINISTRADOR' || rol === 'SUPERVISOR_ALMACEN') return '/inventario';
    if (rol === 'ALMACENISTA') return '/salidas';
    if (rol === 'OPERADOR') return '/historial';
    return '/login'; 
  };

  // REGLA 1: Si TIENE TOKEN e intenta ir al login, lo regresamos a su panel
  if ((to.path === '/login' || to.path === '/') && token && usuario) {
    return obtenerRutaPorDefecto(rolUsuario);
  }

  // REGLA 2: Si la ruta es privada y NO hay sesión en storage, forzar login
  if (requiereAutenticacion) {
    if (!token || !usuario) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuarioActivo');
      localStorage.removeItem('usuario');
      return '/login';
    }

    // REGLA 3: Verificación de roles de usuario
    if (rolesRequeridos && !rolesRequeridos.includes(rolUsuario)) {
      return obtenerRutaPorDefecto(rolUsuario);
    }
  }

  // REGLA 4: Captura general para rutas públicas no autenticadas
  if (to.path !== '/login' && to.path !== '/' && !token && !requiereAutenticacion) {
    return '/login';
  }

  return true;
});

export default router;