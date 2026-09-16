import ExcelJS from 'exceljs';

// Función para traducir los motivos de salida según el idioma seleccionado
export const formatearMotivo = (motivo, motivoOtro, lang = 'es') => {
    if (!motivo) return 'N/A';
    
    const esIngles = lang === 'en';

    // Normalizamos el motivo quitando acentos y convirtiendo a minúsculas
    const motivoNormalizado = motivo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const mapaMotivos = {
        'operator_damage': esIngles ? 'Operator Damage' : 'Daño por Operador',
        'dano por operador': esIngles ? 'Operator Damage' : 'Daño por Operador',
        
        'end_of_life': esIngles ? 'End of Life' : 'Fin de Vida Útil',
        'fin de vida util': esIngles ? 'End of Life' : 'Fin de Vida Útil',
        
        'set_up': esIngles ? 'Adjustment / Set Up' : 'Ajuste / Set Up',
        'ajuste / set up': esIngles ? 'Adjustment / Set Up' : 'Ajuste / Set Up',
        'set up': esIngles ? 'Adjustment / Set Up' : 'Ajuste / Set Up',
        
        'extravio': esIngles ? 'Loss / Missing' : 'Extravío',
        'mala calidad de la herramienta': esIngles ? 'Poor Tool Quality' : 'Mala Calidad de la Herramienta',
        'no especificado': esIngles ? 'Not Specified' : 'NO ESPECIFICADO',
        
        'other': motivoOtro ? `${esIngles ? 'Other' : 'Otro'}: ${motivoOtro}` : (esIngles ? 'Other' : 'Otro'),
        'otro': motivoOtro ? `${esIngles ? 'Other' : 'Otro'}: ${motivoOtro}` : (esIngles ? 'Otro' : 'Otro')
    };

    if (mapaMotivos[motivoNormalizado]) {
        return mapaMotivos[motivoNormalizado];
    }

    return motivo
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const generarExcelEnMemoria = async (datosJson) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Hoja1'); 

    if (datosJson && datosJson.length > 0) {
        // Tomamos las cabeceras directamente tal como vienen traducidas desde el servicio
        const cabeceras = Object.keys(datosJson[0]);
        worksheet.addRow(cabeceras);
        
        worksheet.getRow(1).font = { bold: true };
        
        datosJson.forEach(obj => {
            const fila = cabeceras.map(cabecera => obj[cabecera]);
            worksheet.addRow(fila);
        });
    }

    return await workbook.xlsx.writeBuffer();
};