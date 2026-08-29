<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputSwitch from 'primevue/inputswitch'; 
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import axios from 'axios';

const props = defineProps({
  menuAbierto: Boolean
});

const emit = defineEmits(['toggle', 'update:menuAbierto']);
const route = useRoute();
const router = useRouter();

const { t, locale } = useI18n();
const toast = useToast();

// Estados para el Modal de Configuración y Preferencias
const mostrarModalConfig = ref(false);
const temaActual = ref(localStorage.getItem('theme') || 'dark');

// Estado para la automatización de correos
const correosActivos = ref(false);

// Estados para los correos destinatarios opcionales
const correoPendientes = ref('');
const correoReporte = ref('');
const correoStock = ref('');

// Estados para evitar doble clic en los envíos de correo
const enviandoReporte = ref(false);
const enviandoAlertaStock = ref(false);

// Consultar el estado inicial del cron al montar el componente
const cargarEstadoAutomatizacion = async () => {
  try {
    const { data } = await axios.get('/api/configuracion/automatizacion');
    correosActivos.value = data.activo;
  } catch (error) {
    console.error('Error al cargar el estado de la automatización:', error);
  }
};

// Cambiar el estado del cron al presionar el switch (enviando correo destino)
const toggleAutomatizacion = async (nuevoValor) => {
  try {
    const { data } = await axios.post('/api/configuracion/automatizacion', { 
      activo: nuevoValor,
      correoDestino: correoPendientes.value
    });
    correosActivos.value = data.activo;
    
    if (data.activo) {
      toast.add({ 
        severity: 'info', 
        summary: 'Automatización Activada', 
        detail: `Alertas configuradas hacia: ${data.destinatario}`, 
        life: 4000 
      });
    }
  } catch (error) {
    console.error('Error al actualizar la automatización:', error);
    correosActivos.value = !nuevoValor; 
  }
};

// Función para disparar el reporte semanal manualmente
const generarReporteSemanal = async () => {
  enviandoReporte.value = true;
  try {
    const { data } = await axios.post('/api/reportes/historial-semanal', {
      correoDestino: correoReporte.value
    });

    if (data.success) {
      toast.add({ 
        severity: 'success', 
        summary: 'Reporte Enviado', 
        detail: data.mensaje || `Reporte enviado con éxito a ${data.destinatario}. Registros: ${data.registros}`, 
        life: 4000 
      });
      correoReporte.value = ''; // Limpiar input tras envío exitoso
    } else {
      toast.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Hubo un problema al generar el reporte.', 
        life: 4000 
      });
    }
  } catch (error) {
    console.error('Error al solicitar el reporte semanal:', error);
    toast.add({ 
      severity: 'error', 
      summary: 'Error del Servidor', 
      detail: 'Ocurrió un error en el servidor al enviar el correo.', 
      life: 4000 
    });
  } finally {
    enviandoReporte.value = false;
  }
};

// Función para disparar la alerta de stock manualmente
const enviarAlertaStock = async () => {
  enviandoAlertaStock.value = true;
  try {
    const { data } = await axios.post('/api/reportes/alertas-stock', {
      correoDestino: correoStock.value
    });

    if (data.success) {
      if (data.registros) {
        toast.add({ 
          severity: 'warn', 
          summary: 'Alerta Enviada', 
          detail: `Se notificaron ${data.registros} herramientas a ${data.destinatario}.`, 
          life: 4000 
        });
        correoStock.value = ''; // Limpiar input tras envío exitoso
      } else {
        toast.add({ 
          severity: 'info', 
          summary: 'Inventario Sano', 
          detail: data.mensaje || 'No hay herramientas en stock mínimo.', 
          life: 4000 
        });
      }
    } else {
      toast.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Hubo un problema al generar la alerta de stock.', 
        life: 4000 
      });
    }
  } catch (error) {
    console.error('Error al solicitar la alerta de stock:', error);
    toast.add({ 
      severity: 'error', 
      summary: 'Error del Servidor', 
      detail: 'Ocurrió un error al procesar la alerta de inventario.', 
      life: 4000 
    });
  } finally {
    enviandoAlertaStock.value = false;
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
    class="modal-configuracion"
    dismissableMask
  >
    <div class="flex flex-column gap-4 pt-2">
      
      <!-- Selector de Idioma -->
      <div class="field flex flex-column gap-2">
        <span class="text-color font-semibold">{{ t('configuracion_modal.idioma') }}</span>
        <div class="flex gap-2">
          <Button 
            label="Español" 
            :class="locale === 'es' ? 'p-button-primary' : 'p-button-outlined p-button-secondary'" 
            @click="cambiarIdioma('es')" 
            class="flex-1"
          />
          <Button 
            label="English" 
            :class="locale === 'en' ? 'p-button-primary' : 'p-button-outlined p-button-secondary'" 
            @click="cambiarIdioma('en')" 
            class="flex-1"
          />
        </div>
      </div>

      <!-- Selector de Tema -->
      <div class="field flex flex-column gap-2">
        <span class="text-color font-semibold">{{ t('configuracion_modal.tema') }}</span>
        <div class="flex gap-2">
          <Button 
            :label="t('configuracion_modal.tema_oscuro')" 
            icon="pi pi-moon"
            :class="temaActual === 'dark' ? 'p-button-primary' : 'p-button-outlined p-button-secondary'" 
            @click="cambiarTema('dark')" 
            class="flex-1"
          />
          <Button 
            :label="t('configuracion_modal.tema_claro')" 
            icon="pi pi-sun"
            :class="temaActual === 'light' ? 'p-button-primary' : 'p-button-outlined p-button-secondary'" 
            @click="cambiarTema('light')" 
            class="flex-1"
          />
        </div>
      </div>

      <!-- Switch de Devoluciones Pendientes -->
      <div class="field flex flex-column gap-2 border-top-1 surface-border pt-3">
        <span class="text-color font-semibold">Correos de Devoluciones Pendientes</span>
        <div class="flex flex-column gap-2 p-3 surface-ground border-round">
          <div class="flex align-items-center justify-content-between">
            <div>
              <span class="text-color text-sm font-bold block">Envío automático (Prueba)</span>
              <span class="text-color-secondary text-xs">Manda correo cada 1 minuto si hay pendientes</span>
            </div>
            <InputSwitch 
              v-model="correosActivos" 
              @change="toggleAutomatizacion(correosActivos)" 
            />
          </div>
          <InputText 
            v-model="correoPendientes" 
            placeholder="ejemplo@correo.com (opcional)" 
            class="w-full p-inputtext-sm mt-1" 
          />
        </div>
      </div>

      <!-- Botón para Enviar Reporte Semanal -->
      <div class="field flex flex-column gap-2 border-top-1 surface-border pt-3">
        <span class="text-color font-semibold">Reporte Semanal de Salidas</span>
        <div class="flex flex-column gap-2 p-3 surface-ground border-round">
          <div>
            <span class="text-color text-sm font-bold block">Generar Historial</span>
            <span class="text-color-secondary text-xs">Envía Excel con salidas de los últimos 7 días</span>
          </div>
          <div class="flex gap-2 w-full mt-1">
            <InputText 
              v-model="correoReporte" 
              placeholder="ejemplo@correo.com (opcional)" 
              class="w-full p-inputtext-sm" 
            />
            <Button 
              icon="pi pi-send" 
              :label="enviandoReporte ? 'Enviando...' : 'Enviar'" 
              :disabled="enviandoReporte"
              @click="generarReporteSemanal" 
              class="p-button-sm p-button-primary"
              style="white-space: nowrap;"
            />
          </div>
        </div>
      </div>

      <!-- Botón para Enviar Alerta de Stock Mínimo -->
      <div class="field flex flex-column gap-2 border-top-1 surface-border pt-3">
        <span class="text-color font-semibold">Alerta de Stock Mínimo</span>
        <div class="flex flex-column gap-2 p-3 surface-ground border-round">
          <div>
            <span class="text-color text-sm font-bold block">Verificar Inventario</span>
            <span class="text-color-secondary text-xs">Notifica herramientas con stock crítico</span>
          </div>
          <div class="flex gap-2 w-full mt-1">
            <InputText 
              v-model="correoStock" 
              placeholder="ejemplo@correo.com (opcional)" 
              class="w-full p-inputtext-sm" 
            />
            <Button 
              icon="pi pi-exclamation-triangle" 
              :label="enviandoAlertaStock ? 'Enviando...' : 'Verificar'" 
              :disabled="enviandoAlertaStock"
              @click="enviarAlertaStock" 
              class="p-button-sm p-button-warning"
              style="white-space: nowrap;"
            />
          </div>
        </div>
      </div>

    </div>

    <template #footer>
      <div class="flex justify-content-end gap-2 mt-2">
        <Button :label="t('configuracion_modal.btn_cerrar')" icon="pi pi-check" class="p-button-primary font-bold" @click="mostrarModalConfig = false" />
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
  color: #ffffff !important; 
  margin: 0; 
  font-size: 1.25rem; 
  font-weight: 900; 
  letter-spacing: 0.5px; 
  text-transform: uppercase;
}

.icono-central { 
  color: #ffffff !important;
  font-size: 1.5rem; 
}

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