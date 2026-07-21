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
      meta: { rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN','OPERADOR'] }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.beforeEach((to, from, next) => {
  // 1. Leemos la sesión actual del usuario
  const usuarioStr = localStorage.getItem('usuarioActivo');
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;
  const rolUsuario = usuario ? usuario.rol : null;

  // 2. Extraemos los roles permitidos de la ruta a la que intenta ir
  const rolesRequeridos = to.meta.rolesPermitidos;

  // REGLA A: Si el usuario ya está logueado e intenta entrar al /login, lo regresamos a su inicio
  if (to.path === '/login' && usuario) {
    return next(rolUsuario === 'ALMACENISTA' ? '/pedidos' : '/inventario');
  }

  // REGLA B: Si la ruta requiere un rol específico (está protegida)
  if (rolesRequeridos) {
    // Caso B1: No hay nadie logueado, Login
    if (!usuario) {
      return next('/login');
    }
    
    // Caso B2: Está logueado pero NO tiene el permiso -> Lo devolvemos a una vista segura
    if (!rolesRequeridos.includes(rolUsuario)) {
      if (rolUsuario === 'ALMACENISTA') {
        return next('/pedidos'); // Pantalla principal de Almacenista
      } else {
        return next('/inventario'); // Pantalla principal de Admin/Supervisor
      }
    }
  } 

  // REGLA C: Si intenta ir a una ruta suelta (y no es login) sin estar logueado
  if (to.path !== '/login' && to.path !== '/' && !usuario) {
    return next('/login');
  }

  next();
});

export default router