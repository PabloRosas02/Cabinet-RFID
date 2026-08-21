import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

export const enviarNotificacionPendientes = async (destinatario, listaHerramientas) => {
    const filasTabla = listaHerramientas.map(h => `
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${h.folio}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${h.trabajadorNombre}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${h.herramientaNombre}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${h.numeroOrden || 'N/A'}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${h.numeroMaquina || 'N/A'}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${h.fechaSalida}</td>
        </tr>
    `).join('');

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #e11d48;">⚠️ Reporte de Devoluciones Pendientes</h2>
            <p>Hola, Encargado de Almacén:</p>
            <p>Se detectaron las siguientes herramientas pendientes de devolución:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background-color: #f8fafc; text-align: left;">
                        <th style="padding: 8px; border: 1px solid #ddd;">Folio</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Trabajador</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Herramienta</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Orden</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Máquina</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Fecha Salida</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasTabla}
                </tbody>
            </table>
        </div>
    `;

    await transporter.sendMail({
        from: `"Sistema de Almacén" <${process.env.SMTP_USER}>`,
        to: destinatario,
        subject: '⚠️ Alerta: Herramientas con Devolución Pendiente',
        html: htmlContent
    });
};