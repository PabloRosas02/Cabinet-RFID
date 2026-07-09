import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('../views/LoginView.vue') 
    },
    {
      path: '/usuarios',
      name: 'usuarios',
      // Cambia el InventarioView temporal por el UsuariosView real
      component: () => import('../views/UsuariosView.vue') 
    },
  ]
})

export default router