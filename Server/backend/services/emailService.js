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

export const enviarNotificacionPendientes = async (destinatario, excelBuffer) => {
    
    // Generamos una fecha corta (YYYY-MM-DD) para nombrar el archivo dinámicamente
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Devoluciones_Pendientes_${fecha}.xlsx`;

    // Simplificamos el HTML para que invite a abrir el adjunto
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 20px;">
            <h2 style="color: #e11d48; border-bottom: 2px solid #e11d48; padding-bottom: 10px;">
                ⚠️ Reporte de Devoluciones Pendientes
            </h2>
            <p style="font-size: 16px;">Hola, Encargado de Almacén:</p>
            <p style="font-size: 16px;">Se ha generado el reporte actualizado de herramientas que aún no han sido devueltas.</p>
            <p style="font-size: 16px;">Por favor, revisa el archivo de <strong>Excel adjunto</strong> para consultar todos los detalles (Folios, Trabajadores, Máquinas y Horarios).</p>
            <br/>
            <p style="font-size: 12px; color: #777; border-top: 1px solid #eaeaea; padding-top: 10px;">
                Este es un mensaje automático generado por el Sistema de Almacén.
            </p>
        </div>
    `;

    await transporter.sendMail({
        from: `"Sistema de Almacén" <${process.env.SMTP_USER}>`,
        to: destinatario,
        subject: '⚠️ Alerta: Herramientas con Devolución Pendiente',
        html: htmlContent,
        attachments: [
            {
                filename: nombreArchivo,
                content: excelBuffer 
            }
        ]
    });
};