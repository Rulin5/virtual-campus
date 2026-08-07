/* i18n.js — Multi-language support */
const TRANSLATIONS={en:{loading:'Loading...',play:'Play','no-time':'No time to explore?'},sk:{loading:'Načítava sa...',play:'Hrať','no-time':'Nemáš čas preskúmať?'}};
function getCurrentLanguage(){return window.location.pathname.startsWith('/sk')?'sk':'en'}
function t(key){const lang=getCurrentLanguage();return TRANSLATIONS[lang]?.[key]||TRANSLATIONS['en'][key]||key}
window.t=t;window.getCurrentLanguage=getCurrentLanguage;
