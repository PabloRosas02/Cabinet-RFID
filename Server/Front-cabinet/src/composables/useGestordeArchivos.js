import { useI18n } from 'vue-i18n';
import { traducirDetalleBitacora } from '../utils/bitacoraFormatter';

export function useGestorArchivos() {
    const { t, locale } = useI18n();
    
    // 1. Helper para manejar la descarga en el navegador y limpiar la memoria
    const triggerDownload = (blob, nombreArchivo) => {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', nombreArchivo);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); 
    };

    // 2. Helper para generar sufijos de fecha consistentes
    const generarSufijoFecha = (filtroTiempo) => {
        const hoy = new Date();
        const strLocale = locale.value;
        
        const esHoyOTodos = ['Hoy', 'Todos', t('filtros.hoy'), t('filtros.todos')].includes(filtroTiempo);
        const esEsteMes = ['Este Mes', t('filtros.este_mes')].includes(filtroTiempo);
        const esEsteAno = ['Este Año', t('filtros.este_anio')].includes(filtroTiempo);

        if (esHoyOTodos) {
            return `${hoy.getDate().toString().padStart(2, '0')}_${hoy.toLocaleString(strLocale, { month: 'short' }).replace('.', '')}_${hoy.getFullYear()}`;
        }
        if (esEsteMes) {
            return `${hoy.toLocaleString(strLocale, { month: 'long' })}_${hoy.getFullYear()}`;
        }
        if (esEsteAno) {
            return `${hoy.getFullYear()}`;
        }
        return `${t('export.semana')}_${hoy.getDate()}`;
    };

    // =======================================================
    // 1. Descargar CSV Genérico
    // =======================================================
    const generarDescarga = (nombreArchivo, cabeceras, filas) => {
        const contenidoCSV = cabeceras.join(',') + '\n' + filas.join('\n');
        const blob = new Blob(["\uFEFF" + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, nombreArchivo);
    };

    // =======================================================
    // 2. Descargar Excel Genérico
    // =======================================================
    const generarDescargaExcel = async (nombreArchivo, datosJson) => {
        const { default: ExcelJS } = await import('exceljs');
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
        triggerDownload(blob, nombreArchivo);
    };

    // =======================================================
    // 3. Generar Plantilla Específica para Herramientas
    // =======================================================
    const descargarPlantillaHerramientas = (formato) => {
        const nombreArchivo = t('export.plantilla_herramientas');
        const labelEsDesechable = t('export.es_desechable');
        const labelCantidadMaxima = t('export.cantidad_maxima');

        if (formato === 'csv') {
            const cabeceras = [
                t('export.codigo'), 
                t('export.nombre'), 
                t('export.marca'), 
                t('export.descripcion'), 
                t('export.cantidad'), 
                t('export.cantidad_minima'), 
                labelCantidadMaxima, 
                labelEsDesechable,
                t('export.tipo'), 
                t('export.ubicacion')
            ];
            const filaEjemplo = [
                '"HERR-EJEMPLO"', 
                `"${t('export.ejemplo_taladro')}"`, 
                '"DeWalt"', 
                `"${t('export.ejemplo_desc')}"`, 
                '"5"', 
                '"1"', 
                '"10"', 
                '"NO"',
                `"${t('export.ejemplo_tipo')}"`, 
                '"Estante A"'
            ];
            generarDescarga(`${nombreArchivo}.csv`, cabeceras, [filaEjemplo.join(',')]);
        } else {
            const datosParaExcel = [{
                [t('export.codigo')]: 'HERR-EJEMPLO',
                [t('export.nombre')]: t('export.ejemplo_taladro'),
                [t('export.marca')]: 'DeWalt',
                [t('export.descripcion')]: t('export.ejemplo_desc'),
                [t('export.cantidad')]: 5,
                [t('export.cantidad_minima')]: 1,
                [labelCantidadMaxima]: 10,
                [labelEsDesechable]: 'NO',
                [t('export.tipo')]: t('export.ejemplo_tipo'),
                [t('export.ubicacion')]: 'Estante A'
            }];
            generarDescargaExcel(`${nombreArchivo}.xlsx`, datosParaExcel);
        }
    };

    // Helper para interpretar booleanos al importar
    const parsearBooleano = (val) => {
        if (typeof val === 'boolean') return val;
        const texto = String(val || '').toLowerCase().trim();
        return ['si', 'sí', 'yes', '1', 'true', 's', 'y'].includes(texto);
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
                    if (cabecera.includes('cantidadminima') || cabecera.includes('minquantity')) {
                        obj.cantidadMinima = parseInt(valor, 10) || 0;
                    }
                    else if (cabecera.includes('cantidadmaxima') || cabecera.includes('maxquantity')) {
                        obj.cantidadMaxima = parseInt(valor, 10) || 0;
                    }
                    else if (cabecera.includes('cantidad') || cabecera.includes('quantity')) {
                        obj.cantidad = parseInt(valor, 10) || 0;
                    }
                    if (cabecera.includes('consumible') || cabecera.includes('desechable') || cabecera.includes('consumable')) {
                        obj.esDesechable = parsearBooleano(valor);
                    }
                    if (cabecera.includes('tipo') || cabecera.includes('type')) obj.tipo = valor;
                    if (cabecera.includes('ubicacion') || cabecera.includes('location')) obj.ubicacion = valor;
                });
                if (obj.codigo && obj.nombre) herramientas.push(obj);
            }
        } 
        else if (archivo.name.toLowerCase().endsWith('.xlsx')) {
            const { default: ExcelJS } = await import('exceljs');
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
                    if (cabecera.includes('consumible') || cabecera.includes('desechable') || cabecera.includes('consumable')) {
                        obj.esDesechable = parsearBooleano(valor);
                    }
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
        
        const sufijoFecha = generarSufijoFecha(filtroTiempo);
        const nombreArchivo = `${t('export.reporte_bitacora')}_${sufijoFecha}`;
        
        const formatearFechaReporte = (fechaString) => {
            return new Date(fechaString).toLocaleDateString(locale.value, { 
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

        // Helper para formatear y traducir el rol dinámicamente como en TablaUsuarios
        const formatearRol = (rol) => {
            if (!rol) return t('export.na');
            const rolNormalizado = String(rol).toUpperCase().replace(/\s+/g, '_');
            return t(`roles.${rolNormalizado}`, rol.replace('_', ' '));
        };

        // Helper para formatear y traducir el detalle de la acción
        const obtenerDetalleFormateado = (detalle) => {
            if (!detalle) return t('export.na');
            return traducirDetalleBitacora(detalle, t).replace(/\n/g, ' | ');
        };

        if (formato === 'csv') {
            const cabeceras = [
                t('export.fecha'), 
                t('export.accion'), 
                t('export.col_codigo_herr'), 
                t('export.col_nombre_herr'), 
                t('export.detalle') || 'Detalle', 
                t('export.usuario'), 
                t('export.rol')
            ];
            const filas = bitacoraDatos.map(b => 
                `"${formatearFechaReporte(b.fecha)}","${traducirAccion(b.accion)}","${b.herramienta?.codigo || t('export.na')}","${b.herramienta?.nombre || t('export.na')}","${obtenerDetalleFormateado(b.detalle)}","${b.usuario?.nombre || t('export.na')}","${formatearRol(b.usuario?.rol)}"`
            );
            generarDescarga(`${nombreArchivo}.csv`, cabeceras, filas);
        } else {
            const datosExcel = bitacoraDatos.map(b => ({
                [t('export.fecha')]: formatearFechaReporte(b.fecha),
                [t('export.accion')]: traducirAccion(b.accion),
                [t('export.col_codigo_herr')]: b.herramienta?.codigo || t('export.na'),
                [t('export.col_nombre_herr')]: b.herramienta?.nombre || t('export.desconocido'),
                [t('export.detalle') || 'Detalle']: obtenerDetalleFormateado(b.detalle), 
                [t('export.usuario_autor')]: b.usuario?.nombre || t('export.na'),
                [t('export.rol')]: formatearRol(b.usuario?.rol)
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
        const labelEsDesechable = t('export.es_desechable');

        // Helper dinámico para traducir SI / NO según el idioma activo
        const obtenerTextoBooleano = (val) => {
            return val ? t('export.si') : t('export.no');
        };

        if (formato === 'csv') {
            const cabeceras = [
                t('export.codigo'), 
                t('export.nombre'), 
                t('export.tipo'), 
                t('export.ubicacion'), 
                t('export.stock_min'), 
                t('export.stock_max'), 
                t('export.stock_fisico'),
                labelEsDesechable
            ];
            const filas = herramientasVisibles.map(h => {
                const esConsumible = obtenerTextoBooleano(h.esDesechable);
                return `"${h.codigo}","${h.nombre}","${h.tipo || ''}","${h.ubicacion || ''}","${h.cantidadMinima}","${h.cantidadMaxima || ''}","${h.cantidadDisponible}","${esConsumible}"`;
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
                [t('export.stock_max')]: h.cantidadMaxima || '',
                [t('export.stock_fisico')]: h.cantidadDisponible,
                [labelEsDesechable]: obtenerTextoBooleano(h.esDesechable)
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

        const sufijoFecha = generarSufijoFecha(filtroTiempo);
        const nombreArchivo = `${t('export.reporte_historial')}_${sufijoFecha}`; 

        const formatFecha = (fechaString) => {
            if (!fechaString || fechaString === 'Pending' || fechaString === 'Pendiente') {
                return t('export.pendiente');
            }
            const strLocale = locale.value === 'es' ? 'es-ES' : 'en-US';
            return new Date(fechaString).toLocaleDateString(strLocale, { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        };

        const traducirEstado = (estado) => {
            if (!estado) return '';
            const estadoUpper = estado.toUpperCase();
            if (estadoUpper === 'PENDING' || estadoUpper === 'PENDIENTE') return t('export.estado_pendiente');
            if (estadoUpper === 'RETURNED' || estadoUpper === 'DEVUELTO') return t('export.estado_devuelto');
            if (estadoUpper === 'CONSUMED' || estadoUpper === 'CONSUMIDO') return t('export.estado_consumido');
            return estado;
        };

        const traducirRazon = (salida) => {
            // 1. Obtener la clave o código principal del motivo (ej. 'other', 'operator_damage')
            const codigoMotivo = salida.motivo || salida.razon || salida.reasonForIssue;
            if (!codigoMotivo) return t('export.na');

            // 2. Normalizar clave e idioma para i18n
            const keyNormalizada = String(codigoMotivo).toLowerCase().trim();
            const textoBase = t(`export.motivos.${keyNormalizada}`, codigoMotivo);

            // 3. Capturar el texto de 'motivoOtro' guardado en la BD
            const detalle = salida.motivoOtro || salida.razonDetalle || salida.otroMotivo || salida.especificarMotivo;

            // Si existe una razón escrita en motivoOtro, concatenarla al texto traducido
            if (detalle && String(detalle).trim() !== '') {
                return `${textoBase}: ${detalle.trim()}`;
            }

            return textoBase;
        };

        const construirResumenHerramientas = (herramientas) => {
            if (!herramientas || !Array.isArray(herramientas)) return '';
            return herramientas.map(h => {
                const cant = h.cantidadPrestada || h.cantidadSolicitada || 0;
                const reg = h.cantidadRegresada || h.cantidadDevuelta || 0;
                
                if (h.esDesechable) {
                    return `${cant}x ${h.nombre}`;
                }
                return reg > 0 
                    ? `${cant}x ${h.nombre} (${t('export.regreso')} ${reg})` 
                    : `${cant}x ${h.nombre}`;
            }).join(' | ');
        };

        const construirNotasTracking = (herramientas) => {
            if (!herramientas || !Array.isArray(herramientas)) return t('export.sin_recepciones');
            
            const seguimiento = herramientas.map(h => {
                const recepciones = h.historialDevoluciones || h.historialRecepciones;
                if (recepciones && recepciones.length > 0) {
                    const validas = recepciones.filter(d => d.cantidad > 0);
                    if (validas.length > 0) {
                        return `[${h.nombre}]: ` + validas.map(dev => {
                            const usuarioRecibio = dev.receptorNombre || dev.recibidoPor || t('export.na');
                            return `${dev.cantidad}x ${t('export.recibidas_por')} ${usuarioRecibio} (${formatFecha(dev.fecha)})`;
                        }).join('; ');
                    }
                }
                return null;
            }).filter(Boolean);

            return seguimiento.length > 0 ? seguimiento.join(' || ') : t('export.sin_recepciones');
        };

        if (formato === 'csv') {
            const cabeceras = [
                t('export.folio'), 
                t('export.autorizo'), 
                t('export.solicito'), 
                t('export.razon'),
                t('export.numero_orden'), 
                t('export.numero_maquina'),
                t('export.fecha_salida'), 
                t('export.fecha_devolucion'), 
                t('export.resumen_herr'), 
                t('export.observaciones'), 
                t('export.estado')
            ];

            const filas = historialFiltrado.map(salida => {
                const folio = salida.folio || `#${salida.id}`;
                
                const autorizo = salida.prestadorNumero 
                    ? `${salida.prestadorNumero} - ${salida.prestadorNombre}` 
                    : (salida.prestadorNombre || salida.autorizadoPor || t('export.na'));
                    
                const solicito = salida.trabajadorNumero 
                    ? `${salida.trabajadorNumero} - ${salida.trabajadorNombre}` 
                    : (salida.solicitadoPor || t('export.na'));
                    
                // Uso de la nueva función traducirRazon
                const razon = traducirRazon(salida);
                const numeroOrden = salida.numeroOrden || salida.orden || t('export.na');    
                const numeroMaquina = salida.numeroMaquina || salida.maquina || t('export.na');
                const fechaSalida = formatFecha(salida.fechaSalida || salida.fechaPrestamo);
                const fechaDevolucion = salida.esDesechable 
                    ? t('export.na') 
                    : formatFecha(salida.fechaDevolucion);
                
                const herramientas = construirResumenHerramientas(salida.herramientas);
                const observaciones = construirNotasTracking(salida.herramientas);
                const estadoStr = traducirEstado(salida.estado || salida.estatus);

                return [
                    `"${folio}"`, 
                    `"${autorizo}"`, 
                    `"${solicito}"`, 
                    `"${razon}"`,
                    `"${numeroOrden}"`, 
                    `"${numeroMaquina}"`, 
                    `"${fechaSalida}"`, 
                    `"${fechaDevolucion}"`, 
                    `"${herramientas}"`, 
                    `"${observaciones}"`, 
                    `"${estadoStr}"`
                ].join(',');
            });

            generarDescarga(`${nombreArchivo}.csv`, cabeceras, filas);
        } 
        else if (formato === 'xlsx') {
            const datosParaExcel = historialFiltrado.map(salida => {
                const folio = salida.folio || `#${salida.id}`;
                
                const autorizo = salida.prestadorNumero 
                    ? `${salida.prestadorNumero} - ${salida.prestadorNombre}` 
                    : (salida.prestadorNombre || salida.autorizadoPor || t('export.na'));
                    
                const solicito = salida.trabajadorNumero 
                    ? `${salida.trabajadorNumero} - ${salida.trabajadorNombre}` 
                    : (salida.solicitadoPor || t('export.na'));
                    
                // Uso de la nueva función traducirRazon
                const razon = traducirRazon(salida);
                const numeroOrden = salida.numeroOrden || salida.orden || t('export.na');    
                const numeroMaquina = salida.numeroMaquina || salida.maquina || t('export.na');
                const fechaSalida = formatFecha(salida.fechaSalida || salida.fechaPrestamo);
                const fechaDevolucion = salida.esDesechable 
                    ? t('export.na') 
                    : formatFecha(salida.fechaDevolucion);

                return {
                    [t('export.folio')]: folio,
                    [t('export.autorizo')]: autorizo,
                    [t('export.solicito')]: solicito,
                    [t('export.razon')]: razon,
                    [t('export.numero_orden')]: numeroOrden,    
                    [t('export.numero_maquina')]: numeroMaquina,
                    [t('export.fecha_salida')]: fechaSalida,        
                    [t('export.fecha_devolucion')]: fechaDevolucion,
                    [t('export.resumen_herr')]: construirResumenHerramientas(salida.herramientas),
                    [t('export.observaciones')]: construirNotasTracking(salida.herramientas),
                    [t('export.estado')]: traducirEstado(salida.estado || salida.estatus) 
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