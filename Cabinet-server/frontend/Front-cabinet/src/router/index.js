import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
      meta: {
        hideLayout: true
      }
    },
    {
      path: '/inventario',
      name: 'inventario',
      component: () => import('../views/HerramientasView.vue') 
    },
    { 
      path: '/nuevo-producto', 
      name: 'nuevoProducto', 
      component: () => import('../views/NuevoProductoView.vue') 
    },
    { 
      path: '/movimientos', 
      name: 'movimientos', 
      component: () => import('../views/MovimientosView.vue') 
    },
    { 
      path: '/pedidos', 
      name: 'pedidos', 
      component: () => import('../views/PedidosView.vue') 
    },
    { 
      path: '/devoluciones', 
      name: 'devoluciones', 
      component: () => import('../views/DevolucionesView.vue') 
    },
    { 
      path: '/historial', 
      name: 'historial', 
      component: () => import('../views/HistorialView.vue') 
    }
  ]
})

export default router