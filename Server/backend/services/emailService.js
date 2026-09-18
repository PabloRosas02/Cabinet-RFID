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

// 4. Alerta de Herramienta dada de baja / Alerta de Stock
export const enviarAlertaHerramientaBaja = async (destinatario = process.env.ADMIN_EMAIL, datosHerramienta, lang = 'es') => {
    // Normalizar el idioma estrictamente a 'en' o 'es'
    const idiomaNormalizado = (typeof lang === 'string' && lang.trim().toLowerCase().startsWith('en')) ? 'en' : 'es';
    const t = getTranslation(idiomaNormalizado);
    const isEn = idiomaNormalizado === 'en';

    const stockActual = datosHerramienta?.cantidadDisponible ?? datosHerramienta?.cantidad ?? 0;
    const isAgotado = stockActual === 0;

    const titulo = datosHerramienta?.motivo
        ? (isEn ? '⚠️ Alert: Tool Deactivated' : '⚠️ Alerta: Herramienta Dada de Baja')
        : (isAgotado 
            ? (isEn ? '🚨 Alert: Out of Stock' : '🚨 Alerta: Herramienta Agotada')
            : (isEn ? '⚠️ Alert: Low Stock Reached' : '⚠️ Alerta: Stock Mínimo Alcanzado'));

    const estadoTag = datosHerramienta?.motivo
        ? (isEn ? 'DEACTIVATED' : 'DADA DE BAJA')
        : (isAgotado 
            ? (isEn ? 'OUT OF STOCK' : 'AGOTADO') 
            : (isEn ? 'LOW STOCK' : 'STOCK MÍNIMO'));

    const tagBgColor = datosHerramienta?.motivo || isAgotado ? '#991b1b' : '#9a3412';

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; background-color: #111827; color: #f9fafb; max-width: 520px; margin: 0 auto; border-radius: 12px; padding: 24px; border: 1px solid #1f2937;">
            <h2 style="color: #ffffff; border-bottom: 1px solid #374151; padding-bottom: 12px; margin-top: 0; font-size: 18px;">
                ${titulo}
            </h2>

            <div style="text-align: center; margin: 15px 0 20px 0;">
                <span style="background-color: ${tagBgColor}; color: #fef2f2; padding: 4px 14px; border-radius: 6px; font-weight: bold; font-size: 12px; letter-spacing: 1px;">
                    ${estadoTag}
                </span>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #f3f4f6;">
                <tr>
                    <td style="padding: 6px 0; color: #9ca3af; width: 50%; font-size: 12px;">${t.columns?.code || (isEn ? 'Code' : 'Código')}</td>
                    <td style="padding: 6px 0; color: #9ca3af; width: 50%; font-size: 12px;">${t.columns?.name || (isEn ? 'Name' : 'Nombre')}</td>
                </tr>
                <tr>
                    <td style="padding-bottom: 12px; font-weight: bold; color: #38bdf8; font-size: 15px;">${datosHerramienta?.codigo || 'N/A'}</td>
                    <td style="padding-bottom: 12px; font-weight: bold; font-size: 15px;">${datosHerramienta?.nombre || 'N/A'}</td>
                </tr>

                <tr>
                    <td style="padding: 6px 0; color: #9ca3af; font-size: 12px;">${t.columns?.category || (isEn ? 'Type / Category' : 'Tipo / Categoría')}</td>
                    <td style="padding: 6px 0; color: #9ca3af; font-size: 12px;">${t.columns?.location || (isEn ? 'Location' : 'Ubicación')}</td>
                </tr>
                <tr>
                    <td style="padding-bottom: 12px; font-weight: bold;">${datosHerramienta?.tipo || 'N/A'}</td>
                    <td style="padding-bottom: 12px; font-weight: bold;">${datosHerramienta?.ubicacion || 'N/A'}</td>
                </tr>

                <tr>
                    <td style="padding: 6px 0; color: #9ca3af; font-size: 12px;">${t.columns?.brand || (isEn ? 'Brand' : 'Marca')}</td>
                    <td style="padding: 6px 0; color: #9ca3af; font-size: 12px;">${t.columns?.isConsumable || (isEn ? 'Is Consumable?' : '¿Es Consumible?')}</td>
                </tr>
                <tr>
                    <td style="padding-bottom: 12px; font-weight: bold;">${datosHerramienta?.marca || 'N/A'}</td>
                    <td style="padding-bottom: 12px; font-weight: bold; color: #38bdf8;">
                        ${datosHerramienta?.esDesechable ? t.values?.yesConsumable : t.values?.noConsumable}
                    </td>
                </tr>
            </table>

            <div style="margin-top: 10px; margin-bottom: 15px;">
                <div style="color: #9ca3af; font-size: 12px; margin-bottom: 4px;">Stock (Act / Mín / Máx)</div>
                <div style="font-weight: bold; font-size: 16px; color: #ffffff;">
                    ${stockActual} / ${datosHerramienta?.cantidadMinima ?? 0} / ${datosHerramienta?.cantidadMaxima ?? 'N/A'}
                </div>
            </div>

            ${datosHerramienta?.motivo ? `
                <div style="background-color: #1f2937; padding: 12px; border-radius: 8px; border: 1px solid #374151; margin-bottom: 15px;">
                    <div style="color: #ef4444; font-size: 12px; margin-bottom: 4px; font-weight: bold;">${isEn ? 'Reason' : 'Motivo'}</div>
                    <div style="font-size: 13px; color: #fca5a5; font-weight: bold;">
                        ${datosHerramienta.motivo}
                    </div>
                </div>
            ` : ''}

            ${datosHerramienta?.descripcion ? `
                <div style="background-color: #1f2937; padding: 12px; border-radius: 8px; border: 1px solid #374151;">
                    <div style="color: #9ca3af; font-size: 12px; margin-bottom: 4px;">${t.columns?.description || (isEn ? 'Description' : 'Descripción')}</div>
                    <div style="font-size: 13px; color: #d1d5db;">
                        ${datosHerramienta.descripcion}
                    </div>
                </div>
            ` : ''}

            <br/>
            <p style="font-size: 11px; color: #6b7280; border-top: 1px solid #374151; padding-top: 10px; margin-bottom: 0;">
                ${t.systemName || (isEn ? 'Warehouse System' : 'Sistema de Almacén')}
            </p>
        </div>
    `;

    await transporter.sendMail({
        from: `"${t.systemName || (isEn ? 'Warehouse System' : 'Sistema de Almacén')}" <${process.env.SMTP_USER}>`,
        to: destinatario,
        subject: `${titulo}: ${datosHerramienta?.codigo || ''} - ${datosHerramienta?.nombre || ''}`,
        html: htmlContent
    });
};

// 5. Código de Autorización por Daño
export const enviarCodigoAutorizacionDano = async (destinatario = process.env.ADMIN_EMAIL, codigo, lang = 'es') => {
    const t = getTranslation(lang); // Obtiene el diccionario correspondiente 'es' o 'en'

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