/**
 * სანტექ-1972 — geo redirect
 * Georgian IP → "/" (ka),  foreign IP → "/en/" (en).
 * Manual KA/EN choice (stored in localStorage) always wins.
 *
 * NOTE: storage key is "santec_lang" (NOT the old "lang") so any stale
 * value written by the previous i18n toggle is ignored and detection
 * runs fresh for everyone.
 */
(function () {
  'use strict';

  var KEY = 'santec_lang';
  var path = location.pathname;
  var currentLang = /^\/en(\/|$)/.test(path) ? 'en' : 'ka';

  function go(lang) {
    if (lang !== currentLang) location.replace(lang === 'en' ? '/en/' : '/');
  }

  // Lock manual choice: clicking a KA/EN link records the language.
  function bindToggles() {
    var links = document.querySelectorAll('[data-setlang]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (e) {
        try { localStorage.setItem(KEY, e.currentTarget.getAttribute('data-setlang')); } catch (err) {}
      });
    }
  }
  if (document.readyState !== 'loading') bindToggles();
  else document.addEventListener('DOMContentLoaded', bindToggles);

  // Manual choice wins — honor it and send to the chosen page if needed.
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (err) {}
  if (saved === 'ka' || saved === 'en') { go(saved); return; }

  // No manual choice → detect country and redirect to the right language.
  function decide(cc) {
    var desired = (cc && String(cc).toUpperCase() !== 'GE') ? 'en' : 'ka';
    go(desired);
  }

  var done = false;
  function finish(cc) { if (done) return; done = true; decide(cc); }

  // Primary: ipwho.is — fallback: api.country.is (both send CORS *).
  fetch('https://ipwho.is/?fields=country_code')
    .then(function (r) { return r.json(); })
    .then(function (d) { finish(d && d.country_code); })
    .catch(function () {
      fetch('https://api.country.is/')
        .then(function (r) { return r.json(); })
        .then(function (d) { finish(d && d.country); })
        .catch(function () { /* network/blocked → stay on current page */ });
    });
})();
