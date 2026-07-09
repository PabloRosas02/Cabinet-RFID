<script setup>
/**
 * @file LoginView.vue
 * @description Pantalla de inicio de sesión. Maneja la captura de credenciales
 * (Número de Trabajador y Contraseña) y la validación temprana antes de comunicarse con la API.
 */

import { ref } from 'vue';
import { useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';

const router = useRouter();

// Variables de estado reactivo
const numTrabajador = ref(''); 
const contrasena = ref('');
const recordar = ref(false);

const errorMensaje = ref(''); 

/**
 * @function iniciarSesion
 * @description Verifica la integridad de los datos, convierte el número de trabajador a Int 
 * y simula el envío al backend.
 * @returns {void}
 */
const iniciarSesion = () => {
    // 1. Limpiar estado de errores previo
    errorMensaje.value = '';

    // 2. Validación temprana (revisamos que el número convertido a string no esté vacío)
    if (!numTrabajador.value.toString().trim() || !contrasena.value.trim()) {
        errorMensaje.value = 'Por favor, ingresa tu número de trabajador y contraseña.';
        return; 
    }

    // 3. Preparación del Payload: Convertimos a entero (Base 10) para coincidir con el schema de Prisma
    const credenciales = { 
        numTrabajador: parseInt(numTrabajador.value, 10), 
        contrasena: contrasena.value 
    };

    console.log("Enviando credenciales al backend:", credenciales);
    
    // Redirección directa al panel administrativo
    router.push('/dashboard/inventario');
};
</script>

<template>
    <div class="split-layout">
        
        <!-- SECCIÓN IZQUIERDA: Formulario -->
        <div class="form-section">
            <div class="form-wrapper">
                <img src="/images/crissair_logo.webp" alt="Crissair Inc. Logo" class="logo" />
                <h1 class="title">Iniciar Sesión</h1>
                <p class="subtitle">Ingresa tus credenciales corporativas para acceder al sistema.</p>

                <!-- Grupo: Número de Trabajador (Reemplaza al correo) -->
                <div class="field">
                    <label for="numTrabajador">Número de Trabajador</label>
                    <InputText id="numTrabajador" v-model="numTrabajador" type="number" placeholder="Ej. 10452" class="w-full" />
                </div>
                
                <!-- Grupo: Contraseña -->
                <div class="field">
                    <label for="contrasena">Contraseña</label>
                    <Password id="contrasena" v-model="contrasena" placeholder="contraseña" :feedback="false" toggleMask class="w-full" inputClass="w-full" />
                </div>

                <div class="field-checkbox">
                    <Checkbox v-model="recordar" inputId="recordar" :binary="true" />
                    <label for="recordar" class="ml-2">Recordar mi sesión</label>
                </div>

                <p v-if="errorMensaje" class="error-text">{{ errorMensaje }}</p>

                <!-- Acción Principal -->
                <Button label="Ingresar" class="w-full btn-crissair" @click="iniciarSesion" />
                
                <!-- (La sección de registro fue eliminada de acuerdo con las reglas de negocio) -->
            </div>
        </div>

        <!-- SECCIÓN DERECHA: Imagen decorativa -->
        <div class="image-section">
            <div class="overlay"></div>
        </div>
    </div>
</template>

<style scoped>
/* ESTILOS DE LA VISTA LOGIN */
.error-text { color: #d32f2f; font-size: 0.85rem; font-weight: bold; margin-bottom: 1rem; text-align: center; }
.text-muted { color: var(--text-muted); }

:deep(.btn-crissair) { background-color: var(--crissair-gold) !important; border-color: var(--crissair-gold) !important; color: var(--crissair-blue) !important; font-weight: bold; padding: 0.75rem; font-size: 1.1rem; transition: background-color 0.2s; border-radius: 6px; }
:deep(.btn-crissair:hover) { background-color: var(--crissair-gold-hover) !important; border-color: var(--crissair-gold-hover) !important; }

.split-layout { display: flex; min-height: 100vh; width: 100%; margin: 0; padding: 0; }
.form-section { flex: 1; display: flex; justify-content: center; align-items: center; background-color: var(--bg-white); padding: 2rem; }
.form-wrapper { width: 100%; max-width: 400px; }

.logo { max-width: 220px; margin-bottom: 2rem; display: block; }
.title { font-size: 2rem; color: var(--crissair-blue); margin-bottom: 0.5rem; font-weight: bold; }
.subtitle { color: var(--text-muted); margin-bottom: 2rem; font-size: 0.95rem; }

.field { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
label { font-weight: 600; font-size: 0.9rem; color: var(--text-main); }
.w-full { width: 100%; }
.field-checkbox { display: flex; align-items: center; margin-bottom: 1rem; }
.ml-2 { margin-left: 0.5rem; font-weight: normal; color: var(--text-muted); cursor: pointer; }

.image-section { flex: 1; background-image: url('/images/fondo.jpg'); background-size: cover; background-position: center; position: relative; background-color: var(--crissair-blue); }
.overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, var(--crissair-blue-overlay) 0%, var(--crissair-blue-overlay-light) 100%); }

@media (max-width: 768px) { .image-section { display: none; } }
</style>