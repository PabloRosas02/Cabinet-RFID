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
    maquina: ''  
});

const inventario = ref([]);
const pedidoActual = ref([]);
const usuarios = ref([]); 
const cargando = ref(false);

// Cargar datos desde tu backend real (PostgreSQL)
const cargarInventario = async () => {
    cargando.value = true;
    try {
        const response = await axios.get('/api/herramientas');
        inventario.value = response.data;
    } catch (error) {
        console.error("Error al cargar el inventario:", error);
    } finally {
        cargando.value = false;
    }
};

const cargarUsuarios = async () => {
    try {
        const response = await axios.get('/api/usuarios');
        usuarios.value = response.data;
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
    }
};

onMounted(() => {
    cargarInventario();
    cargarUsuarios();
});

// Lógica del Carrito
const manejarAgregar = (herramienta) => {
    const itemExistente = pedidoActual.value.find(h => h.id === herramienta.id);
    
    if (itemExistente) {
        if (itemExistente.cantidadLlevada < herramienta.cantidadDisponible) {
            itemExistente.cantidadLlevada++;
        } else {
            // Limpia los toasts anteriores antes de mostrar el nuevo
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

// Registro de Pedido
const procesarPedido = async () => {
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
            prestadorId: usuarioSesion.id, 
            herramientas: pedidoActual.value.map(item => ({
                id: item.id,
                cantidadPrestada: item.cantidadLlevada
            }))
        };

        await axios.post('/api/salidas', payload);

        // TOAST DE ÉXITO 
        toast.removeAllGroups();
        toast.add({ 
            severity: 'success', 
            summary: t('view_salidas.toast_exito_titulo'), 
            detail: t('view_salidas.toast_exito_detalle'), 
            life: 3000 
        });
        
        await cargarInventario();
        
        trabajador.value = { numero: '', nombre: '', orden: '', maquina: '' };
        pedidoActual.value = [];

    } catch (error) {
        console.error("Error al guardar el pedido:", error);
        
        // TOAST DE ERROR
        toast.removeAllGroups();
        toast.add({ 
            severity: 'error', 
            summary: t('view_salidas.toast_error_titulo'), 
            detail: error.response?.data?.error || error.message || t('view_salidas.toast_error_detalle'), 
            life: 5000 
        });
    }
};
</script>

<template>
  <!-- Padding responsivo y color de texto base -->
  <div class="p-3 md:p-4 text-gray-200 overflow-x-hidden">
    
    <Toast />
    <div class="flex flex-column lg:flex-row gap-4">

      <div class="w-full lg:w-7 xl:w-8">
          <CatalogoHerramientas 
            :inventario="inventario" 
            @agregar="manejarAgregar" 
          />
      </div>

      <div class="w-full lg:w-5 xl:w-4">
          <DetallePedido 
            :pedido="pedidoActual" 
            :trabajador="trabajador" 
            :listaUsuarios="usuarios"
            @quitar="manejarQuitar"
            @registrar="procesarPedido"
          />
      </div>

    </div>
  </div>
</template>