import ExcelJS from 'exceljs';
import { useI18n } from 'vue-i18n';

export function useGestorArchivos() {
    const { t, locale } = useI18n();
    
    // =======================================================
    // 1. Descargar CSV Genérico
    // =======================================================
    const generarDescarga = (nombreArchivo, cabeceras, filas) => {
        const contenidoCSV = cabeceras.join(',') + '\n' + filas.join('\n');
        const blob = new Blob(["\uFEFF" + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', nombreArchivo);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // =======================================================
    // 2. Descargar Excel Genérico
    // =======================================================
    const generarDescargaExcel = async (nombreArchivo, datosJson) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Hoja1');
        
        if (datosJson && datosJson.length > 0) {
            const cabeceras = Object.keys(datosJson[0]);
            worksheet.addRow(cabeceras);
            worksheet.getRow(1).font = { bold: true };
            
            datosJson.forEach(obj => {
                const fila = cabeceras.map(cabecera => obj[cabecera]);
                worksheet.addRow(fila);
            });
        }
        
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', nombreArchivo);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // =======================================================
    // 3. Generar Plantilla Específica para Herramientas
    // =======================================================
    const descargarPlantillaHerramientas = (formato) => {
        const nombreArchivo = t('export.plantilla_herramientas');
        if (formato === 'csv') {
            const cabeceras = [t('export.codigo'), t('export.nombre'), t('export.marca'), t('export.descripcion'), t('export.cantidad'), t('export.cantidad_minima'), t('export.cantidad_maxima', 'Cantidad Máxima'), t('export.tipo'), t('export.ubicacion')];
            const filaEjemplo = ['"HERR-EJEMPLO"', `"${t('export.ejemplo_taladro')}"`, '"DeWalt"', `"${t('export.ejemplo_desc')}"`, '"5"', '"1"', '"10"', `"${t('export.ejemplo_tipo')}"`, '"Estante A"'];
            generarDescarga(`${nombreArchivo}.csv`, cabeceras, [filaEjemplo.join(',')]);
        } else {
            const datosParaExcel = [{
                [t('export.codigo')]: 'HERR-EJEMPLO',
                [t('export.nombre')]: t('export.ejemplo_taladro'),
                [t('export.marca')]: 'DeWalt',
                [t('export.descripcion')]: t('export.ejemplo_desc'),
                [t('export.cantidad')]: 5,
                [t('export.cantidad_minima')]: 1,
                [t('export.cantidad_maxima', 'Cantidad Máxima')]: 10,
                [t('export.tipo')]: t('export.ejemplo_tipo'),
                [t('export.ubicacion')]: 'Estante A'
            }];
            generarDescargaExcel(`${nombreArchivo}.xlsx`, datosParaExcel);
        }
    };

    // =======================================================
    // 4. Leer Archivo (CSV o Excel) y extraer datos limpios
    // =======================================================
    const extraerDatosDeArchivo = async (archivo) => {
        let herramientas = [];

        if (archivo.name.toLowerCase().endsWith('.csv')) {
            const texto = await archivo.text();
            const lineas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lineas.length < 2) throw new Error(t('export.error_csv_vacio'));

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
                    if (cabecera.includes('codigo') || cabecera.includes('code')) obj.codigo = valor;
                    if (cabecera.includes('nombre') || cabecera.includes('name')) obj.nombre = valor;
                    if (cabecera.includes('marca') || cabecera.includes('brand')) obj.marca = valor;
                    if (cabecera.includes('descripcion') || cabecera.includes('description')) obj.descripcion = valor;
                    if (cabecera.includes('cantidadminima') || cabecera.includes('minquantity')) obj.cantidadMinima = valor;
                    // SE AGREGÓ: Identificador para el stock máximo
                    if (cabecera.includes('cantidadmaxima') || cabecera.includes('maxquantity')) obj.cantidadMaxima = valor;
                    else if (cabecera.includes('cantidad') || cabecera.includes('quantity')) obj.cantidad = valor;
                    if (cabecera.includes('tipo') || cabecera.includes('type')) obj.tipo = valor;
                    if (cabecera.includes('ubicacion') || cabecera.includes('location')) obj.ubicacion = valor;
                });
                if (obj.codigo && obj.nombre) herramientas.push(obj);
            }
        } 
        else if (archivo.name.toLowerCase().endsWith('.xlsx')) {
            const arrayBuffer = await archivo.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);
            
            const worksheet = workbook.worksheets[0]; 
            if (!worksheet || worksheet.rowCount < 2) throw new Error(t('export.error_excel_vacio'));

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

                    if (cabecera.includes('codigo') || cabecera.includes('code')) obj.codigo = valor;
                    if (cabecera.includes('nombre') || cabecera.includes('name')) obj.nombre = valor;
                    if (cabecera.includes('marca') || cabecera.includes('brand')) obj.marca = valor;
                    if (cabecera.includes('descripcion') || cabecera.includes('description')) obj.descripcion = valor;
                    if (cabecera.includes('cantidadminima') || cabecera.includes('minquantity')) obj.cantidadMinima = valor;
                    if (cabecera.includes('cantidadmaxima') || cabecera.includes('maxquantity')) obj.cantidadMaxima = valor;
                    else if (cabecera.includes('cantidad') || cabecera.includes('quantity')) obj.cantidad = valor;
                    if (cabecera.includes('tipo') || cabecera.includes('type')) obj.tipo = valor;
                    if (cabecera.includes('ubicacion') || cabecera.includes('location')) obj.ubicacion = valor;
                });

                if (obj.codigo && obj.nombre) herramientas.push(obj);
            }
        } else {
            throw new Error(t('export.error_formato'));
        }

        if (herramientas.length === 0) {
            throw new Error(t('export.error_sin_registros'));
        }

        return herramientas;
    };

    // =======================================================
    // 5. Exportar Bitácora de Auditoría
    // =======================================================
    const exportarBitacora = (bitacoraDatos, filtroTiempo, formato) => {
        if (!bitacoraDatos || bitacoraDatos.length === 0) {
            alert(t('export.alerta_sin_datos'));
            return;
        }
        
        const hoy = new Date();
        const strLocale = locale.value; 
        
        const esHoyOTodos = ['Hoy', 'Todos', t('filtros.hoy'), t('filtros.todos')].includes(filtroTiempo);
        const esEsteMes = ['Este Mes', t('filtros.este_mes')].includes(filtroTiempo);
        const esEsteAno = ['Este Año', t('filtros.este_anio')].includes(filtroTiempo);

        const sufijoFecha = esHoyOTodos ? `${hoy.getDate().toString().padStart(2, '0')}_${hoy.toLocaleString(strLocale, { month: 'short' }).replace('.', '')}_${hoy.getFullYear()}` : 
                            esEsteMes ? `${hoy.toLocaleString(strLocale, { month: 'long' })}_${hoy.getFullYear()}` : 
                            esEsteAno ? `${hoy.getFullYear()}` : `${t('export.semana')}_${hoy.getDate()}`; 
        
        const nombreArchivo = `${t('export.reporte_bitacora')}_${sufijoFecha}`;
        
        const formatearFechaReporte = (fechaString) => {
            return new Date(fechaString).toLocaleDateString(strLocale, { 
                year: 'numeric', month: 'short', day: 'numeric', 
                hour: '2-digit', minute: '2-digit' 
            });
        };

        const traducirAccion = (accion) => {
            if (accion === 'CREACION') return t('export.accion_creacion');
            if (accion === 'MODIFICACION') return t('export.accion_modificacion');
            if (accion === 'ELIMINACION') return t('export.accion_eliminacion');
            return accion;
        };

        if (formato === 'csv') {
            const cabeceras = [t('export.fecha'), t('export.accion'), t('export.col_codigo_herr'), t('export.col_nombre_herr'), t('export.usuario'), t('export.rol')];
            const filas = bitacoraDatos.map(b => 
                `"${formatearFechaReporte(b.fecha)}","${traducirAccion(b.accion)}","${b.herramienta?.codigo || t('export.na')}","${b.herramienta?.nombre || t('export.na')}","${b.usuario?.nombre || t('export.na')}","${b.usuario?.rol || t('export.na')}"`
            );
            generarDescarga(`${nombreArchivo}.csv`, cabeceras, filas);
        } else {
            const datosExcel = bitacoraDatos.map(b => ({
                [t('export.fecha')]: formatearFechaReporte(b.fecha),
                [t('export.accion')]: traducirAccion(b.accion),
                [t('export.col_codigo_herr')]: b.herramienta?.codigo || t('export.na'),
                [t('export.col_nombre_herr')]: b.herramienta?.nombre || t('export.desconocido'),
                [t('export.usuario_autor')]: b.usuario?.nombre || t('export.na'),
                [t('export.rol')]: b.usuario?.rol || t('export.na')
            }));
            generarDescargaExcel(`${nombreArchivo}.xlsx`, datosExcel);
        }
    };

    // =======================================================
    // 6. Exportar Inventario Actual
    // =======================================================
    const exportarInventario = (herramientasVisibles, formato) => {
        if (!herramientasVisibles || herramientasVisibles.length === 0) {
            alert(t('export.alerta_sin_datos'));
            return;
        }

        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = `${t('export.reporte_inventario')}_${fecha}`;

        if (formato === 'csv') {
            // SE AGREGÓ: t('export.stock_max')
            const cabeceras = [t('export.codigo'), t('export.nombre'), t('export.tipo'), t('export.ubicacion'), t('export.stock_min'), t('export.stock_max', 'Stock Máx.'), t('export.stock_fisico')];
            const filas = herramientasVisibles.map(h => {
                // SE AGREGÓ: ${h.cantidadMaxima || ''}
                return `"${h.codigo}","${h.nombre}","${h.tipo || ''}","${h.ubicacion || ''}","${h.cantidadMinima}","${h.cantidadMaxima || ''}","${h.cantidadDisponible}"`;
            });
            generarDescarga(`${nombreArchivo}.csv`, cabeceras, filas);
        } 
        else if (formato === 'xlsx') {
            const datosParaExcel = herramientasVisibles.map(h => ({
                [t('export.codigo')]: h.codigo,
                [t('export.nombre')]: h.nombre,
                [t('export.tipo')]: h.tipo || t('export.na'),
                [t('export.ubicacion')]: h.ubicacion || t('export.na'),
                [t('export.stock_min')]: h.cantidadMinima,
                [t('export.stock_max', 'Stock Máx.')]: h.cantidadMaxima || '',
                [t('export.stock_fisico')]: h.cantidadDisponible
            }));
            generarDescargaExcel(`${nombreArchivo}.xlsx`, datosParaExcel);
        }
    };

    // =======================================================
    // 7. Exportar Historial de Salidas
    // =======================================================
    const exportarHistorialSalidas = (historialFiltrado, filtroTiempo, formato) => {
        if (!historialFiltrado || historialFiltrado.length === 0) {
            throw new Error(t('export.alerta_sin_datos'));
        }

        const hoy = new Date();
        const strLocale = locale.value;
        
        const esHoyOTodos = ['Hoy', 'Todos', t('filtros.hoy'), t('filtros.todos')].includes(filtroTiempo);
        const esEsteMes = ['Este Mes', t('filtros.este_mes')].includes(filtroTiempo);
        const esEsteAno = ['Este Año', t('filtros.este_anio')].includes(filtroTiempo);

        const sufijoFecha = esHoyOTodos ? `${hoy.getDate().toString().padStart(2, '0')}_${hoy.toLocaleString(strLocale, { month: 'short' }).replace('.', '')}_${hoy.getFullYear()}` : 
                            esEsteMes ? `${hoy.toLocaleString(strLocale, { month: 'long' })}_${hoy.getFullYear()}` : 
                            esEsteAno ? `${hoy.getFullYear()}` : `${t('export.semana')}_${hoy.getDate()}`; 
                            
        const nombreArchivo = `${t('export.reporte_historial')}_${sufijoFecha}`; 

        const formatFecha = (fechaString) => {
            if (!fechaString) return t('export.pendiente');
            return new Date(fechaString).toLocaleDateString(strLocale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        };

        const traducirEstado = (estado) => {
            if (estado === 'PENDIENTE') return t('export.estado_pendiente');
            if (estado === 'DEVUELTO') return t('export.estado_devuelto');
            return estado;
        };

        if (formato === 'csv') {
            const cabeceras = [
                t('export.folio'), t('export.autorizo'), t('export.solicito'), 
                t('export.numero_orden'), t('export.numero_maquina'),
                t('export.fecha_salida'), t('export.fecha_devolucion'), 
                t('export.resumen_herr'), t('export.observaciones'), t('export.estado')
            ];

            const filas = historialFiltrado.map(salida => {
                const folio = `#${salida.id}`;
                const autorizo = salida.prestadorNombre || t('export.na');
                const solicito = `${salida.trabajadorNumero} - ${salida.trabajadorNombre}`;
                const numeroOrden = salida.numeroOrden || t('export.na');    
                const numeroMaquina = salida.numeroMaquina || t('export.na');
                const herramientas = salida.herramientas.map(h => `${h.cantidadPrestada}x ${h.nombre}` + (h.cantidadRegresada > 0 ? ` (${t('export.regreso')} ${h.cantidadRegresada})` : '')).join(' | ');

                const observaciones = salida.herramientas.map(h => {
                    if (h.historialDevoluciones?.length > 0) {
                        const validas = h.historialDevoluciones.filter(d => d.cantidad > 0);
                        if (validas.length > 0) return `[${h.nombre}]: ` + validas.map(dev => `${dev.cantidad}x ${t('export.recibidas_por')} ${dev.receptorNombre} (${formatFecha(dev.fecha)})`).join('; ');
                    }
                    return null;
                }).filter(Boolean).join(' || ') || t('export.sin_recepciones');

                return [
                    `"${folio}"`, `"${autorizo}"`, `"${solicito}"`, 
                    `"${numeroOrden}"`, `"${numeroMaquina}"`, 
                    `"${formatFecha(salida.fechaSalida)}"`, 
                    `"${formatFecha(salida.fechaDevolucion)}"`, `"${herramientas}"`, 
                    `"${observaciones}"`, `"${traducirEstado(salida.estado)}"`
                ].join(',');
            });

            generarDescarga(`${nombreArchivo}.csv`, cabeceras, filas);
        } 
        else if (formato === 'xlsx') {
            const datosParaExcel = historialFiltrado.map(salida => {
                const herramientas = salida.herramientas.map(h => `${h.cantidadPrestada}x ${h.nombre}` + (h.cantidadRegresada > 0 ? ` (${t('export.regreso')} ${h.cantidadRegresada})` : '')).join(' | ');
                
                const observaciones = salida.herramientas.map(h => {
                    if (h.historialDevoluciones?.length > 0) {
                        const validas = h.historialDevoluciones.filter(d => d.cantidad > 0);
                        if (validas.length > 0) return `[${h.nombre}]: ` + validas.map(dev => `${dev.cantidad}x ${t('export.recibidas_por')} ${dev.receptorNombre} (${formatFecha(dev.fecha)})`).join('; ');
                    }
                    return null;
                }).filter(Boolean).join(' || ') || t('export.sin_recepciones');

                return {
                    [t('export.folio')]: `#${salida.id}`,
                    [t('export.autorizo')]: salida.prestadorNombre || t('export.na'),
                    [t('export.solicito')]: `${salida.trabajadorNumero} - ${salida.trabajadorNombre}`,
                    [t('export.numero_orden')]: salida.numeroOrden || t('export.na'),    
                    [t('export.numero_maquina')]: salida.numeroMaquina || t('export.na'),
                    [t('export.fecha_salida')]: formatFecha(salida.fechaSalida),        
                    [t('export.fecha_devolucion')]: formatFecha(salida.fechaDevolucion),
                    [t('export.resumen_herr')]: herramientas,
                    [t('export.observaciones')]: observaciones,
                    [t('export.estado')]: traducirEstado(salida.estado) 
                };
            });

            generarDescargaExcel(`${nombreArchivo}.xlsx`, datosParaExcel);
        }
    };

    return {
        generarDescarga,
        generarDescargaExcel,
        descargarPlantillaHerramientas,
        extraerDatosDeArchivo,
        exportarBitacora,
        exportarInventario,
        exportarHistorialSalidas 
    };
}