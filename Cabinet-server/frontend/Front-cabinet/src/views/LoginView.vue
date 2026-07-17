<!-- src/views/LoginView.vue -->
<script setup>
import LoginForm from '@/components/LoginForm.vue'; 
// Asegúrate de que la ruta importe correctamente el archivo que creamos arriba
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

@media (max-width: 768px) { 
    .image-section { display: none; } 
    .form-section { max-width: 100%; padding: 2rem; box-shadow: none; }
}
</style>