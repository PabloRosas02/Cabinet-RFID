<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import MenuLateral from './layouts/MenuLateral.vue';

const route = useRoute();

// MEJORA UX: Si la pantalla es de celular/tablet (< 992px), empieza cerrado. 
// Si es monitor de PC, empieza abierto.
const menuAbierto = ref(window.innerWidth > 992);

// Opcional: Si el usuario voltea el celular o redimensiona la ventana en PC, lo ajustamos automáticamente
window.addEventListener('resize', () => {
    if (window.innerWidth > 992) {
        menuAbierto.value = true;
    } else {
        menuAbierto.value = false;
    }
});
</script>

<template>
  <div class="layout-global">
    <MenuLateral 
        v-if="!route.meta.hideLayout" 
        :menuAbierto="menuAbierto" 
        @toggle="menuAbierto = false" 
    />
    
    <div class="contenedor-derecho">
      <!-- Barra superior -->
      <div v-if="!route.meta.hideLayout" class="topbar">
        <!-- El botón de hamburguesa alterna entre abierto y cerrado -->
        <button class="btn-hamburguesa" @click="menuAbierto = !menuAbierto">
          <i class="pi pi-bars"></i>
        </button>
      </div>

      <!-- Aquí se cargan todas las vistas -->
      <main :class="['vista-contenido', { 'pantalla-completa': route.meta.hideLayout }]">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style>
/* Reset Global */
html, body { 
    margin: 0; 
    padding: 0; 
    height: 100%; 
    background-color: #121820; 
    font-family: sans-serif; 
    overflow: hidden; /* Evita scrolls accidentales en el nivel más alto */
}

.layout-global { display: flex; height: 100vh; width: 100vw; }
.contenedor-derecho { flex: 1; display: flex; flex-direction: column; min-width: 0; }

/* Barra Superior */
.topbar { 
    height: 65px; 
    background-color: #1e252d; 
    display: flex; 
    align-items: center; 
    padding: 0 1rem; 
    border-bottom: 1px solid #2a323d; 
}

.btn-hamburguesa { 
    background: none; 
    border: none; 
    cursor: pointer; 
    font-size: 1.5rem; 
    color: #e2e8f0; 
}

/* Contenedor de las vistas normales (Inventario, Pedidos) */
.vista-contenido { 
    flex: 1; 
    padding: 1.5rem; 
    overflow-y: auto; /* Aquí sí queremos scroll si hay muchos datos */
}

/* Para pantallas móviles, reducimos el padding para aprovechar el espacio */
@media (max-width: 768px) {
    .vista-contenido {
        padding: 1rem;
    }
}

/* Quita el padding y scroll para el Login */
.pantalla-completa {
    padding: 0 !important;
    overflow: hidden !important;
}
</style>