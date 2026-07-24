<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';

const router = useRouter();

const numTrabajador = ref(''); 
const contrasena = ref('');
const recordar = ref(false);
const errorMensaje = ref(''); 
const cargando = ref(false);

const prevenirCaracteresInvalidos = (evento) => {
    if (['e', 'E', '+', '-', '.'].includes(evento.key)) {
        evento.preventDefault();
    }
};

const iniciarSesion = async () => {
    errorMensaje.value = '';

    if (!numTrabajador.value.toString().trim() || !contrasena.value.trim()) {
        errorMensaje.value = 'Por favor, ingresa tu número de trabajador y contraseña.';
        return; 
    }

    cargando.value = true;
    try {
        const credenciales = { 
            numTrabajador: parseInt(numTrabajador.value, 10), 
            contrasena: contrasena.value 
        };

        const response = await axios.post('/api/usuarios/login', credenciales);
        
        // Extraemos el usuario de la respuesta
        const usuarioLogueado = response.data.usuario;
        
        localStorage.setItem('usuarioActivo', JSON.stringify(usuarioLogueado));

        if (usuarioLogueado.rol === 'ALMACENISTA') {
            router.push('/pedidos'); // Pantalla de inicio para Almacenistas
        } else {
            router.push('/inventario'); // Pantalla de inicio para Administrador/Supervisor
        }

    } catch (error) {
        if (error.response && error.response.status === 401) {
            errorMensaje.value = error.response.data.error || 'Credenciales incorrectas.';
        } else {
            errorMensaje.value = 'Error de conexión con el servidor. Verifica que el backend esté encendido.';
            console.error(error);
        }
    } finally {
        cargando.value = false;
    }
};
</script>

<template>
    <div class="form-wrapper">
        <img src="/images/crissair_logo.webp" alt="Crissair Inc. Logo" class="logo" />
        
        <h1 class="title">Iniciar Sesión</h1>
        <p class="subtitle">Ingresa tus credenciales corporativas para acceder al sistema.</p>

        <form @submit.prevent="iniciarSesion" class="form-content">
            <div class="field">
                <label for="numTrabajador">Número de Trabajador</label>
                <InputText 
                    id="numTrabajador" 
                    v-model="numTrabajador" 
                    type="number" 
                    placeholder="Ej. 10452" 
                    class="w-full input-premium sin-flechas" 
                    @keydown="prevenirCaracteresInvalidos"
                />
            </div>
            
            <div class="field">
                <label for="contrasena">Contraseña</label>
                <Password 
                    inputId="contrasena" 
                    v-model="contrasena" 
                    placeholder="Tu contraseña" 
                    :feedback="false" 
                    toggleMask 
                    class="w-full password-premium" 
                    inputClass="w-full input-premium" 
                />
            </div>

            <div class="field-checkbox">
                <Checkbox v-model="recordar" inputId="recordar" :binary="true" />
                <label for="recordar" class="ml-2">Recordar mi sesión</label>
            </div>

            <p v-if="errorMensaje" class="error-text">
                <i class="pi pi-exclamation-circle mr-1"></i> {{ errorMensaje }}
            </p>

            <Button 
                type="submit" 
                :label="cargando ? 'Verificando...' : 'Ingresar'" 
                :icon="cargando ? 'pi pi-spinner pi-spin' : ''"
                class="w-full btn-crissair mt-3" 
                :disabled="cargando"
            />
        </form>
    </div>
</template>

<style scoped>
.form-wrapper { width: 100%; max-width: 380px; }
.logo { width: 260px; margin-bottom: 2.5rem; display: block; }
.title { font-size: 2.2rem; color: #fff; margin-bottom: 0.5rem; font-weight: 800; letter-spacing: -0.5px; }
.subtitle { color: #94a3b8; margin-bottom: 2.5rem; font-size: 0.95rem; line-height: 1.5; }
.field { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
label { font-weight: 500; font-size: 0.9rem; color: #94a3b8; }
.w-full { width: 100%; }
.field-checkbox { display: flex; align-items: center; margin-bottom: 1.5rem; }
.ml-2 { margin-left: 0.5rem; color: #94a3b8; cursor: pointer; font-size: 0.9rem; transition: color 0.2s;}
.ml-2:hover { color: #fff; }
.error-text { color: #ef4444; font-size: 0.9rem; font-weight: 500; margin-bottom: 1rem; display: flex; align-items: center; }
.mr-1 { margin-right: 0.25rem; }

:deep(.input-premium) {
    background-color: #122230 !important;
    border: 1px solid #2a3f54 !important;
    color: #ffffff !important;
    padding: 0.85rem 1rem !important;
    border-radius: 8px !important;
    font-size: 1rem !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
}
:deep(.input-premium:focus), :deep(.input-premium:hover) { border-color: #d4af37 !important; }
:deep(.input-premium:focus) { box-shadow: 0 0 0 1px #d4af37 !important; outline: none !important; }

:deep(.password-premium) { background: transparent !important; border: none !important; padding: 0 !important; box-shadow: none !important; }
:deep(.password-premium i) { color: #94a3b8 !important; right: 1rem !important; margin-top: -0.5rem !important; transition: color 0.2s; }
:deep(.password-premium i:hover) { color: #ffffff !important; }

:deep(.sin-flechas::-webkit-outer-spin-button), :deep(.sin-flechas::-webkit-inner-spin-button) { 
    -webkit-appearance: none !important; 
    margin: 0; 
}
:deep(.sin-flechas) { 
    appearance: textfield !important; 
    -moz-appearance: textfield !important; 
}

:deep(.btn-crissair) { 
    background-color: #d4af37 !important; border-color: #d4af37 !important; color: #000000 !important; 
    font-weight: 700 !important; padding: 1rem !important; font-size: 1.05rem !important; 
    border-radius: 8px !important; transition: all 0.3s ease !important; box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2) !important;
}
:deep(.btn-crissair:hover) { 
    background-color: #b5952f !important; border-color: #b5952f !important; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(212, 175, 55, 0.3) !important;
}
:deep(.btn-crissair:active) { transform: translateY(0); }
:deep(.btn-crissair:disabled) { opacity: 0.7; cursor: not-allowed; transform: none; }
</style>