<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast'; 
import { useI18n } from 'vue-i18n'; 

import CatalogoHerramientas from '../components/salidas/CatalogoHerramientas.vue';
import DetallePedido from '../components/salidas/DetalleSalidas.vue';

const toast = useToast(); 
const { t } = useI18n();

const trabajador = ref({
    numero: '',
    nombre: '',
    orden: '',  
    maquina: '',
    motivo: '',
    motivoOtro: ''
});

const inventario = ref([]);
const listaCategorias = ref([]);
const pedidoActual = ref([]);
const cargando = ref(false);
const listaAdministradores = ref([]);

const totalRegistros = ref(0);
const paginaActual = ref(1);
const limitePorPagina = ref(10);
const terminoBusqueda = ref('');
const camposActuales = ref(['codigo', 'nombre']);
const categoriaActual = ref(null);

const cargarInventario = async (page = 1, search = '', campos = ['codigo', 'nombre'], categoriaId = null) => {
    cargando.value = true;
    try {
        paginaActual.value = page;
        terminoBusqueda.value = search;
        camposActuales.value = campos;
        categoriaActual.value = categoriaId;

        const camposQuery = Array.isArray(campos) ? campos.join(',') : campos;

        let url = `/api/herramientas?page=${page}&limit=${limitePorPagina.value}&search=${encodeURIComponent(search)}&categories=${camposQuery}`;
        if (categoriaId) {
            url += `&categoriaId=${categoriaId}`;
        }

        const response = await axios.get(url);
        
        inventario.value = [...response.data.data];
        totalRegistros.value = response.data.meta.total;
        
    } catch (error) {
        console.error("Error al cargar el inventario:", error);
    } finally {
        cargando.value = false;
    }
};

const cargarAdministradores = async () => {
    try {
        const response = await axios.get('/api/usuarios/administradores');
        listaAdministradores.value = response.data.data || response.data || [];
    } catch (error) {
        console.error("Error al cargar la lista de administradores:", error);
    }
};

const manejarPaginacion = (evento) => {
    const nuevaPagina = Math.floor(evento.first / evento.rows) + 1;
    limitePorPagina.value = evento.rows;
    cargarInventario(nuevaPagina, terminoBusqueda.value, camposActuales.value, categoriaActual.value);
};

const manejarFiltro = ({ search, campos, categoriaId }) => {
    cargarInventario(1, search, campos, categoriaId);
};

onMounted(() => {
    cargarInventario(1);
    cargarAdministradores();
});

const manejarAgregar = (herramienta) => {
    const itemExistente = pedidoActual.value.find(h => h.id === herramienta.id);
    
    if (itemExistente) {
        if (itemExistente.cantidadLlevada < herramienta.cantidadDisponible) {
            itemExistente.cantidadLlevada++;
        } else {
            toast.removeAllGroups(); 
            toast.add({ 
                severity: 'warn', 
                summary: t('view_salidas.toast_limite_titulo'), 
                detail: t('view_salidas.toast_limite_detalle'), 
                life: 3000 
            });
        }
    } else {
        pedidoActual.value.push({ ...herramienta, cantidadLlevada: 1 });
    }
};

const manejarQuitar = (id) => {
    pedidoActual.value = pedidoActual.value.filter(h => h.id !== id);
};

const procesarPedido = async (authData = null) => {
    try {
        const usuarioSesion = JSON.parse(localStorage.getItem('usuario')) || JSON.parse(localStorage.getItem('usuarioActivo'));

        if (!usuarioSesion || !usuarioSesion.id) {
            throw new Error(t('view_salidas.error_sesion'));
        }

        const payload = {
            trabajadorNumero: trabajador.value.numero,
            trabajadorNombre: trabajador.value.nombre,
            numeroOrden: trabajador.value.orden,      
            numeroMaquina: trabajador.value.maquina,  
            motivo: trabajador.value.motivo,
            motivoOtro: trabajador.value.motivoOtro,
            prestadorId: usuarioSesion.id, 
            herramientas: pedidoActual.value.map(item => ({
                id: item.id,
                cantidadPrestada: item.cantidadLlevada
            }))
        };

        if (authData && authData.adminId && authData.codigo) {
            payload.autorizacion = {
                adminId: authData.adminId,
                codigo: authData.codigo,
                hashValidacion: authData.hashValidacion
            };
        }

        await axios.post('/api/salidas', payload);

        toast.removeAllGroups();
        toast.add({ 
            severity: 'success', 
            summary: t('view_salidas.toast_exito_titulo'), 
            detail: t('view_salidas.toast_exito_detalle'), 
            life: 3000 
        });
        
        await cargarInventario(paginaActual.value, terminoBusqueda.value, camposActuales.value, categoriaActual.value);
        
        trabajador.value = { numero: '', nombre: '', orden: '', maquina: '', motivo: '', motivoOtro: '' };
        pedidoActual.value = [];

    } catch (error) {
        console.error("Error al guardar el pedido:", error);
        
        toast.removeAllGroups();
        toast.add({ 
            severity: 'error', 
            summary: t('view_salidas.toast_error_titulo'), 
            detail: error.response?.data?.error || error.response?.data?.message || error.message || t('view_salidas.toast_error_detalle'), 
            life: 5000 
        });
    }
};
</script>

<template>
  <div class="p-3 md:p-4 text-gray-200 overflow-x-hidden">
    
    <Toast />
    <div class="flex flex-column lg:flex-row gap-4">

      <div class="w-full lg:w-7 xl:w-8">
          <CatalogoHerramientas 
            :inventario="inventario" 
            :categorias="listaCategorias"
            :totalRegistros="totalRegistros"
            :cargando="cargando"
            @agregar="manejarAgregar" 
            @page="manejarPaginacion"
            @filter="manejarFiltro"
            />
      </div>

      <div class="w-full lg:w-5 xl:w-4">
          <DetallePedido 
            v-model:pedido="pedidoActual" 
            v-model:trabajador="trabajador" 
            :administradores="listaAdministradores"
            @quitar="manejarQuitar"
            @registrar="procesarPedido"
          />
      </div>

    </div>
  </div>
</template>