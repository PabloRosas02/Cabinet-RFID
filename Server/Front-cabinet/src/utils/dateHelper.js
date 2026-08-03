export const formatearFecha = (fechaString, idioma = 'es-MX') => {
    if (!fechaString) return 'Pendiente';
    
    return new Date(fechaString).toLocaleDateString(idioma, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
};