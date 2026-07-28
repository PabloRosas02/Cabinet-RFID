export const comprimirImagenWebP = (archivo) => {
    return new Promise((resolve, reject) => {
        if (!archivo) return reject('No hay archivo');
        
        if (!archivo.type.startsWith('image/')) {
            return reject('Por favor, selecciona un archivo de imagen válido.');
        }

        const tamañoMaximoMB = 10;
        if (archivo.size > tamañoMaximoMB * 1024 * 1024) {
            return reject(`La imagen pesa demasiado. El límite máximo es de ${tamañoMaximoMB} MB.`);
        }

        const lector = new FileReader();
        lector.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const MAX_WIDTH = 800;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // Devuelve el string Base64 listo para usarse
                resolve(canvas.toDataURL('image/webp', 0.8));
            };
            img.src = e.target.result;
        };
        lector.readAsDataURL(archivo);
    });
};