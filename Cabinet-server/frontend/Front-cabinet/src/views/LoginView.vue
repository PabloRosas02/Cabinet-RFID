<script setup>
import { ref } from 'vue';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';

const correo = ref('');
const contrasena = ref('');

const iniciarSesion = () => {
    // Más adelante conectaremos esto con tu backend Node.js
    console.log("Enviando al backend:", correo.value, contrasena.value);
    alert(`Intentando iniciar sesión como: ${correo.value}`);
};
</script>

<template>
    <div class="login-container">
        <Card class="login-card">
            <template #title>
                <h2 class="text-center">Control de Gabinete RFID</h2>
            </template>
            <template #subtitle>
                <p class="text-center">Ingresa tus credenciales para acceder</p>
            </template>
            <template #content>
                <div class="form-group">
                    <label for="correo">Correo Electrónico</label>
                    <InputText id="correo" v-model="correo" type="email" placeholder="ejemplo@correo.com" class="w-full" />
                </div>
                
                <div class="form-group">
                    <label for="contrasena">Contraseña</label>
                    <Password id="contrasena" v-model="contrasena" placeholder="Tu contraseña secreta" :feedback="false" toggleMask class="w-full" />
                </div>

                <Button label="Iniciar Sesión" icon="pi pi-sign-in" @click="iniciarSesion" class="w-full mt-3" />
            </template>
        </Card>
    </div>
</template>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.login-card {
    width: 100%;
    max-width: 400px;
    padding: 1rem;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.text-center {
    text-align: center;
    margin-top: 0;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}

.w-full {
    width: 100%;
}

.mt-3 {
    margin-top: 1rem;
}
</style>