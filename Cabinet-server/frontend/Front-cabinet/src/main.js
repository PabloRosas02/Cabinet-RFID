import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Importaciones de PrimeVue
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura' // Tema visual moderno


const app = createApp(App)

app.use(createPinia())
app.use(router)

// Inicializamos PrimeVue con su tema
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
})

app.mount('#app')