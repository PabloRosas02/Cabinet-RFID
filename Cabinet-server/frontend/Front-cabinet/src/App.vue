<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <!-- Aquí Vue inyectará dinámicamente la pantalla que corresponda (Login, Inventario, etc.) -->
  <RouterView />
</template>

<style>
/* Un fondo gris muy claro para que las tarjetas blancas resalten */
body {
  background-color: #f8fafc;
  margin: 0;
  font-family: var(--font-family, sans-serif);
}
</style>