import { createI18n } from 'vue-i18n';
import es from './locals/es.json';
import en from './locals/en.json';

// Lógica para detectar el idioma del navegador o el guardado previamente
const detectarIdioma = () => {
  const idiomaGuardado = localStorage.getItem('idiomaPreferido');
  if (idiomaGuardado) return idiomaGuardado;

  const idiomaNavegador = navigator.language || navigator.userLanguage;
  return idiomaNavegador.toLowerCase().startsWith('en') ? 'en' : 'es';
};

// Crear la instancia de i18n
const i18n = createI18n({
  legacy: false, 
  locale: detectarIdioma(), 
  fallbackLocale: 'es',
  messages: {
    es,
    en
  },
});

export default i18n;