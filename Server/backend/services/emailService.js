import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // Must be false for port 587 (uses STARTTLS)
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    // Añade esto para evitar cierres de conexión abruptos en Vercel Serverless
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000
});

// 1. Notificación de pendientes
export const enviarNotificacionPendientes = async (destinatario = process.env.ADMIN_EMAIL, excelBuffer) => {
    const fecha = new Intl.DateTimeFormat('es-MX', {
        timeZone: 'America/Tijuana',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date()).split('/').reverse().join('-'); 
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
export const enviarReporteSemanal = async (destinatario = process.env.ADMIN_EMAIL, excelBuffer) => {
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

// 3. Alerta de Stock Mínimo (Reporte en Excel)
export const enviarAlertaStockMinimo = async (destinatario = process.env.ADMIN_EMAIL, excelBuffer) => {
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

// 4. Código de Autorización para Herramienta Dañada
export const enviarCodigoAutorizacionDano = async (destinatario = process.env.ADMIN_EMAIL, codigo, detalles) => {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 20px;">
            <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
                🚨 Código de Autorización Requerido
            </h2>
            <p style="font-size: 16px;">Hola,</p>
            <p style="font-size: 16px;">El operador ha reportado una herramienta con daños durante el proceso de devolución y requiere tu autorización para registrarla en el sistema.</p>
            
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px dashed #fca5a5;">
                <p style="font-size: 14px; text-align: center; margin-bottom: 5px; color: #991b1b;">CÓDIGO DE AUTORIZACIÓN</p>
                <p style="font-size: 32px; font-weight: bold; text-align: center; color: #b91c1c; letter-spacing: 6px; margin: 0;">
                    ${codigo}
                </p>
            </div>

            <p style="font-size: 16px;"><strong>Detalles del reporte:</strong></p>
            <ul style="font-size: 15px; line-height: 1.6;">
                <li><strong>Folio de Salida:</strong> #${detalles.folio}</li>
                <li><strong>Trabajador:</strong> ${detalles.trabajador}</li>
                <li><strong>Herramienta:</strong> ${detalles.herramienta}</li>
                <li><strong>Comentario:</strong> ${detalles.comentario}</li>
            </ul>
            
            <p style="font-size: 14px; color: #555; margin-top: 20px;">
                Por favor, proporciona este código al operador en turno para que pueda finalizar el registro de la devolución.
            </p>
            <br/>
            <p style="font-size: 12px; color: #777; border-top: 1px solid #eaeaea; padding-top: 10px;">
                Este es un mensaje automático generado por el Sistema de Almacén.
            </p>
        </div>
    `;

    await transporter.sendMail({
        from: `"Sistema de Almacén" <${process.env.SMTP_USER}>`,
        to: destinatario,
        subject: `🚨 Autorización Requerida: Daño en Folio #${detalles.folio}`,
        html: htmlContent
    });
};

// 5. Alerta individual de herramienta baja en stock
export const enviarAlertaHerramientaBaja = async (herramienta) => {
    const destinatario = process.env.ADMIN_EMAIL;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 20px;">
            <h2 style="color: #d97706; border-bottom: 2px solid #d97706; padding-bottom: 10px;">
                ⚠️ Alerta de Inventario Mínimo
            </h2>
            <p style="font-size: 16px;">Hola, Administrador:</p>
            <p style="font-size: 16px;">La siguiente herramienta ha alcanzado o descendido de su nivel mínimo permitido:</p>
            
            <div style="background-color: #fffbe0; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #fef08a;">
                <p style="margin: 5px 0;"><strong>Código:</strong> ${herramienta.codigo}</p>
                <p style="margin: 5px 0;"><strong>Nombre:</strong> ${herramienta.nombre}</p>
                <p style="margin: 5px 0;"><strong>Stock Actual:</strong> <span style="color: #dc2626; font-weight: bold;">${herramienta.cantidad}</span></p>
                <p style="margin: 5px 0;"><strong>Stock Mínimo:</strong> ${herramienta.stockMinimo}</p>
            </div>

            <p style="font-size: 14px; color: #555;">Por favor, realiza el pedido correspondiente para reabastecer el almacén.</p>
            <br/>
            <p style="font-size: 12px; color: #777; border-top: 1px solid #eaeaea; padding-top: 10px;">
                Este es un mensaje automático generado por el Sistema de Almacén.
            </p>
        </div>
    `;

    await transporter.sendMail({
        from: `"Sistema de Almacén" <${process.env.SMTP_USER}>`,
        to: destinatario,
        subject: `⚠️ Stock Bajo: ${herramienta.nombre} (${herramienta.codigo})`,
        html: htmlContent
    });
};