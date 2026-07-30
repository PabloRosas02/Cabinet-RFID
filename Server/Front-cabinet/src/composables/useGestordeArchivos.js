import ExcelJS from 'exceljs';

export function useGestorArchivos() {
    
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

    // =======================================================
    // 4. Leer Archivo (CSV o Excel) y extraer datos limpios
    // =======================================================
    const extraerDatosDeArchivo = async (archivo) => {
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

        return herramientas;
    };
   // =======================================================
    // 5. Exportar Bitácora de Auditoría
    // =======================================================
    const exportarBitacora = (bitacoraDatos, filtroTiempo, formato) => {
        if (!bitacoraDatos || bitacoraDatos.length === 0) {
            alert("No hay registros para exportar con los filtros actuales.");
            return;
        }
        
        // Generación dinámica del nombre del archivo basada en el filtro de tiempo
        const hoy = new Date();
        const sufijoFecha = filtroTiempo === 'Hoy' || filtroTiempo === 'Todos' ? `${hoy.getDate().toString().padStart(2, '0')}_${hoy.toLocaleString('es-MX', { month: 'short' }).replace('.', '')}_${hoy.getFullYear()}` : 
                            filtroTiempo === 'Este Mes' ? `${hoy.toLocaleString('es-MX', { month: 'long' })}_${hoy.getFullYear()}` : 
                            filtroTiempo === 'Este Año' ? `${hoy.getFullYear()}` : `Semana_${hoy.getDate()}`; 
        
        const nombreArchivo = `Reporte_Bitacora_${sufijoFecha}`;
        
        // Función interna para formatear la fecha solo para el reporte
        const formatearFechaReporte = (fechaString) => {
            return new Date(fechaString).toLocaleDateString('es-MX', { 
                year: 'numeric', month: 'short', day: 'numeric', 
                hour: '2-digit', minute: '2-digit' 
            });
        };

        if (formato === 'csv') {
            const cabeceras = ['Fecha', 'Acción', 'Código Herramienta', 'Nombre Herramienta', 'Usuario', 'Rol'];
            const filas = bitacoraDatos.map(b => 
                `"${formatearFechaReporte(b.fecha)}","${b.accion}","${b.herramienta?.codigo || 'N/A'}","${b.herramienta?.nombre || 'N/A'}","${b.usuario?.nombre || 'N/A'}","${b.usuario?.rol || 'N/A'}"`
            );
            generarDescarga(`${nombreArchivo}.csv`, cabeceras, filas);
        } else {
            const datosExcel = bitacoraDatos.map(b => ({
                'Fecha': formatearFechaReporte(b.fecha),
                'Acción': b.accion,
                'Código Herramienta': b.herramienta?.codigo || 'N/A',
                'Nombre Herramienta': b.herramienta?.nombre || 'Desconocida',
                'Usuario (Autor)': b.usuario?.nombre || 'N/A',
                'Rol': b.usuario?.rol || 'N/A'
            }));
            generarDescargaExcel(`${nombreArchivo}.xlsx`, datosExcel);
        }
    };
    // =======================================================
    // 6. Exportar Inventario Actual
    // =======================================================
    const exportarInventario = (herramientasVisibles, formato) => {
        if (!herramientasVisibles || herramientasVisibles.length === 0) {
            alert("No hay datos para exportar con los filtros actuales.");
            return;
        }

        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = `Reporte_Inventario_${fecha}`;

        if (formato === 'csv') {
            const cabeceras = ['Código', 'Nombre', 'Tipo', 'Ubicación', 'Stock Mín.', 'Stock Físico'];
            const filas = herramientasVisibles.map(h => {
                return `"${h.codigo}","${h.nombre}","${h.tipo || ''}","${h.ubicacion || ''}","${h.cantidadMinima}","${h.cantidadDisponible}"`;
            });
            generarDescarga(`${nombreArchivo}.csv`, cabeceras, filas);
        } 
        else if (formato === 'xlsx') {
            const datosParaExcel = herramientasVisibles.map(h => ({
                'Código': h.codigo,
                'Nombre': h.nombre,
                'Tipo': h.tipo || 'N/A',
                'Ubicación': h.ubicacion || 'N/A',
                'Stock Mínimo': h.cantidadMinima,
                'Stock Físico': h.cantidadDisponible
            }));
            generarDescargaExcel(`${nombreArchivo}.xlsx`, datosParaExcel);
        }
    };
    // =======================================================
    // 7. Exportar Historial de Pedidos
    // =======================================================
    const exportarHistorialPedidos = (historialFiltrado, filtroTiempo, formato) => {
        if (!historialFiltrado || historialFiltrado.length === 0) {
            throw new Error('No hay registros para exportar con los filtros actuales.');
        }

        const hoy = new Date();
        const sufijoFecha = filtroTiempo === 'Hoy' || filtroTiempo === 'Todos' ? `${hoy.getDate().toString().padStart(2, '0')}_${hoy.toLocaleString('es-MX', { month: 'short' }).replace('.', '')}_${hoy.getFullYear()}` : 
                            filtroTiempo === 'Este Mes' ? `${hoy.toLocaleString('es-MX', { month: 'long' })}_${hoy.getFullYear()}` : 
                            filtroTiempo === 'Este Año' ? `${hoy.getFullYear()}` : `Semana_${hoy.getDate()}`; 
        const nombreArchivo = `Reporte_Historial_${sufijoFecha}`; 

        // Formateador interno rápido
        const formatFecha = (fechaString) => {
            if (!fechaString) return 'Pendiente';
            return new Date(fechaString).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        };

        if (formato === 'csv') {
            const cabeceras = ['Folio', 'Autorizó (Prestador)', 'Solicitó (Empleado)', 'Fecha Préstamo', 'Fecha Devolución General', 'Resumen de Herramientas', 'Observaciones (Rastreo Parcial)', 'Estado'];

            const filas = historialFiltrado.map(pedido => {
                const folio = `#${pedido.id}`;
                const autorizo = pedido.prestadorNombre || 'N/A';
                const solicito = `${pedido.trabajadorNumero} - ${pedido.trabajadorNombre}`;
                const herramientas = pedido.herramientas.map(h => `${h.cantidadPrestada}x ${h.nombre}` + (h.cantidadRegresada > 0 ? ` (Regresó: ${h.cantidadRegresada})` : '')).join(' | ');

                const observaciones = pedido.herramientas.map(h => {
                    if (h.historialDevoluciones?.length > 0) {
                        const validas = h.historialDevoluciones.filter(d => d.cantidad > 0);
                        if (validas.length > 0) return `[${h.nombre}]: ` + validas.map(dev => `${dev.cantidad}x recibidas por ${dev.receptorNombre} (${formatFecha(dev.fecha)})`).join('; ');
                    }
                    return null;
                }).filter(Boolean).join(' || ') || 'Sin recepciones registradas';

                return [`"${folio}"`, `"${autorizo}"`, `"${solicito}"`, `"${formatFecha(pedido.fechaPedido)}"`, `"${formatFecha(pedido.fechaDevolucion)}"`, `"${herramientas}"`, `"${observaciones}"`, `"${pedido.estado}"`].join(',');
            });

            generarDescarga(`${nombreArchivo}.csv`, cabeceras, filas);
        } 
        else if (formato === 'xlsx') {
            const datosParaExcel = historialFiltrado.map(pedido => {
                const herramientas = pedido.herramientas.map(h => `${h.cantidadPrestada}x ${h.nombre}` + (h.cantidadRegresada > 0 ? ` (Regresó: ${h.cantidadRegresada})` : '')).join(' | ');
                
                const observaciones = pedido.herramientas.map(h => {
                    if (h.historialDevoluciones?.length > 0) {
                        const validas = h.historialDevoluciones.filter(d => d.cantidad > 0);
                        if (validas.length > 0) return `[${h.nombre}]: ` + validas.map(dev => `${dev.cantidad}x recibidas por ${dev.receptorNombre} (${formatFecha(dev.fecha)})`).join('; ');
                    }
                    return null;
                }).filter(Boolean).join(' || ') || 'Sin recepciones registradas';

                return {
                    'Folio': `#${pedido.id}`,
                    'Autorizó (Prestador)': pedido.prestadorNombre || 'N/A',
                    'Solicitó (Empleado)': `${pedido.trabajadorNumero} - ${pedido.trabajadorNombre}`,
                    'Fecha Préstamo': formatFecha(pedido.fechaPedido),
                    'Fecha Devolución General': formatFecha(pedido.fechaDevolucion),
                    'Resumen de Herramientas': herramientas,
                    'Observaciones (Rastreo Parcial)': observaciones,
                    'Estado': pedido.estado
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
        exportarHistorialPedidos 
    };

}