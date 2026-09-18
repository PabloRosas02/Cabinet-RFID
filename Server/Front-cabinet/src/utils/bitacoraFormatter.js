export function traducirDetalleBitacora(detalleOriginal, t) {
    if (!detalleOriginal || typeof detalleOriginal !== 'string') return '';
    if (!t) return detalleOriginal;

    let texto = detalleOriginal.trim();
    const textoUpper = texto.toUpperCase();

    // Helper interno para verificar existencia antes de solicitar traducción
    const obtenerTraduccion = (key, fallback) => {
        return (t.te && t.te(key)) ? t(key) : fallback;
    };

    // 1. Traducción directa si es un token/palabra individual
    const diccionarioTokens = {
        'DESECHABLE': obtenerTraduccion('bitacora_detalles.desechable', 'Consumable'),
        'CONSUMABLE': obtenerTraduccion('bitacora_detalles.desechable', 'Consumable'),
        'SI': obtenerTraduccion('bitacora_detalles.desechable_si', 'Yes'),
        'SÍ': obtenerTraduccion('bitacora_detalles.desechable_si', 'Yes'),
        'YES': obtenerTraduccion('bitacora_detalles.desechable_si', 'Yes'),
        'NO': obtenerTraduccion('bitacora_detalles.desechable_no', 'No'),
        'TRUE': obtenerTraduccion('bitacora_detalles.desechable_si', 'Yes'),
        'FALSE': obtenerTraduccion('bitacora_detalles.desechable_no', 'No'),
        'STOCK MÁXIMO': obtenerTraduccion('bitacora_detalles.stock_maximo', 'Maximum Stock'),
        'STOCK MÍNIMO': obtenerTraduccion('bitacora_detalles.stock_minimo', 'Minimum Stock'),
        'STOCK FÍSICO': obtenerTraduccion('bitacora_detalles.stock_fisico', 'Physical Stock'),
        'MOTIVO DE BAJA': obtenerTraduccion('bitacora_detalles.motivo_baja', 'Disposal Reason'),
        'NOMBRE': obtenerTraduccion('bitacora_detalles.nombre', 'Name'),
        'CÓDIGO': obtenerTraduccion('bitacora_detalles.codigo', 'Code'),
        'CODIGO': obtenerTraduccion('bitacora_detalles.codigo', 'Code'),
        'UBICACIÓN': obtenerTraduccion('bitacora_detalles.ubicacion', 'Location'),
        'UBICACION': obtenerTraduccion('bitacora_detalles.ubicacion', 'Location'),
        'MARCA': obtenerTraduccion('bitacora_detalles.marca', 'Brand')
    };

    if (diccionarioTokens[textoUpper]) {
        return diccionarioTokens[textoUpper];
    }

    // 2. Si el texto incluye una transición '➔', traducimos cada fragmento por separado
    if (texto.includes('➔')) {
        const partes = texto.split('➔');
        const antes = traducirDetalleBitacora(partes[0], t);
        const despues = traducirDetalleBitacora(partes[1], t);
        return `${antes} ➔ ${despues}`;
    }

    // 3. Reemplazos dinámicos en frases o bloques completos de texto
    texto = texto
        .replace(/Stock Máximo/gi, obtenerTraduccion('bitacora_detalles.stock_maximo', 'Maximum Stock'))
        .replace(/Stock Mínimo/gi, obtenerTraduccion('bitacora_detalles.stock_minimo', 'Minimum Stock'))
        .replace(/Stock Físico/gi, obtenerTraduccion('bitacora_detalles.stock_fisico', 'Physical Stock'))
        .replace(/Motivo de baja/gi, obtenerTraduccion('bitacora_detalles.motivo_baja', 'Disposal Reason'))
        .replace(/(Desechable|Consumable):\s*No/gi, `${obtenerTraduccion('bitacora_detalles.desechable', 'Consumable')}: ${obtenerTraduccion('bitacora_detalles.desechable_no', 'No')}`)
        .replace(/(Desechable|Consumable):\s*(Sí|Si|Yes)/gi, `${obtenerTraduccion('bitacora_detalles.desechable', 'Consumable')}: ${obtenerTraduccion('bitacora_detalles.desechable_si', 'Yes')}`)
        .replace(/Registro inicial de la herramienta/gi, obtenerTraduccion('bitacora_detalles.registro_inicial', 'Initial tool registration'))
        .replace(/Registro mediante Importación Masiva/gi, obtenerTraduccion('bitacora_detalles.importacion_masiva', 'Bulk import registration'));

    return texto;
}