<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputSwitch from 'primevue/inputswitch'; 
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
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

// Estados para el Modal de Configuración
const mostrarModalConfig = ref(false);
const temaActual = ref(localStorage.getItem('theme') || 'dark');

// Estado para la automatización de correos
const correosActivos = ref(false);

// Estados CRUD Destinatarios Permanentes (BD)
const listaDestinatariosBD = ref([]);
const nuevoCorreo = ref('');
const nuevoNombre = ref('');
const guardandoDestinatario = ref(false);

// Estados de carga de botones
const enviandoReporte = ref(false);
const enviandoAlertaStock = ref(false);

// Decodificar JWT del localStorage para obtener la sesión real
const obtenerPayloadToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error al decodificar el token:', error);
    return null;
  }
};

// Determinar permisos basados exclusivamente en el Token JWT
const esAdmin = computed(() => {
  const payload = obtenerPayloadToken();
  return payload?.rol === 'ADMINISTRADOR';
});

// Cargar datos administrativos solo si es Admin
const cargarDatosSensibles = async () => {
  if (!esAdmin.value) return;

  try {
    const [resAuto, resDest] = await Promise.all([
      axios.get('/api/configuracion/automatizacion'),
      axios.get('/api/configuracion/destinatarios')
    ]);
    correosActivos.value = resAuto.data.activo;
    listaDestinatariosBD.value = resDest.data;
  } catch (error) {
    console.error('Error al cargar datos de configuración:', error);
  }
};

// Crear Destinatario
const agregarDestinatario = async () => {
  if (!nuevoCorreo.value || !nuevoCorreo.value.includes('@')) {
    toast.add({ 
      severity: 'warn', 
      summary: t('configuracion_modal.atencion'), 
      detail: t('configuracion_modal.destinatarios.msj_correo_invalido'), 
      life: 3000 
    });
    return;
  }
  guardandoDestinatario.value = true;
  try {
    await axios.post('/api/configuracion/destinatarios', {
      correo: nuevoCorreo.value,
      nombre: nuevoNombre.value
    });
    toast.add({ 
      severity: 'success', 
      summary: t('configuracion_modal.exito'), 
      detail: t('configuracion_modal.destinatarios.msj_guardado_exito'), 
      life: 3000 
    });
    nuevoCorreo.value = '';
    nuevoNombre.value = '';
    const { data } = await axios.get('/api/configuracion/destinatarios');
    listaDestinatariosBD.value = data;
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.error || t('configuracion_modal.destinatarios.msj_guardado_error'), 
      life: 3000 
    });
  } finally {
    guardandoDestinatario.value = false;
  }
};

// Alternar activo/inactivo
const toggleEstadoDestinatario = async (registro) => {
  try {
    await axios.put(`/api/configuracion/destinatarios/${registro.id}`, {
      activo: !registro.activo
    });
    const { data } = await axios.get('/api/configuracion/destinatarios');
    listaDestinatariosBD.value = data;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado.', life: 3000 });
  }
};

// Eliminar Destinatario
const eliminarDestinatario = async (id) => {
  try {
    await axios.delete(`/api/configuracion/destinatarios/${id}`);
    toast.add({ 
      severity: 'info', 
      summary: t('configuracion_modal.eliminado'), 
      detail: t('configuracion_modal.destinatarios.msj_eliminado'), 
      life: 3000 
    });
    const { data } = await axios.get('/api/configuracion/destinatarios');
    listaDestinatariosBD.value = data;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el registro.', life: 3000 });
  }
};

// Toggle automatización
const toggleAutomatizacion = async (nuevoValor) => {
  try {
    const { data } = await axios.post('/api/configuracion/automatizacion', { 
      activo: nuevoValor
    });
    correosActivos.value = data.activo;
    
    if (data.activo) {
      toast.add({ 
        severity: 'info', 
        summary: t('configuracion_modal.pendientes.titulo'), 
        detail: data.mensaje || 'Automatización activada', 
        life: 4000 
      });
    }
  } catch (error) {
    console.error('Error al actualizar la automatización:', error);
    correosActivos.value = !nuevoValor; 
  }
};

// Generar reporte semanal
const generarReporteSemanal = async () => {
  enviandoReporte.value = true;
  try {
    const { data } = await axios.post('/api/reportes/historial-semanal');

    if (data.success) {
      toast.add({ 
        severity: 'success', 
        summary: t('configuracion_modal.reporte_semanal.titulo'), 
        detail: data.mensaje || 'Reporte enviado a los destinatarios activos.', 
        life: 4000 
      });
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
      summary: 'Error', 
      detail: 'Ocurrió un error en el servidor al enviar el correo.', 
      life: 4000 
    });
  } finally {
    enviandoReporte.value = false;
  }
};

// Enviar alerta de stock
const enviarAlertaStock = async () => {
  enviandoAlertaStock.value = true;
  try {
    const { data } = await axios.post('/api/reportes/alertas-stock');

    if (data.success) {
      if (data.registros) {
        toast.add({ 
          severity: 'warn', 
          summary: t('configuracion_modal.stock_minimo.titulo'), 
          detail: data.mensaje || `Se notificaron ${data.registros} herramientas.`, 
          life: 4000 
        });
      } else {
        toast.add({ 
          severity: 'info', 
          summary: t('configuracion_modal.stock_minimo.titulo'), 
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
      summary: 'Error', 
      detail: 'Ocurrió un error al procesar la alerta de inventario.', 
      life: 4000 
    });
  } finally {
    enviandoAlertaStock.value = false;
  }
};

// Cambiar Tema
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
  cargarDatosSensibles();
});

// Cambiar Idioma
const cambiarIdioma = (nuevoIdioma) => {
  locale.value = nuevoIdioma;
  localStorage.setItem('idiomaPreferido', nuevoIdioma);
};

// Cierre Responsivo
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
  localStorage.removeItem('token');
  localStorage.removeItem('usuarioActivo');
  router.push('/login');
  cerrarMenuMovil();
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
  const payload = obtenerPayloadToken();
  const rolActual = payload?.rol || 'OPERADOR';
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
      
      <!-- Botón de Configuración -->
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
    :breakpoints="{ '1199px': '85vw', '575px': '95vw' }" 
    :style="{ width: '580px' }" 
    class="modal-configuracion"
    dismissableMask
  >
    <div class="flex flex-column gap-4 pt-2">
      
      <!-- Selector de Idioma (Disponible para TODOS los usuarios) -->
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

      <!-- Selector de Tema (Disponible para TODOS los usuarios) -->
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

      <!-- BLOQUE EXCLUSIVO PARA ADMINISTRADORES (Validado vía Token JWT) -->
      <template v-if="esAdmin">

        <!-- GESTIÓN DE DESTINATARIOS -->
        <div class="field flex flex-column gap-2 border-top-1 surface-border pt-3">
          <span class="text-color font-semibold">{{ t('configuracion_modal.destinatarios.titulo') }}</span>
          <span class="text-color-secondary text-xs">{{ t('configuracion_modal.destinatarios.subtitulo') }}</span>

          <div class="flex gap-2 mt-1">
            <InputText 
              v-model="nuevoNombre" 
              :placeholder="t('configuracion_modal.destinatarios.placeholder_nombre')" 
              class="p-inputtext-sm w-4" 
            />
            <InputText 
              v-model="nuevoCorreo" 
              :placeholder="t('configuracion_modal.destinatarios.placeholder_correo')" 
              class="p-inputtext-sm w-6" 
            />
            <Button 
              icon="pi pi-plus" 
              :loading="guardandoDestinatario"
              @click="agregarDestinatario" 
              class="p-button-sm p-button-success"
            />
          </div>

          <DataTable :value="listaDestinatariosBD" class="p-datatable-sm mt-2 border-round surface-ground" responsiveLayout="scroll">
            <Column field="nombre" :header="t('configuracion_modal.destinatarios.col_nombre')">
              <template #body="slotProps">
                {{ slotProps.data.nombre || '—' }}
              </template>
            </Column>
            <Column field="correo" :header="t('configuracion_modal.destinatarios.col_correo')"></Column>
            <Column :header="t('configuracion_modal.destinatarios.col_activo')" style="width: 70px; text-align: center;">
              <template #body="slotProps">
                <InputSwitch 
                  :modelValue="slotProps.data.activo" 
                  @change="toggleEstadoDestinatario(slotProps.data)" 
                />
              </template>
            </Column>
            <Column :header="t('configuracion_modal.destinatarios.col_acciones')" style="width: 60px; text-align: center;">
              <template #body="slotProps">
                <Button 
                  icon="pi pi-trash" 
                  class="p-button-danger p-button-text p-button-sm" 
                  @click="eliminarDestinatario(slotProps.data.id)" 
                />
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- NOTIFICACIONES DEVOLUCIONES PENDIENTES -->
        <div class="field flex flex-column gap-2 border-top-1 surface-border pt-3">
          <span class="text-color font-semibold">{{ t('configuracion_modal.pendientes.titulo') }}</span>
          <div class="flex align-items-center justify-content-between p-3 surface-ground border-round">
            <div>
              <span class="text-color text-sm font-bold block">{{ t('configuracion_modal.pendientes.titulo') }}</span>
              <span class="text-color-secondary text-xs">{{ t('configuracion_modal.pendientes.subtitulo_cron') }}</span>
            </div>
            <InputSwitch 
              v-model="correosActivos" 
              @change="toggleAutomatizacion(correosActivos)" 
            />
          </div>
        </div>

        <!-- REPORTE SEMANAL -->
        <div class="field flex flex-column gap-2 border-top-1 surface-border pt-3">
          <span class="text-color font-semibold">{{ t('configuracion_modal.reporte_semanal.titulo') }}</span>
          <div class="flex align-items-center justify-content-between p-3 surface-ground border-round">
            <div>
              <span class="text-color-secondary text-xs">{{ t('configuracion_modal.reporte_semanal.subtitulo') }}</span>
            </div>
            <Button 
              icon="pi pi-send" 
              :label="enviandoReporte ? t('configuracion_modal.reporte_semanal.btn_enviando') : t('configuracion_modal.reporte_semanal.btn_enviar')" 
              :disabled="enviandoReporte"
              @click="generarReporteSemanal" 
              class="p-button-sm p-button-primary"
              style="white-space: nowrap;"
            />
          </div>
        </div>

        <!-- ALERTA STOCK MÍNIMO -->
        <div class="field flex flex-column gap-2 border-top-1 surface-border pt-3">
          <span class="text-color font-semibold">{{ t('configuracion_modal.stock_minimo.titulo') }}</span>
          <div class="flex align-items-center justify-content-between p-3 surface-ground border-round">
            <div>
              <span class="text-color-secondary text-xs">{{ t('configuracion_modal.stock_minimo.subtitulo') }}</span>
            </div>
            <Button 
              icon="pi pi-exclamation-triangle" 
              :label="enviandoAlertaStock ? t('configuracion_modal.stock_minimo.btn_verificando') : t('configuracion_modal.stock_minimo.btn_verificar')" 
              :disabled="enviandoAlertaStock"
              @click="enviarAlertaStock" 
              class="p-button-sm p-button-warning"
              style="white-space: nowrap;"
            />
          </div>
        </div>

      </template>

    </div>

    <template #footer>
      <div class="flex justify-content-end gap-2 mt-2">
        <Button :label="t('configuracion_modal.btn_cerrar')" icon="pi pi-check" class="p-button-primary font-bold" @click="mostrarModalConfig = false" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
/* ESTILOS ESCRITORIO */
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

/* ESTILO RESPONSIVO MÓVILES */
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