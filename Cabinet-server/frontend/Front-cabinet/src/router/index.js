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
      meta: { rolesPermitidos: ['ADMINISTRADOR'] } 
    },
    {
      path: '/inventario',
      name: 'inventario',
      component: () => import('../views/HerramientasView.vue'),
      // Administrador y Supervisor
      meta: { rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN'] }
    },
    { 
      path: '/nuevo-producto', 
      name: 'nuevoProducto', 
      component: () => import('../views/NuevoProductoView.vue'),
      meta: { rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN'] }
    },
    { 
      path: '/movimientos', 
      name: 'movimientos', 
      component: () => import('../views/MovimientosView.vue'),
      meta: { rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN'] }
    },
    { 
      path: '/pedidos', 
      name: 'pedidos', 
      component: () => import('../views/PedidosView.vue'),
      // Todos los roles tienen acceso
      meta: { rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN', 'ALMACENISTA'] }
    },
    { 
      path: '/devoluciones', 
      name: 'devoluciones', 
      component: () => import('../views/DevolucionesView.vue'),
      meta: { rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN', 'ALMACENISTA'] }
    },
    { 
      path: '/historial', 
      name: 'historial', 
      component: () => import('../views/HistorialView.vue'),
      meta: { rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN','ALMACENISTA', 'OPERADOR'] }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// === GUARDIA DE NAVEGACIÓN ACTUALIZADO ===
router.beforeEach((to, from) => {
  // 1. Leemos la sesión actual del usuario
  const usuarioStr = localStorage.getItem('usuarioActivo');
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;
  const rolUsuario = usuario ? usuario.rol : null;

  // 2. Extraemos los roles permitidos de la ruta a la que intenta ir
  const rolesRequeridos = to.meta.rolesPermitidos;

  // Función de ayuda para saber a dónde mandar a cada quien
  const obtenerRutaPorDefecto = (rol) => {
    if (rol === 'ADMINISTRADOR' || rol === 'SUPERVISOR_ALMACEN') return '/inventario';
    if (rol === 'ALMACENISTA') return '/pedidos';
    if (rol === 'OPERADOR') return '/historial';
    return '/login'; 
  };

  // REGLA A: Si el usuario ya está logueado e intenta entrar al /login o a la raíz (/)
  if ((to.path === '/login' || to.path === '/') && usuario) {
    return obtenerRutaPorDefecto(rolUsuario);
  }

  // REGLA B: Si la ruta requiere un rol específico (está protegida)
  if (rolesRequeridos) {
    // Caso B1: No hay nadie logueado, mandarlo al Login
    if (!usuario) {
      return '/login';
    }
    
    // Caso B2: Está logueado pero NO tiene el permiso -> Lo devolvemos a su vista segura
    if (!rolesRequeridos.includes(rolUsuario)) {
      return obtenerRutaPorDefecto(rolUsuario);
    }
  } 

  // REGLA C: Si intenta ir a una ruta suelta (y no es login) sin estar logueado
  if (to.path !== '/login' && to.path !== '/' && !usuario && !rolesRequeridos) {
    return '/login';
  }

  // Si pasa todas las reglas, permitimos la navegación
  return true;
});

export default router;