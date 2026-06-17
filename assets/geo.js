/**
 * სანტექ-1972 — geo redirect
 * Georgian IP → "/" (ka),  foreign IP → "/en/" (en).
 * Manual KA/EN choice (stored in localStorage) always wins.
 * Auto-redirect happens at most once per browser session.
 */
(function () {
  'use strict';

  var path = location.pathname;
  var currentLang = /^\/en(\/|$)/.test(path) ? 'en' : 'ka';

  // Lock manual choice: clicking a KA/EN link records the language.
  function bindToggles() {
    var links = document.querySelectorAll('[data-setlang]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (e) {
        try { localStorage.setItem('lang', e.currentTarget.getAttribute('data-setlang')); } catch (err) {}
      });
    }
  }
  if (document.readyState !== 'loading') bindToggles();
  else document.addEventListener('DOMContentLoaded', bindToggles);

  // Respect a manual choice — never auto-redirect once the user picked.
  var saved = null;
  try { saved = localStorage.getItem('lang'); } catch (err) {}
  if (saved) return;

  // Only auto-redirect once per session (avoids loops / repeated jumps).
  try { if (sessionStorage.getItem('geo_done')) return; } catch (err) {}

  var controller = new AbortController();
  var timeout = setTimeout(function () { controller.abort(); }, 2500); // fail fast → stay on current page

  fetch('https://ipwho.is/?fields=country_code', { signal: controller.signal })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      clearTimeout(timeout);
      try { sessionStorage.setItem('geo_done', '1'); } catch (err) {}
      try { if (localStorage.getItem('lang')) return; } catch (err) {}
      var cc = (d && d.country_code) || '';
      var desired = (cc && cc !== 'GE') ? 'en' : 'ka';
      if (desired === currentLang) return;
      location.replace(desired === 'en' ? '/en/' : '/');
    })
    .catch(function () { clearTimeout(timeout); /* network/timeout/blocked → stay */ });
})();
