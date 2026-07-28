export const formatearFecha = (fechaString) => {
    if (!fechaString) return 'Pendiente';
    
    return new Date(fechaString).toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
};