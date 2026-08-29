import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice' 
import axios from 'axios'
import i18n from './i18n.js'

import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import './assets/main.css' 

// =====================================================================
// INTERCEPTORES GLOBALES DE AXIOS (SEGURIDAD JWT)
// =====================================================================

// Interceptor de Peticiones: Adjunta el Token automáticamente
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor de Respuestas: Controla tokens expirados o inválidos (401)
axios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuarioActivo');
            localStorage.removeItem('usuario');
            
            if (router.currentRoute.value.path !== '/login') {
                router.push('/login');
            }
        }
        return Promise.reject(error);
    }
);

const app = createApp(App)

app.use(i18n);
app.use(router)
app.use(PrimeVue, {
    theme: { 
        preset: Aura,
        options: {
            darkModeSelector: ".dark-theme" ,
            cssLater: false
        }
    }
})
app.use(ToastService) 

router.isReady().then(() => {
    app.mount('#app')
})