import ExcelJS from 'exceljs';

export const generarExcelEnMemoria = async (datosJson) => {
    const workbook = new ExcelJS.Workbook();
    // Le ponemos 'Hoja1' para que sea idéntico al del frontend
    const worksheet = workbook.addWorksheet('Hoja1'); 

    if (datosJson && datosJson.length > 0) {
        // 1. Extraemos las cabeceras directamente de las llaves del JSON
        const cabeceras = Object.keys(datosJson[0]);
        worksheet.addRow(cabeceras);
        
        // 2. Ponemos la primera fila en negrita (igual que en tu frontend)
        worksheet.getRow(1).font = { bold: true };
        
        // 3. Agregamos las filas mapeando las cabeceras
        datosJson.forEach(obj => {
            const fila = cabeceras.map(cabecera => obj[cabecera]);
            worksheet.addRow(fila);
        });
    }

    // Retornamos el buffer en crudo
    return await workbook.xlsx.writeBuffer();
};