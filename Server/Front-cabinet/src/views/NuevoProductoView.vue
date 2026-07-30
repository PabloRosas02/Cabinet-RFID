<script setup>
import { ref } from 'vue';
import Button from 'primevue/button'; 
import Menu from 'primevue/menu'; 
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

import FormularioProducto from '@/components/productos/FomularioProducto.vue'; 
import { useGestorArchivos } from '@/composables/useGestordeArchivos';
import { HerramientasService } from '@/services/herramientasService';

const cargando = ref(false);
const cargandoImportacion = ref(false); 
const toast = useToast(); 

const formRef = ref(null);
const fileInput = ref(null); 
const menuDescarga = ref(null); 

// Destructuramos las funciones expertas del composable
const { descargarPlantillaHerramientas, extraerDatosDeArchivo } = useGestorArchivos();

// =====================================================================
// Opciones del Menu Desplegable
// =====================================================================
const opcionesDescarga = ref([
    {
        label: 'Descargar CSV (.csv)',
        icon: 'pi pi-file',
        command: () => descargarPlantillaHerramientas('csv') // Llamada directa
    },
    {
        label: 'Descargar Excel (.xlsx)',
        icon: 'pi pi-file-excel',
        command: () => descargarPlantillaHerramientas('xlsx') // Llamada directa
    }
]);

const toggleMenu = (event) => {
    menuDescarga.value.toggle(event);
};

// =====================================================================
// Guardar Producto Manualmente
// =====================================================================
const guardarProducto = async (herramientaData) => {
    // Limpiamos los toasts anteriores para evitar que se apilen (Spam)
    toast.removeAllGroups();

    if (!herramientaData.codigo?.trim() || !herramientaData.nombre?.trim()) {
        toast.add({ severity: 'warn', summary: 'Campos Obligatorios', detail: 'El Código y el Nombre son obligatorios para registrar el producto.', life: 4000 });
        return; 
    }

    cargando.value = true;
    try {
        await HerramientasService.crear(herramientaData);
        toast.add({ severity: 'success', summary: 'Producto Registrado', detail: 'El nuevo producto se guardó correctamente.', life: 4000 });
        
        setTimeout(() => { if (formRef.value) formRef.value.limpiar(); }, 500);
    } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        toast.add({ severity: 'error', summary: 'Error al guardar', detail: errorMsg, life: 5000 });
    } finally {
        cargando.value = false;
    }
};

// =====================================================================
// Procesar y Subir Archivo (.csv o .xlsx)
// =====================================================================
const procesarArchivo = async (evento) => {
    const archivo = evento.target.files[0];
    if (!archivo) return;

    // Limpiamos los toasts anteriores para evitar que se apilen (Spam)
    toast.removeAllGroups();

    cargandoImportacion.value = true;
    toast.add({ severity: 'info', summary: 'Procesando archivo', detail: 'Analizando el documento, por favor espera...', life: 3000 });

    try {
        // El composable se encarga de todo el parseo difícil y nos devuelve el arreglo limpio
        const herramientas = await extraerDatosDeArchivo(archivo);

        // Le pasamos el arreglo limpio al Servicio del backend
        const dataResponse = await HerramientasService.importar(herramientas);
        
        toast.removeAllGroups(); // Limpiamos el aviso de "Procesando" para mostrar el éxito
        toast.add({ 
            severity: 'success', 
            summary: 'Importación Exitosa', 
            detail: `${dataResponse.creados} herramientas creadas y ${dataResponse.actualizados} actualizadas.`, 
            life: 6000 
        });
        
    } catch (error) {
        toast.removeAllGroups(); // Limpiamos el aviso de "Procesando" para mostrar el error
        const errorMsg = error.response?.data?.error || error.message;
        toast.add({ severity: 'error', summary: 'Error de Importación', detail: errorMsg, life: 6000 });
    } finally {
        evento.target.value = ''; 
        cargandoImportacion.value = false;
    }
};
</script>

<template>
  <Toast /> 
  <div class="panel-nuevo-producto p-3 md:p-4 border-round-xl shadow-1 max-w-70rem mx-auto mt-4">
    <div class="flex flex-column lg:flex-row justify-content-between align-items-start lg:align-items-center mb-4 gap-4">
        <h2 class="text-2xl font-bold m-0" style="color: #5ab1ce;">Registrar Nuevo Producto</h2>
        
        <div class="flex flex-column sm:flex-row gap-2 w-full lg:w-auto">
            <Button 
                type="button" label="Descargar Plantilla" icon="pi pi-angle-down" iconPos="right"
                class="p-button-outlined text-white border-white hover:bg-white-alpha-10 w-full sm:w-auto" 
                @click="toggleMenu" aria-haspopup="true" aria-controls="overlay_menu"
            />
            <Menu ref="menuDescarga" id="overlay_menu" :model="opcionesDescarga" :popup="true" class="menu-oscuro" />
            
            <input 
                id="inputSubirArchivo" type="file" ref="fileInput" class="hidden"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
                @change="procesarArchivo" 
            />
            <Button 
                label="Importar Archivo (.xlsx / .csv)" icon="pi pi-upload" severity="success" 
                :loading="cargandoImportacion" class="w-full sm:w-auto"
                @click="$refs.fileInput.click()" 
            />
        </div>
    </div>
    <FormularioProducto ref="formRef" :cargando="cargando" @guardar="guardarProducto" />
  </div>
</template>

<style scoped>
.panel-nuevo-producto { background-color: #2a323d !important; color: #ffffff; }
.hidden { display: none; }
:deep(.menu-oscuro) { background-color: #1e252d !important; border: 1px solid #4a5568 !important; }
:deep(.menu-oscuro .p-menuitem-link) { color: #ffffff !important; }
:deep(.menu-oscuro .p-menuitem-link:hover) { background-color: #36464d !important; }
:deep(.menu-oscuro .p-menuitem-icon) { color: #5ab1ce !important; }
</style>