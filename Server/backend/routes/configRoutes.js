import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { enviarNotificacionPendientes, enviarReporteSemanal, enviarAlertaStockMinimo } from '../services/emailService.js';
import { generarExcelEnMemoria, formatearMotivo } from '../utils/excelHelper.js';
import { verificarToken, verificarAdmin } from '../middlewares/auth.js';

import es from '../locals/es.json' assert { type: 'json' };
import en from '../locals/en.json' assert { type: 'json' };

const dictionaries = { es, en };
const prisma = new PrismaClient();
const router = Router();

router.use(verificarToken, verificarAdmin);

// ==========================================
// HELPERS
// ==========================================
const obtenerDestinatariosDB = async (correoAlterno = null) => {
    if (correoAlterno && typeof correoAlterno === 'string' && correoAlterno.trim() !== '') {
        return [correoAlterno.trim().toLowerCase()];
    }

    const destinatariosBD = await prisma.destinatarioCorreo.findMany({
        where: { activo: true },
        select: { correo: true }
    });

    const listaCorreos = destinatariosBD.map(d => d.correo.trim().toLowerCase());

    if (listaCorreos.length === 0 && process.env.ADMIN_EMAIL) {
        listaCorreos.push(process.env.ADMIN_EMAIL.trim().toLowerCase());
    }

    return listaCorreos;
};

const obtenerTextoUsuario = (usuarioObj, numeroFallback, nombreFallback, textoPorDefecto = 'N/A') => {
    // Busca la propiedad de número dentro del objeto o usa el fallback
    const num = usuarioObj?.numeroTrabajador || 
                usuarioObj?.numeroEmpleado || 
                usuarioObj?.numero || 
                usuarioObj?.codigo || 
                usuarioObj?.numTrabajador ||
                numeroFallback || 
                '';

    const nom = usuarioObj?.nombre || nombreFallback || '';

    if (num && nom) return `${num} - ${nom}`;
    if (nom) return nom;
    if (num) return String(num);

    return textoPorDefecto;
};
// Helper para detectar idioma fallback
const obtenerIdioma = (req) => {
    if (req.body?.lang) return req.body.lang;
    if (req.query?.lang) return req.query.lang;
    if (req.headers['accept-language']?.includes('en')) return 'en';
    return 'es';
};

// ==========================================
// GESTIÓN DE DESTINATARIOS EN BASE DE DATOS
// ==========================================

router.get('/destinatarios', async (req, res) => {
    try {
        const destinatarios = await prisma.destinatarioCorreo.findMany({
            orderBy: { creadoEn: 'asc' }
        });
        return res.json(destinatarios);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/destinatarios', async (req, res) => {
    const { nombre, correo } = req.body || {};
    if (!correo) {
        return res.status(400).json({ success: false, error: 'El correo es obligatorio.' });
    }

    try {
        const nuevoDestinatario = await prisma.destinatarioCorreo.create({
            data: {
                nombre: nombre || 'Almacén',
                correo: correo.trim().toLowerCase(),
                activo: true
            }
        });
        return res.status(201).json(nuevoDestinatario);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/destinatarios/:id', async (req, res) => {
    const { id } = req.params;
    const { activo } = req.body;

    try {
        const actualizado = await prisma.destinatarioCorreo.update({
            where: { id: Number(id) },
            data: { activo: Boolean(activo) }
        });
        return res.json(actualizado);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/destinatarios/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.destinatarioCorreo.delete({
            where: { id: Number(id) }
        });
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// AUTOMATIZACIÓN Y REPORTES DINÁMICOS
// ==========================================

router.get('/automatizacion', async (req, res) => {
    try {
        return res.json({ success: true, activo: false });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/automatizacion', async (req, res) => {
    const lang = obtenerIdioma(req);
    const { activo, correoDestino } = req.body || {};
    const t = dictionaries[lang] || dictionaries.es;

    try {
        const destinatarios = await obtenerDestinatariosDB(correoDestino);

        if (Boolean(activo)) {
            if (!destinatarios || destinatarios.length === 0) {
                const mensajeError = lang === 'en' ? 'No active recipients found.' : 'No hay destinatarios activos.';
                return res.status(400).json({ success: false, error: mensajeError });
            }

            const salidasPendientes = await prisma.salida.findMany({
                where: { estado: 'PENDIENTE' },
                include: {
                    detalles: { include: { herramienta: true } },
                    prestador: true,
                    receptor: true
                },
                orderBy: { fechaSalida: 'desc' }
            });

            if (salidasPendientes.length > 0) {
                const listaFormateada = [];

                salidasPendientes.forEach(s => {
                    let motivoFinal = formatearMotivo(s.motivo, s.motivoOtro, lang);
                    if ((s.motivo === 'Otro' || s.motivo === 'other') && s.motivoOtro) {
                        motivoFinal = `${lang === 'en' ? 'Other' : 'Otro'}: ${s.motivoOtro}`;
                    }

                    let fechaSalidaFormateada = 'N/A';
                    if (s.fechaSalida) {
                        try {
                            fechaSalidaFormateada = new Date(s.fechaSalida).toLocaleString(lang === 'en' ? 'en-US' : 'es-MX', { 
                                timeZone: 'America/Tijuana', hour12: true, year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            });
                        } catch (e) { fechaSalidaFormateada = String(s.fechaSalida); }
                    }

                    let totalPrestado = 0;
                    let totalDevuelto = 0;

                    const herramientasFormateadas = s.detalles.map(d => {
                        const nombreHerr = d.herramienta?.nombre || (lang === 'en' ? 'Unknown' : 'Desconocida');
                        const cantPrestada = d.cantidadPrestada || 1;
                        const cantRegresada = d.cantidadRegresada || 0;

                        totalPrestado += cantPrestada;
                        totalDevuelto += cantRegresada;

                        let texto = `${cantPrestada}x ${nombreHerr}`;
                        if (cantRegresada > 0) {
                            texto += ` (${t.values.returned} ${cantRegresada})`;
                        }
                        return texto;
                    }).join(' | ');

                    // Obtener fallbacks planos almacenados directamente en la tabla Salida
                    const prestadorNumeroFallback = salida.prestadorNumero || 
                                salida.prestadorTrabajadorNumero || 
                                salida.prestadorEmpleadoNumero ||
                                salida.trabajadorNumero; // Para casos donde el prestador usa la misma cuenta

                    const prestadorNombreFallback = salida.prestadorNombre;

                    const prestadorTexto = obtenerTextoUsuario(
                        salida.prestador, 
                        prestadorNumeroFallback, 
                        prestadorNombreFallback, 
                        adminText
                    );

                    const adminText = lang === 'en' ? 'Main Admin' : 'Admin Principal';
                    const solicitoTexto = obtenerTextoUsuario(null, s.trabajadorNumero, s.trabajadorNombre, 'N/A');

                    const fila = {};
                    fila[t.columns.folio] = `#${s.id}`;
                    fila[t.columns.order] = s.numeroOrden || 'N/A';
                    fila[t.columns.machine] = s.numeroMaquina || 'N/A';
                    fila[t.columns.lender] = prestadorTexto;
                    fila[t.columns.requester] = solicitoTexto;
                    fila[t.columns.reason] = motivoFinal;
                    fila[t.columns.checkoutDate] = fechaSalidaFormateada;
                    fila[t.columns.qtyBorrowed] = totalPrestado;
                    fila[t.columns.qtyReturned] = totalDevuelto;
                    fila[t.columns.tools] = herramientasFormateadas;

                    listaFormateada.push(fila);
                });

                if (listaFormateada.length > 0) {
                    const excelBuffer = await generarExcelEnMemoria(listaFormateada);
                    await enviarNotificacionPendientes(destinatarios, excelBuffer, lang);
                }
            }
        }

        return res.json({ success: true, activo: Boolean(activo) });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/reportes/historial-semanal', async (req, res) => {
    try {
        const lang = obtenerIdioma(req);
        const { correoDestino } = req.body || {};
        const t = dictionaries[lang] || dictionaries.es;
        const destinatarios = await obtenerDestinatariosDB(correoDestino);

        const ahora = new Date();
        const opciones = { timeZone: 'America/Tijuana', year: 'numeric', month: '2-digit', day: '2-digit' };
        const partes = new Intl.DateTimeFormat('en-US', opciones).formatToParts(ahora);

        const year = partes.find(p => p.type === 'year').value;
        const month = partes.find(p => p.type === 'month').value;
        const day = partes.find(p => p.type === 'day').value;

        const fechaLocal = new Date(`${year}-${month}-${day}T00:00:00`);
        const diaSemana = fechaLocal.getDay();
        const diasParaLunes = diaSemana === 0 ? 6 : diaSemana - 1;

        const lunesObj = new Date(fechaLocal);
        lunesObj.setDate(fechaLocal.getDate() - diasParaLunes);

        const yyyy = lunesObj.getFullYear();
        const mm = String(lunesObj.getMonth() + 1).padStart(2, '0');
        const ddLunes = String(lunesObj.getDate()).padStart(2, '0');

        const domingoObj = new Date(lunesObj);
        domingoObj.setDate(lunesObj.getDate() + 6);
        const ddDomingo = String(domingoObj.getDate()).padStart(2, '0');

        const inicioSemanaISO = `${yyyy}-${mm}-${ddLunes}T00:00:00.000-07:00`;
        const finSemanaISO = `${yyyy}-${mm}-${ddDomingo}T23:59:59.999-07:00`;

        const historialSemanal = await prisma.salida.findMany({
            where: { fechaSalida: { gte: new Date(inicioSemanaISO), lte: new Date(finSemanaISO) } },
            include: { detalles: { include: { herramienta: true } }, prestador: true, receptor: true },
            orderBy: { fechaSalida: 'desc' }
        });

        if (historialSemanal.length === 0) {
            const mensajeVacio = lang === 'en' ? 'No movements logged this week.' : 'No hubo movimientos esta semana.';
            return res.json({ success: true, mensaje: mensajeVacio });
        }

        const formatFecha = (fecha) => {
            if (!fecha) return t.values.pendingStatus;
            return new Date(fecha).toLocaleString(lang === 'en' ? 'en-US' : 'es-MX', { 
                timeZone: 'America/Tijuana', hour12: true, year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        };

        const listaFormateada = historialSemanal.map(salida => {
            const resumenHerramientas = salida.detalles.map(d => {
                const nombre = d.herramienta?.nombre || (lang === 'en' ? 'Unknown' : 'Desconocida');
                const cantidad = d.cantidadPrestada || 1;
                const regresada = d.cantidadRegresada ? ` (${t.values.returned} ${d.cantidadRegresada})` : '';
                return `${cantidad}x ${nombre}${regresada}`;
            }).join(' | ');

            const motivoFinal = formatearMotivo(salida.motivo, salida.motivoOtro, lang);
            const adminText = lang === 'en' ? 'Main Admin' : 'Admin Principal';

            // Ajuste para extraer correctamente los fallbacks de prestador y receptor
            // Obtener fallbacks planos almacenados directamente en la tabla Salida
            const prestadorNumeroFallback = salida.prestadorNumero || 
                                salida.prestadorTrabajadorNumero || 
                                salida.prestadorEmpleadoNumero ||
                                salida.trabajadorNumero; // Para casos donde el prestador usa la misma cuenta

            const prestadorNombreFallback = salida.prestadorNombre;

            const prestadorTexto = obtenerTextoUsuario(
                salida.prestador, 
                prestadorNumeroFallback, 
                prestadorNombreFallback, 
                adminText
            );
            const receptorNumeroFallback = salida.receptor?.numeroTrabajador || salida.receptor?.numero || salida.receptorNumero || salida.receptorTrabajadorNumero;
            const receptorNombreFallback = salida.receptor?.nombre || salida.receptorNombre;

            const receptorTexto = salida.estado === 'DEVUELTO' 
                ? obtenerTextoUsuario(salida.receptor, receptorNumeroFallback, receptorNombreFallback, adminText) 
                : t.values.pendingStatus;
            const solicitoTexto = obtenerTextoUsuario(null, salida.trabajadorNumero, salida.trabajadorNombre, 'N/A');

            const fila = {};
            fila[t.columns.folio] = `#${salida.id}`;
            fila[t.columns.order] = salida.numeroOrden || 'N/A';
            fila[t.columns.machine] = salida.numeroMaquina || 'N/A';
            fila[t.columns.lender] = prestadorTexto;
            fila[t.columns.receiver] = receptorTexto;
            fila[t.columns.requester] = solicitoTexto;
            fila[t.columns.reason] = motivoFinal;
            fila[t.columns.checkoutDate] = formatFecha(salida.fechaSalida);
            fila[t.columns.returnDate] = formatFecha(salida.fechaDevolucion);
            fila[t.columns.tools] = resumenHerramientas;
            fila[t.columns.status] = salida.estado === 'PENDIENTE' ? t.values.pending : t.values.devuelto;

            return fila;
        });

        const excelBuffer = await generarExcelEnMemoria(listaFormateada);
        await enviarReporteSemanal(destinatarios, excelBuffer, lang);

        res.json({ success: true, registros: listaFormateada.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/reportes/alertas-stock', async (req, res) => {
    try {
        const lang = obtenerIdioma(req);
        const { correoDestino } = req.body || {};
        const t = dictionaries[lang] || dictionaries.es;
        const destinatarios = await obtenerDestinatariosDB(correoDestino);

        const herramientas = await prisma.herramienta.findMany({
            where: { estado: { not: 'DADA_DE_BAJA' } }
        });

        const bajoStock = herramientas.filter(h => h.cantidadDisponible <= h.cantidadMinima);

        if (bajoStock.length === 0) {
            const mensajeStock = lang === 'en' ? 'No tools currently at minimum stock.' : 'No hay herramientas en stock mínimo actualmente.';
            return res.json({ success: true, mensaje:mensajeStock });
        }

        const listaFormateada = bajoStock.map(h => {
            const fila = {};
            fila[t.columns.code] = h.codigo || 'N/A';
            fila[t.columns.name] = h.nombre || 'N/A';
            fila[t.columns.category] = h.tipo || 'N/A';
            fila[t.columns.brand] = h.marca || 'N/A';
            fila[t.columns.location] = h.ubicacion || 'N/A';
            fila[t.columns.isConsumable] = h.esDesechable ? t.values.yesConsumable : t.values.noConsumable;
            fila[t.columns.minStock] = h.cantidadMinima ?? 0;
            fila[t.columns.maxStock] = h.cantidadMaxima ?? 'N/A';
            fila[t.columns.physicalStock] = h.cantidadDisponible ?? 0;
            fila[t.columns.description] = h.descripcion || (lang === 'en' ? 'No description' : 'Sin descripción');
            return fila;
        });

        const excelBuffer = await generarExcelEnMemoria(listaFormateada);
        await enviarAlertaStockMinimo(destinatarios, excelBuffer, lang);

        res.json({ success: true, registros: listaFormateada.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;