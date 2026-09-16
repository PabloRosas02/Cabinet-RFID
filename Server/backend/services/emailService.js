import nodemailer from 'nodemailer';
import es from '../locals/es.json' assert { type: 'json' };
import en from '../locals/en.json' assert { type: 'json' };

const dictionaries = { es, en };

const getTranslation = (lang = 'es') => {
    return dictionaries[lang] || dictionaries.es;
};

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000
});

// 1. Notificación de pendientes
export const enviarNotificacionPendientes = async (destinatario = process.env.ADMIN_EMAIL, excelBuffer, lang = 'es') => {
    const t = getTranslation(lang);
    
    const fecha = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-MX', {
        timeZone: 'America/Tijuana',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date()).split('/').join('-'); 
    const nombreArchivo = `${t.email.pending.filename}_${fecha}.xlsx`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 20px;">
            <h2 style="color: #e11d48; border-bottom: 2px solid #e11d48; padding-bottom: 10px;">
                ${t.email.pending.title}
            </h2>
            <p style="font-size: 16px;">${t.email.pending.greeting}</p>
            <p style="font-size: 16px;">${t.email.pending.body1}</p>
            <p style="font-size: 16px;">${t.email.pending.body2}</p>
            <br/>
            <p style="font-size: 12px; color: #777; border-top: 1px solid #eaeaea; padding-top: 10px;">
                ${t.email.pending.footer}
            </p>
        </div>
    `;

    await transporter.sendMail({
        from: `"${t.systemName}" <${process.env.SMTP_USER}>`,
        to: destinatario, 
        subject: t.email.pending.subject,
        html: htmlContent,
        attachments: [{ filename: nombreArchivo, content: excelBuffer }]
    });
};

// 2. Reporte Semanal del Historial
export const enviarReporteSemanal = async (destinatario = process.env.ADMIN_EMAIL, excelBuffer, lang = 'es') => {
    const t = getTranslation(lang);
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `${t.email.weekly.filename}_${fecha}.xlsx`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 20px;">
            <h2 style="color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 10px;">
                ${t.email.weekly.title}
            </h2>
            <p style="font-size: 16px;">${t.email.weekly.greeting}</p>
            <p style="font-size: 16px;">${t.email.weekly.body1}</p>
            <p style="font-size: 16px;">${t.email.weekly.body2}</p>
            <br/>
            <p style="font-size: 12px; color: #777; border-top: 1px solid #eaeaea; padding-top: 10px;">
                ${t.email.weekly.footer}
            </p>
        </div>
    `;

    await transporter.sendMail({
        from: `"${t.systemName}" <${process.env.SMTP_USER}>`,
        to: destinatario,
        subject: t.email.weekly.subject,
        html: htmlContent,
        attachments: [{ filename: nombreArchivo, content: excelBuffer }]
    });
};

// 3. Alerta de Stock Mínimo
export const enviarAlertaStockMinimo = async (destinatario = process.env.ADMIN_EMAIL, excelBuffer, lang = 'es') => {
    const t = getTranslation(lang);
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `${t.email.stock.filename}_${fecha}.xlsx`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 20px;">
            <h2 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">
                ${t.email.stock.title}
            </h2>
            <p style="font-size: 16px;">${t.email.stock.greeting}</p>
            <p style="font-size: 16px;">${t.email.stock.body1}</p>
            <p style="font-size: 16px;">${t.email.stock.body2}</p>
            <br/>
            <p style="font-size: 12px; color: #777; border-top: 1px solid #eaeaea; padding-top: 10px;">
                ${t.email.stock.footer}
            </p>
        </div>
    `;

    await transporter.sendMail({
        from: `"${t.systemName}" <${process.env.SMTP_USER}>`,
        to: destinatario,
        subject: t.email.stock.subject,
        html: htmlContent,
        attachments: [{ filename: nombreArchivo, content: excelBuffer }]
    });
};

// 4. Alerta de Herramienta dada de baja
export const enviarAlertaHerramientaBaja = async (destinatario = process.env.ADMIN_EMAIL, datosHerramienta, lang = 'es') => {
    const t = getTranslation(lang);

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 20px;">
            <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
                ${lang === 'en' ? '⚠️ Alert: Tool Deactivated' : '⚠️ Alerta: Herramienta Dada de Baja'}
            </h2>
            <p style="font-size: 16px;">
                ${lang === 'en' ? 'A tool deactivation has been registered in the system:' : 'Se ha registrado la baja de una herramienta en el sistema:'}
            </p>
            <ul>
                <li><strong>${lang === 'en' ? 'Code' : 'Código'}:</strong> ${datosHerramienta?.codigo || 'N/A'}</li>
                <li><strong>${lang === 'en' ? 'Name' : 'Nombre'}:</strong> ${datosHerramienta?.nombre || 'N/A'}</li>
                <li><strong>${lang === 'en' ? 'Reason/Comment' : 'Motivo/Comentario'}:</strong> ${datosHerramienta?.motivo || 'N/A'}</li>
            </ul>
            <br/>
            <p style="font-size: 12px; color: #777; border-top: 1px solid #eaeaea; padding-top: 10px;">
                ${t.systemName || 'Sistema de Almacén'}
            </p>
        </div>
    `;

    await transporter.sendMail({
        from: `"${t.systemName || 'Sistema de Almacén'}" <${process.env.SMTP_USER}>`,
        to: destinatario,
        subject: lang === 'en' ? '⚠️ Alert: Tool Deactivated' : '⚠️ Alerta: Herramienta Dada de Baja',
        html: htmlContent
    });
};

// 5. Código de Autorización por Daño
export const enviarCodigoAutorizacionDano = async (destinatario = process.env.ADMIN_EMAIL, codigo, lang = 'es') => {
    const t = getTranslation(lang);

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 20px;">
            <h2 style="color: #d97706; border-bottom: 2px solid #d97706; padding-bottom: 10px;">
                ${lang === 'en' ? '🔑 Damage Authorization Code' : '🔑 Código de Autorización por Daño'}
            </h2>
            <p style="font-size: 16px;">
                ${lang === 'en' ? 'An authorization code has been requested to report a damaged tool:' : 'Se ha solicitado un código de autorización para reportar una herramienta dañada:'}
            </p>
            <div style="background-color: #f3f4f6; text-align: center; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 6px; margin: 15px 0;">
                ${codigo}
            </div>
            <p style="font-size: 14px; color: #555;">
                ${lang === 'en' ? 'Use this code in the terminal or interface to authorize the operation.' : 'Utiliza este código en la terminal o interfaz para autorizar la operación.'}
            </p>
            <br/>
            <p style="font-size: 12px; color: #777; border-top: 1px solid #eaeaea; padding-top: 10px;">
                ${t.systemName || 'Sistema de Almacén'}
            </p>
        </div>
    `;

    await transporter.sendMail({
        from: `"${t.systemName || 'Sistema de Almacén'}" <${process.env.SMTP_USER}>`,
        to: destinatario,
        subject: lang === 'en' ? '🔑 Damage Authorization Code' : '🔑 Código de Autorización por Daño',
        html: htmlContent
    });
};