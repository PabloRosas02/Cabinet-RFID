<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputSwitch from 'primevue/inputswitch'; 
import axios from 'axios';

const props = defineProps({
  menuAbierto: Boolean
});

const emit = defineEmits(['toggle', 'update:menuAbierto']);
const route = useRoute();
const router = useRouter();

const { t, locale } = useI18n();

// Estados para el Modal de Configuración y Preferencias
const mostrarModalConfig = ref(false);
const temaActual = ref(localStorage.getItem('theme') || 'dark');

// Estado para la automatización de correos
const correosActivos = ref(false);

// Estado para evitar doble clic al enviar el reporte semanal
const enviandoReporte = ref(false);

// Consultar el estado inicial del cron al montar el componente
const cargarEstadoAutomatizacion = async () => {
  try {
    const { data } = await axios.get('/api/configuracion/automatizacion');
    correosActivos.value = data.activo;
  } catch (error) {
    console.error('Error al cargar el estado de la automatización:', error);
  }
};

// Cambiar el estado del cron al presionar el switch
const toggleAutomatizacion = async (nuevoValor) => {
  try {
    const { data } = await axios.post('/api/configuracion/automatizacion', { 
      activo: nuevoValor 
    });
    correosActivos.value = data.activo;
  } catch (error) {
    console.error('Error al actualizar la automatización:', error);
    correosActivos.value = !nuevoValor; // Revertir visualmente en caso de error
  }
};

// Función para disparar el reporte semanal manualmente
const generarReporteSemanal = async () => {
  enviandoReporte.value = true;
  try {
    const { data } = await axios.post('/api/reportes/historial-semanal');
    if (data.success) {
      alert(data.mensaje || `Reporte enviado con éxito. Registros encontrados: ${data.registros}`);
    } else {
      alert('Hubo un problema al generar el reporte.');
    }
  } catch (error) {
    console.error('Error al solicitar el reporte semanal:', error);
    alert('Ocurrió un error en el servidor al enviar el correo.');
  } finally {
    enviandoReporte.value = false;
  }
};

// Aplicar y guardar el tema
const cambiarTema = (nuevoTema) => {
  temaActual.value = nuevoTema;
  localStorage.setItem('theme', nuevoTema);
  aplicarTemaDOM(nuevoTema);
};

const aplicarTemaDOM = (tema) => {
  if (tema === 'light') {
    document.documentElement.classList.add('light-theme');
    document.documentElement.classList.remove('dark-theme');
  } else {
    document.documentElement.classList.add('dark-theme');
    document.documentElement.classList.remove('light-theme');
  }
};

onMounted(() => {
  aplicarTemaDOM(temaActual.value);
  cargarEstadoAutomatizacion(); 
});

// Lógica de Idioma
const cambiarIdioma = (nuevoIdioma) => {
  locale.value = nuevoIdioma;
  localStorage.setItem('idiomaPreferido', nuevoIdioma);
};

// =========================================================
// LÓGICA DE CIERRE RESPONSIVO Y NAVEGACIÓN
// =========================================================
const cerrarMenuMovil = () => {
  if (window.innerWidth <= 992) {
    emit('toggle'); 
    emit('update:menuAbierto', false); 
  }
};

const manejarNavegacion = (ruta) => {
  router.push(ruta);
  cerrarMenuMovil();
};

const cerrarSesion = () => {
  localStorage.removeItem('usuarioActivo');
  router.push('/login');
  cerrarMenuMovil();
};

// =========================================================
// LÓGICA DE ROLES
// =========================================================
const obtenerRolUsuario = () => {
  try {
    const usuarioStr = localStorage.getItem('usuarioActivo');
    if (usuarioStr) {
      const usuario = JSON.parse(usuarioStr);
      return usuario.rol || 'OPERADOR';
    }
  } catch (e) {
    console.error('Error al leer el usuario activo:', e);
  }
  return 'OPERADOR'; 
};

const menuCompleto = [
  { claveT: 'salidas', icono: 'pi pi-chart-bar', ruta: '/salidas', rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN', 'ALMACENISTA'] },
  { claveT: 'devoluciones', icono: 'pi pi-replay', ruta: '/devoluciones', rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN', 'ALMACENISTA'] },
  { claveT: 'historial', icono: 'pi pi-book', ruta: '/historial', rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN', 'OPERADOR','ALMACENISTA'] },
  { claveT: 'nuevo_producto', icono: 'pi pi-plus-circle', ruta: '/nuevo-producto', rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN'] },
  { claveT: 'inventario', icono: 'pi pi-box', ruta: '/inventario', rolesPermitidos: ['ADMINISTRADOR', 'SUPERVISOR_ALMACEN'] },
  { claveT: 'usuarios', icono: 'pi pi-users', ruta: '/usuarios', rolesPermitidos: ['ADMINISTRADOR'] }
];

const menuFiltrado = computed(() => {
  const rolActual = obtenerRolUsuario();
  return menuCompleto.filter(item => item.rolesPermitidos.includes(rolActual));
});
</script>

<template>
  <div 
    v-if="props.menuAbierto" 
    class="menu-overlay" 
    @click.stop="cerrarMenuMovil">
  </div>

  <aside :class="['sidebar', props.menuAbierto ? 'abierto' : 'cerrado']">
    <div class="sidebar-header">
      <h2 v-if="props.menuAbierto" class="titulo-menu">{{ t('menu.titulo') }}</h2>
      <i v-else class="pi pi-box icono-central"></i>
    </div>

    <ul class="nav-list">
      <li 
        v-for="item in menuFiltrado" 
        :key="item.ruta"
        @click.stop="manejarNavegacion(item.ruta)" 
        :class="['nav-item', { 'activo': route.path === item.ruta }]"
      >
        <i :class="item.icono"></i>
        <span v-if="props.menuAbierto" class="ml-3 font-semibold">{{ t('menu.' + item.claveT) }}</span>
      </li>
      
      <!-- Botón de Configuración que abre el Modal -->
      <li class="nav-item mt-auto" @click.stop="mostrarModalConfig = true">
        <i class="pi pi-cog"></i>
        <span v-if="props.menuAbierto" class="ml-3 font-semibold">{{ t('menu.configuracion') }}</span>
      </li>

      <li @click.stop="cerrarSesion" class="nav-item btn-salir">
        <i class="pi pi-sign-out"></i>
        <span v-if="props.menuAbierto" class="ml-3 font-semibold">{{ t('menu.cerrar_sesion') }}</span>
      </li>
    </ul>
  </aside>

  <!-- MODAL DE CONFIGURACIÓN -->
  <Dialog 
    v-model:visible="mostrarModalConfig" 
    :header="t('configuracion_modal.titulo')" 
    :modal="true" 
    :breakpoints="{ '1199px': '75vw', '575px': '95vw' }" 
    :style="{ width: '450px' }" 
    class="modal-oscuro"
    dismissableMask
  >
    <div class="flex flex-column gap-4 pt-2">
      
      <!-- Selector de Idioma -->
      <div class="field flex flex-column gap-2">
        <span class="label-blanco font-semibold">{{ t('configuracion_modal.idioma') }}</span>
        <div class="flex gap-2">
          <Button 
            label="Español" 
            :class="locale === 'es' ? 'btn-nuevo' : 'p-button-outlined btn-cancelar'" 
            @click="cambiarIdioma('es')" 
            class="flex-1"
          />
          <Button 
            label="English" 
            :class="locale === 'en' ? 'btn-nuevo' : 'p-button-outlined btn-cancelar'" 
            @click="cambiarIdioma('en')" 
            class="flex-1"
          />
        </div>
      </div>

      <!-- Selector de Tema -->
      <div class="field flex flex-column gap-2">
        <span class="label-blanco font-semibold">{{ t('configuracion_modal.tema') }}</span>
        <div class="flex gap-2">
          <Button 
            :label="t('configuracion_modal.tema_oscuro')" 
            icon="pi pi-moon"
            :class="temaActual === 'dark' ? 'btn-nuevo' : 'p-button-outlined btn-cancelar'" 
            @click="cambiarTema('dark')" 
            class="flex-1"
          />
          <Button 
            :label="t('configuracion_modal.tema_claro')" 
            icon="pi pi-sun"
            :class="temaActual === 'light' ? 'btn-nuevo' : 'p-button-outlined btn-cancelar'" 
            @click="cambiarTema('light')" 
            class="flex-1"
          />
        </div>
      </div>

      <!-- Switch de Devoluciones Pendientes -->
      <div class="field flex flex-column gap-2 border-top-1 border-gray-600 pt-3">
        <span class="label-blanco font-semibold">Correos de Devoluciones Pendientes</span>
        <div class="flex align-items-center justify-content-between p-3 surface-100 border-round">
          <div>
            <span class="text-white text-sm font-bold block">Envío automático (Prueba)</span>
            <span class="text-xs text-400">Manda correo cada 1 minuto si hay pendientes</span>
          </div>
          <InputSwitch 
            v-model="correosActivos" 
            @change="toggleAutomatizacion(correosActivos)" 
          />
        </div>
      </div>

      <!-- Botón para Enviar Reporte Semanal -->
      <div class="field flex flex-column gap-2 border-top-1 border-gray-600 pt-3">
        <span class="label-blanco font-semibold">Reporte Semanal de Salidas</span>
        <div class="flex align-items-center justify-content-between p-3 surface-100 border-round">
          <div>
            <span class="text-white text-sm font-bold block">Generar Historial</span>
            <span class="text-xs text-400">Envía Excel con salidas de los últimos 7 días</span>
          </div>
          <Button 
            icon="pi pi-send" 
            :label="enviandoReporte ? 'Enviando...' : 'Enviar'" 
            :disabled="enviandoReporte"
            @click="generarReporteSemanal" 
            class="p-button-sm btn-nuevo"
          />
        </div>
      </div>

    </div>

    <template #footer>
      <div class="flex justify-content-end gap-2 mt-2">
        <Button :label="t('configuracion_modal.btn_cerrar')" icon="pi pi-check" class="btn-nuevo font-bold" @click="mostrarModalConfig = false" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
/* =========================================================
   ESTILOS ESCRITORIO
   ========================================================= */
.sidebar {
  background-color: #063b69; 
  color: white;
  height: 100vh;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-x: hidden;
  box-shadow: 2px 0 5px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  z-index: 1000;
  position: relative; 
}

.sidebar.abierto { width: 250px; transform: translateX(0); }
.sidebar.cerrado { width: 70px; transform: translateX(0); }

.menu-overlay { display: none; }

.sidebar-header {
  background-color: #042a4d; 
  height: 65px; 
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.titulo-menu { 
  color: white; margin: 0; font-size: 1.25rem; font-weight: 900; 
  letter-spacing: 0.5px; text-transform: uppercase;
}
.icono-central { font-size: 1.5rem; }

.nav-list { 
  list-style: none; padding: 0.75rem; margin: 0; 
  display: flex; flex-direction: column; flex-grow: 1; gap: 0.35rem; 
}

.nav-item {
  display: flex; align-items: center; padding: 0.85rem 1rem;
  color: #ffffff; cursor: pointer; border-radius: 8px; 
  transition: all 0.2s; font-weight: 700; white-space: nowrap; 
}

.nav-item:hover { background-color: rgba(255, 255, 255, 0.1); }
.nav-item.activo { background-color: #cca253; color: #042a4d; }

.btn-salir { color: #fca5a5; }
.btn-salir:hover { background-color: #ef4444; color: #ffffff; }

.nav-item i { min-width: 32px; text-align: left; font-size: 1.25rem; }
.ml-3 { margin-left: 0.5rem; }

/* =========================================================
   ESTILO RESPONSIVO MÓVILES
   ========================================================= */
@media (max-width: 992px) {
  .sidebar {
    position: fixed;
    top: 1rem;       
    left: 1rem;      
    height: calc(100dvh - 2rem); 
    border-radius: 16px; 
  }

  .sidebar.abierto {
    width: 260px;
    transform: translateX(0);
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
  }

  .sidebar.cerrado {
    width: 260px; 
    transform: translateX(-120%); 
  }

  .sidebar-header {
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
  }

  .menu-overlay {
    display: block;
    position: fixed;
    top: 0; left: 0; 
    width: 100vw; height: 100vh;
    background-color: rgba(11, 26, 38, 0.6); 
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    z-index: 999;
    cursor: pointer; 
  }
}
</style>