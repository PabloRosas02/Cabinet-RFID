<script setup>
import { ref } from 'vue';
import Button from 'primevue/button'; 
import Menu from 'primevue/menu'; 
import Toast from 'primevue/toast';
import ExcelJS from 'exceljs';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';

import FormularioProducto from '@/components/productos/FomularioProducto.vue'; 
import { useExportarCSV } from '@/composables/useExportarCSV.js'; 

const cargando = ref(false);
const cargandoImportacion = ref(false); 
const toast = useToast(); 

const formRef = ref(null);
const fileInput = ref(null); 
const menuDescarga = ref(null); 

const { generarDescarga, generarDescargaExcel } = useExportarCSV();

// =====================================================================
// Opciones del Menu Desplegable
// =====================================================================
const opcionesDescarga = ref([
    {
        label: 'Descargar CSV (.csv)',
        icon: 'pi pi-file',
        command: () => descargarPlantilla('csv')
    },
    {
        label: 'Descargar Excel (.xlsx)',
        icon: 'pi pi-file-excel',
        command: () => descargarPlantilla('xlsx')
    }
]);

const toggleMenu = (event) => {
    menuDescarga.value.toggle(event);
};

// =====================================================================
// Guardar Producto Manualmente
// =====================================================================
const guardarProducto = async (herramientaData) => {
    cargando.value = true;
    
    try {
        await axios.post('/api/herramientas', herramientaData);

        //TOAST DE ÉXITO
        toast.add({ severity: 'success', summary: 'Producto Registrado', detail: 'El nuevo producto se guardó correctamente en el inventario.', life: 4000 });
        
        setTimeout(() => {
            if (formRef.value) formRef.value.limpiar();
        }, 500);

    } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        //TOAST DE ERROR
        toast.add({ severity: 'error', summary: 'Error al guardar', detail: errorMsg, life: 5000 });
    } finally {
        cargando.value = false;
    }
};

// =====================================================================
// Descargar Plantilla 
// =====================================================================
const descargarPlantilla = (formato) => {
    if (formato === 'csv') {
        const cabeceras = ['Codigo', 'Nombre', 'Marca', 'Descripcion', 'Cantidad', 'CantidadMinima', 'Tipo', 'Ubicacion'];
        const filaEjemplo = ['"HERR-EJEMPLO"', '"Taladro Inalámbrico"', '"DeWalt"', '"Taladro de 20V con batería"', '"5"', '"1"', '"Eléctrica"', '"Estante A"'];
        generarDescarga('Plantilla_Nuevas_Herramientas.csv', cabeceras, [filaEjemplo.join(',')]);
    } else {
        const datosParaExcel = [{
            Codigo: 'HERR-EJEMPLO',
            Nombre: 'Taladro Inalámbrico',
            Marca: 'DeWalt',
            Descripcion: 'Taladro de 20V con batería',
            Cantidad: 5,
            CantidadMinima: 1,
            Tipo: 'Eléctrica',
            Ubicacion: 'Estante A'
        }];
        generarDescargaExcel('Plantilla_Nuevas_Herramientas.xlsx', datosParaExcel);
    }
};

// =====================================================================
// Procesar y Subir Archivo (.csv o .xlsx)
// =====================================================================
const procesarArchivo = async (evento) => {
    const archivo = evento.target.files[0];
    if (!archivo) return;

    cargandoImportacion.value = true;
    
    // TOAST DE INFORMACIÓN (Cargando)
    toast.add({ severity: 'info', summary: 'Procesando archivo', detail: 'Analizando el documento, por favor espera...', life: 3000 });

    try {
        let herramientas = [];

        if (archivo.name.toLowerCase().endsWith('.csv')) {
            const texto = await archivo.text();
            const lineas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lineas.length < 2) throw new Error("El archivo CSV está vacío o solo tiene cabeceras.");

            const leerFilaCSV = (linea) => {
                const resultado = [];
                let actual = '';
                let enComillas = false;
                for (let i = 0; i < linea.length; i++) {
                    const char = linea[i];
                    if (char === '"') enComillas = !enComillas;
                    else if (char === ',' && !enComillas) {
                        resultado.push(actual.trim());
                        actual = '';
                    } else actual += char;
                }
                resultado.push(actual.trim());
                return resultado;
            };

            const cabeceras = leerFilaCSV(lineas[0]).map(c => c.toLowerCase().replace(/\s+/g, ''));

            for (let i = 1; i < lineas.length; i++) {
                const valores = leerFilaCSV(lineas[i]);
                const obj = {};
                cabeceras.forEach((cabecera, index) => {
                    let valor = valores[index] || '';
                    if (cabecera.includes('codigo')) obj.codigo = valor;
                    if (cabecera.includes('nombre')) obj.nombre = valor;
                    if (cabecera.includes('marca')) obj.marca = valor;
                    if (cabecera.includes('descripcion')) obj.descripcion = valor;
                    if (cabecera.includes('cantidadminima')) obj.cantidadMinima = valor;
                    else if (cabecera.includes('cantidad')) obj.cantidad = valor;
                    if (cabecera.includes('tipo')) obj.tipo = valor;
                    if (cabecera.includes('ubicacion')) obj.ubicacion = valor;
                });
                if (obj.codigo && obj.nombre) herramientas.push(obj);
            }
        } 
        else if (archivo.name.toLowerCase().endsWith('.xlsx')) {
            const arrayBuffer = await archivo.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);
            
            const worksheet = workbook.worksheets[0]; 
            if (!worksheet || worksheet.rowCount < 2) throw new Error("El archivo Excel está vacío.");

            const cabeceras = {};
            
            worksheet.getRow(1).eachCell((cell, colNumber) => {
                cabeceras[colNumber] = String(cell.value || '').toLowerCase().replace(/\s+/g, '');
            });

            for (let i = 2; i <= worksheet.rowCount; i++) {
                const row = worksheet.getRow(i);
                const obj = {};
                
                row.eachCell((cell, colNumber) => {
                    const cabecera = cabeceras[colNumber];
                    if (!cabecera) return;
                    
                    let valor = '';
                    if (cell.value && typeof cell.value === 'object') {
                        valor = cell.value.result !== undefined ? String(cell.value.result) : String(cell.value.text || '');
                    } else {
                        valor = String(cell.value || '');
                    }
                    valor = valor.trim();

                    if (cabecera.includes('codigo')) obj.codigo = valor;
                    if (cabecera.includes('nombre')) obj.nombre = valor;
                    if (cabecera.includes('marca')) obj.marca = valor;
                    if (cabecera.includes('descripcion')) obj.descripcion = valor;
                    if (cabecera.includes('cantidadminima')) obj.cantidadMinima = valor;
                    else if (cabecera.includes('cantidad')) obj.cantidad = valor;
                    if (cabecera.includes('tipo')) obj.tipo = valor;
                    if (cabecera.includes('ubicacion')) obj.ubicacion = valor;
                });

                if (obj.codigo && obj.nombre) herramientas.push(obj);
            }
        } else {
            throw new Error("Formato de archivo no soportado. Por favor sube un .csv o .xlsx");
        }

        if (herramientas.length === 0) {
            throw new Error("No se encontraron registros válidos. Asegúrate de incluir 'Codigo' y 'Nombre'.");
        }

        const respuesta = await axios.post('/api/herramientas/importar', { 
            herramientas: herramientas 
        });

        const dataResponse = respuesta.data;
        
        // TOAST DE ÉXITO (EXCEL)
        toast.add({ 
            severity: 'success', 
            summary: 'Importación Exitosa', 
            detail: `${dataResponse.creados} herramientas creadas y ${dataResponse.actualizados} actualizadas.`, 
            life: 6000 
        });
        
    } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        // TOAST DE ERROR (EXCEL)
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
                type="button" 
                label="Descargar Plantilla" 
                icon="pi pi-angle-down" 
                iconPos="right"
                class="p-button-outlined text-white border-white hover:bg-white-alpha-10 w-full sm:w-auto" 
                @click="toggleMenu" 
                aria-haspopup="true" 
                aria-controls="overlay_menu"
            />
            <Menu ref="menuDescarga" id="overlay_menu" :model="opcionesDescarga" :popup="true" class="menu-oscuro" />
            
            <input 
                id="inputSubirArchivo"
                name="inputSubirArchivo"
                aria-label="Importar archivo excel o csv"
                type="file" 
                ref="fileInput" 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
                class="hidden" 
                @change="procesarArchivo" 
            />
            
            <Button 
                label="Importar Archivo (.xlsx / .csv)" 
                icon="pi pi-upload" 
                severity="success" 
                :loading="cargandoImportacion"
                class="w-full sm:w-auto"
                @click="$refs.fileInput.click()" 
            />
        </div>
    </div>

    <FormularioProducto 
        ref="formRef"
        :cargando="cargando"
        @guardar="guardarProducto"
    />
  </div>
</template>

<style scoped>
.panel-nuevo-producto {
    background-color: #2a323d !important;
    color: #ffffff;
}
.hidden {
    display: none;
}

/* =========================================================
   Estilos para el menú desplegable 
   ========================================================= */
:deep(.menu-oscuro) {
    background-color: #1e252d !important;
    border: 1px solid #4a5568 !important;
}
:deep(.menu-oscuro .p-menuitem-link) {
    color: #ffffff !important;
}
:deep(.menu-oscuro .p-menuitem-link:hover) {
    background-color: #36464d !important;
}
:deep(.menu-oscuro .p-menuitem-icon) {
    color: #5ab1ce !important;
}
</style>