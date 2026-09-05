export const formatearFecha = (fechaString, idioma = 'es-MX') => {
    if (!fechaString) return 'Pendiente';

    // 1. Extraer el valor si pasa como Ref de Vue o si viene abreviado ('es' -> 'es-MX')
    const lang = typeof idioma === 'object' && idioma.value ? idioma.value : idioma;
    const localeNormalizado = lang === 'es' ? 'es-MX' : lang;

    const fecha = new Date(fechaString);
    
    // 2. Validar que la fecha sea válida
    if (isNaN(fecha.getTime())) {
        return 'Fecha inválida';
    }

    return fecha.toLocaleDateString(localeNormalizado, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
};