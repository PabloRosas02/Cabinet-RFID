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

// 1. Función original: Notificación de pendientes
export const enviarNotificacionPendientes = async (destinatario, excelBuffer) => {
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Devoluciones_Pendientes_${fecha}.xlsx`;

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

// 2. Reporte Semanal del Historial
export const enviarReporteSemanal = async (destinatario, excelBuffer) => {
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Historial_Semanal_${fecha}.xlsx`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 20px;">
            <h2 style="color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 10px;">
                📊 Reporte Semanal de Salidas
            </h2>
            <p style="font-size: 16px;">Hola, Encargado de Almacén:</p>
            <p style="font-size: 16px;">Adjunto encontrarás el historial de todas las salidas y devoluciones de herramientas registradas durante los últimos 7 días.</p>
            <p style="font-size: 16px;">Por favor, revisa el archivo de <strong>Excel adjunto</strong> para consultar el resumen completo de herramientas prestadas, folios y tiempos de uso.</p>
            <br/>
            <p style="font-size: 12px; color: #777; border-top: 1px solid #eaeaea; padding-top: 10px;">
                Este es un mensaje automático generado por el Sistema de Almacén.
            </p>
        </div>
    `;

    await transporter.sendMail({
        from: `"Sistema de Almacén" <${process.env.SMTP_USER}>`,
        to: destinatario,
        subject: '📊 Resumen Semanal: Historial de Herramientas',
        html: htmlContent,
        attachments: [
            {
                filename: nombreArchivo,
                content: excelBuffer 
            }
        ]
    });
};

// 3. Alerta de Stock Mínimo
export const enviarAlertaStockMinimo = async (destinatario, excelBuffer) => {
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Alertas_Stock_Minimo_${fecha}.xlsx`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 20px;">
            <h2 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">
                ⚠️ Alerta: Herramientas en Stock Mínimo
            </h2>
            <p style="font-size: 16px;">Hola, Encargado de Almacén:</p>
            <p style="font-size: 16px;">Se ha detectado que una o más herramientas han alcanzado o descendido por debajo de su nivel de <strong>stock mínimo</strong>.</p>
            <p style="font-size: 16px;">Por favor, revisa el archivo de <strong>Excel adjunto</strong> para consultar el listado completo y gestionar el reabastecimiento necesario.</p>
            <br/>
            <p style="font-size: 12px; color: #777; border-top: 1px solid #eaeaea; padding-top: 10px;">
                Este es un mensaje automático generado por el Sistema de Almacén.
            </p>
        </div>
    `;

    await transporter.sendMail({
        from: `"Sistema de Almacén" <${process.env.SMTP_USER}>`,
        to: destinatario,
        subject: '⚠️ Alerta de Inventario: Herramientas en Stock Mínimo',
        html: htmlContent,
        attachments: [
            {
                filename: nombreArchivo,
                content: excelBuffer 
            }
        ]
    });
};