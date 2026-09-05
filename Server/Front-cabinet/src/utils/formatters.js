import { useI18n } from 'vue-i18n';

/**
 * Traduce y formatea los motivos de salidas o bajas desde la BD.
 * @param {string} motivo - El valor raw guardado (ej. 'end_of_life', 'set_up')
 * @param {string} motivoOtro - Texto libre si el motivo es 'otro'
 * @returns {string} Texto traducido segun el idioma activo
 */
export function useMotivoTraductor() {
    const { t } = useI18n();

    const obtenerMotivoTraducido = (motivo, motivoOtro = '') => {
        if (!motivo) return t('modal_detalles_pedido.no_especificado', 'NO ESPECIFICADO');

        const clave = String(motivo).trim().toLowerCase();

        if (clave === 'otro' || clave === 'other') {
            const etiquetaOtro = t('detalle_pedido.motivos.otro', 'Otro');
            return motivoOtro ? `${etiquetaOtro}: ${motivoOtro}` : etiquetaOtro;
        }

        const mapaRutasi18n = {
            'end_of_life': 'detalle_pedido.motivos.fin_vida',
            'end of life': 'detalle_pedido.motivos.fin_vida',
            'operator_damage': 'detalle_pedido.motivos.dano_operador',
            'operator damage': 'detalle_pedido.motivos.dano_operador',
            'lost': 'detalle_pedido.motivos.extravio',
            'loss': 'detalle_pedido.motivos.extravio',
            'set_up': 'detalle_pedido.motivos.set_up',
            'set up': 'detalle_pedido.motivos.set_up',
            'setup': 'detalle_pedido.motivos.set_up',
            'poor_quality': 'detalle_pedido.motivos.mala_calidad',
            'poor tool quality': 'detalle_pedido.motivos.mala_calidad'
        };

        const rutaI18n = mapaRutasi18n[clave];
        return rutaI18n ? t(rutaI18n) : motivo;
    };

    return { obtenerMotivoTraducido };
}