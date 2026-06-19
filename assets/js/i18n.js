/* KCNA Prep — UI internationalization (i18n).
 *
 * English-as-key: the source code passes English strings to t(); translation
 * files register a { "English string": "translation" } map per language. Any
 * string without a translation falls back to its English key, so the app is
 * never broken by a missing entry.
 *
 * Translations live in assets/js/i18n/<code>.js and call I18n.register(code, map).
 * Kubernetes / cloud-native API object names (Pod, Deployment, Ingress, etc.)
 * are intentionally kept in English everywhere — that is how they appear on the
 * English-only KCNA exam and in real-world usage.
 */
window.I18n = (function () {
  // englishString -> translated string, per language. 'en' is identity (empty).
  const DICT = { en: {} };

  // Supported languages. `dir` drives <html dir> (Arabic is right-to-left).
  const LANGS = [
    { code: 'en', label: 'English',    native: 'English',   dir: 'ltr' },
    { code: 'es', label: 'Spanish',    native: 'Español',   dir: 'ltr' },
    { code: 'pt', label: 'Portuguese', native: 'Português', dir: 'ltr' },
    { code: 'fr', label: 'French',     native: 'Français',  dir: 'ltr' },
    { code: 'de', label: 'German',     native: 'Deutsch',   dir: 'ltr' },
    { code: 'it', label: 'Italian',    native: 'Italiano',  dir: 'ltr' },
    { code: 'zh', label: 'Chinese',    native: '简体中文',    dir: 'ltr' },
    { code: 'ja', label: 'Japanese',   native: '日本語',      dir: 'ltr' },
    { code: 'hi', label: 'Hindi',      native: 'हिन्दी',      dir: 'ltr' },
    { code: 'ar', label: 'Arabic',     native: 'العربية',    dir: 'rtl' },
  ];

  let active = 'en';

  function register(code, map) {
    if (!code || !map) return;
    DICT[code] = Object.assign(DICT[code] || {}, map);
  }

  // A language is usable if it's English or has a registered dictionary.
  function has(code) { return code === 'en' || !!DICT[code]; }

  function meta(code) {
    for (let i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return LANGS[i];
    return LANGS[0];
  }
  function dirFor(code) { return meta(code).dir; }

  // Replace {name} placeholders with vars.name. Values are inserted raw, so the
  // caller is responsible for escaping any untrusted content it passes in.
  function interp(str, vars) {
    if (!vars) return str;
    return String(str).replace(/\{(\w+)\}/g, function (m, k) {
      return vars[k] == null ? m : String(vars[k]);
    });
  }

  // Translate an English string into the active language (or fall back to it).
  function t(s, vars) {
    if (s == null) return '';
    const tbl = DICT[active];
    const out = (tbl && tbl[s] != null) ? tbl[s] : s;
    return interp(out, vars);
  }

  function setActive(code) { active = has(code) ? code : 'en'; return active; }
  function getActive() { return active; }

  // Best-supported language from the browser's preference list (base subtag).
  function detect() {
    const prefs = (navigator.languages && navigator.languages.length)
      ? navigator.languages : [navigator.language || 'en'];
    for (let i = 0; i < prefs.length; i++) {
      const base = String(prefs[i] || '').toLowerCase().split('-')[0];
      for (let j = 0; j < LANGS.length; j++) if (LANGS[j].code === base) return base;
    }
    return 'en';
  }

  // Set <html lang>/<dir> and translate any static [data-i18n] markup.
  function applyDocument(code) {
    const m = meta(code);
    const html = document.documentElement;
    html.setAttribute('lang', code);
    html.setAttribute('dir', m.dir);
    applyStatic();
  }

  // Translate static elements tagged in the HTML:
  //   <a data-i18n="Dashboard">…           → textContent
  //   <button data-i18n-attr="title:Settings; aria-label:Settings">
  function applyStatic(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    scope.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        const ix = pair.indexOf(':');
        if (ix < 0) return;
        const attr = pair.slice(0, ix).trim();
        const key = pair.slice(ix + 1).trim();
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
  }

  return {
    t: t, register: register, has: has, meta: meta, dirFor: dirFor,
    setActive: setActive, active: getActive, detect: detect,
    applyDocument: applyDocument, applyStatic: applyStatic, LANGS: LANGS,
  };
})();
