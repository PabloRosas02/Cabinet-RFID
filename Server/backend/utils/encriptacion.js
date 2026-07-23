import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // Nivel de seguridad estándar

/**
 * Encripta una contraseña en texto plano.
 */
export const encriptarContrasena = async (contrasenaPlana) => {
    return await bcrypt.hash(contrasenaPlana, SALT_ROUNDS);
};

/**
 * Compara una contraseña en texto plano con un hash de la base de datos.
 */
export const verificarContrasena = async (contrasenaPlana, contrasenaHasheada) => {
    return await bcrypt.compare(contrasenaPlana, contrasenaHasheada);
};