import ExcelJS from 'exceljs';

export function useExportarCSV() {
    
    // =======================================================
    // Descargar CSV
    // =======================================================
    const generarDescarga = (nombreArchivo, cabeceras, filas) => {
        // Unimos las cabeceras y las filas con saltos de línea
        const contenidoCSV = cabeceras.join(',') + '\n' + filas.join('\n');
        
        // Agregamos "\uFEFF" para que Excel reconozca los acentos (UTF-8)
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
    // Descargar Excel
    // =======================================================
    const generarDescargaExcel = async (nombreArchivo, datosJson) => {
        // Creamos un nuevo libro de Excel y una hoja de trabajo
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Hoja1');
        
        if (datosJson && datosJson.length > 0) {
            // Extraer las cabeceras a partir de las llaves (propiedades) del primer objeto
            const cabeceras = Object.keys(datosJson[0]);
            
            // Añadimos la primera fila con los títulos
            worksheet.addRow(cabeceras);
            
            // Ponemos los títulos en negrita para que se vea profesional
            worksheet.getRow(1).font = { bold: true };
            
            // Agregar las filas recorriendo cada objeto de nuestros datos
            datosJson.forEach(obj => {
                const fila = cabeceras.map(cabecera => obj[cabecera]);
                worksheet.addRow(fila);
            });
        }
        
        // Escribimos el archivo en memoria (buffer)
        const buffer = await workbook.xlsx.writeBuffer();
        
        // Creamos el archivo final con el formato oficial de Microsoft Excel
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Lo descargamos
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', nombreArchivo);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return {
        generarDescarga,
        generarDescargaExcel 
    };
}