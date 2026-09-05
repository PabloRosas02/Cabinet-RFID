export function traducirDetalleBitacora(detalleOriginal, t) {
    if (!detalleOriginal) return '';

    let texto = detalleOriginal;

    texto = texto
        .replace(/Stock Máximo/g, t('bitacora_detalles.stock_maximo'))
        .replace(/Stock Mínimo/g, t('bitacora_detalles.stock_minimo'))
        .replace(/Stock Físico/g, t('bitacora_detalles.stock_fisico'))
        .replace(/Motivo de baja/g, t('bitacora_detalles.motivo_baja'))
        .replace(/Desechable: No/g, `${t('bitacora_detalles.desechable')}: ${t('bitacora_detalles.desechable_no')}`)
        .replace(/Desechable: Sí/g, `${t('bitacora_detalles.desechable')}: ${t('bitacora_detalles.desechable_si')}`)
        .replace(/Registro inicial de la herramienta/g, t('bitacora_detalles.registro_inicial'))
        .replace(/Registro mediante Importación Masiva/g, t('bitacora_detalles.importacion_masiva'));

    return texto;
}