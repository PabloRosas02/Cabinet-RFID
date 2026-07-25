<!-- src/views/LoginView.vue -->
<script setup>
import LoginForm from '@/components/LoginForm.vue'; 
</script>

<template>
    <div class="split-layout">
        
        <!-- SECCIÓN IZQUIERDA: Inyectamos el componente del formulario -->
        <div class="form-section">
            <LoginForm />
        </div>

        <!-- SECCIÓN DERECHA: Imagen decorativa -->
        <div class="image-section">
            <div class="overlay"></div>
        </div>
        
    </div>
</template>

<style scoped>
/* =========================================================
   ESTILOS GENERALES (Escritorio)
   ========================================================= */
.split-layout { 
    display: flex; 
    height: 100vh; 
    width: 100%; 
    margin: 0; 
    padding: 0;
    overflow: hidden; 
    background-color: #0b1a26;
}

.form-section { 
    flex: 1; 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    background-color: #0b1a26; 
    padding: 2rem; 
    max-width: 500px;
    box-shadow: 10px 0 30px rgba(0,0,0,0.3);
    z-index: 10;
}

.image-section { 
    flex: 1.5; 
    background-image: url('/images/fondo.webp'); 
    background-size: cover; 
    background-position: center; 
    position: relative; 
}

.overlay { 
    position: absolute; 
    top: 0; left: 0; right: 0; bottom: 0; 
    background: linear-gradient(to right, rgba(11, 26, 38, 1) 0%, rgba(11, 26, 38, 0.4) 40%, transparent 100%); 
}

/* =========================================================
   MEDIA QUERIES (RESPONSIVE)
   ========================================================= */

/* Para Laptops pequeñas y Tablets en horizontal (hasta 992px) */
@media (max-width: 992px) {
    .form-section {
        flex: 1.2; /* Le damos un poco más de prioridad de espacio al formulario */
        max-width: 450px;
    }
    .image-section {
        flex: 1; /* Reducimos la porción de la imagen */
    }
    .overlay {
        /* Hacemos el degradado un poco más oscuro para que no compita con el formulario */
        background: linear-gradient(to right, rgba(11, 26, 38, 1) 0%, rgba(11, 26, 38, 0.6) 60%, transparent 100%); 
    }
}

/* Para Teléfonos Móviles y Tablets en vertical (hasta 768px) */
@media (max-width: 768px) { 
    .image-section { 
        display: none; /* Desaparecemos la imagen para limpiar la vista */
    } 
    .form-section { 
        flex: 1;
        max-width: 100%; 
        width: 100%;
        padding: 1.5rem; /* Ajustamos el padding para pantallas angostas */
        box-shadow: none; 
    }
}
</style>