/* Google tag for caringcds.com (2026-11-11): Google Analytics property "Caring Companions CDS Website", so Google Ads
   can count the people who reach us from an ad.
   - Live site only (caringcds.com), never previews or local copies.
   - Never on the private pages: attendant application, enrollment, form signing, training courses.
   - Google gets three things: page views, "lead_submitted" with a plain form name from the list below, and
     "call_click" when someone taps a phone number. Never anything a person types, never their answers.
   - Web addresses are cleaned before Google sees them: only ad codes (utm_*, gclid, gbraid, wbraid) are kept,
     so a lead's own link code (?k=...) on /start never reaches Google.
   - Google signals and ad personalization are off: this is for counting leads, not for following people. */
(function () {
  'use strict';
  if (window.CDSGa) return;
  var GA_ID = 'G-71L1VY58Q4';   // "Caring Companions CDS Website" property 563906479, stream 16323650538
  var PRIVATE = /^\/(apply|enroll|sign|consumer-orientation|attendant-orientation|training|thank-you)(\/|$)/;
  var KEEP = /^(utm_source|utm_medium|utm_campaign|utm_content|utm_term|gclid|gbraid|wbraid)$/;
  var FORMS = { consumer: 1, caregiver: 1, caregiver_list: 1, contact: 1, check: 1, start: 1, home: 1, area: 1 };
  var on = false;

  function clean(href) {
    try {
      var u = new URL(href), keep = [];
      u.searchParams.forEach(function (v, k) { if (KEEP.test(k)) keep.push(encodeURIComponent(k) + '=' + encodeURIComponent(v)); });
      return u.origin + u.pathname + (keep.length ? '?' + keep.join('&') : '');
    } catch (e) { return ''; }
  }
  // The site's own form labels ("caringcds contact", "caringcds greene-county", ...) become one plain name.
  function formName(source) {
    var s = String(source || '').toLowerCase();
    if (FORMS[s]) return s;
    if (/attendant/.test(s)) return 'caregiver';
    if (/consumer/.test(s)) return 'consumer';
    if (/contact/.test(s)) return 'contact';
    if (/eligibility|check/.test(s)) return 'check';
    if (/county|service-area/.test(s)) return 'area';
    if (/home/.test(s)) return 'home';
    return 'contact';
  }

  window.CDSGa = {
    formName: formName,
    clean: clean,
    lead: function (source) {
      try { if (on) window.gtag('event', 'lead_submitted', { form: formName(source) }); } catch (e) {}
    }
  };

  try {
    if (!GA_ID) return;
    if (!/(^|\.)caringcds\.com$/.test(location.hostname)) return;
    if (PRIVATE.test(location.pathname)) return;
    var s = document.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    var cfg = { page_location: clean(location.href), allow_google_signals: false, allow_ad_personalization_signals: false };
    if (document.referrer) cfg.page_referrer = clean(document.referrer);
    window.gtag('config', GA_ID, cfg);
    on = true;
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href^="tel:"]') : null;
      if (a) window.gtag('event', 'call_click');
    }, true);
  } catch (e) { /* the Google tag must never break the page */ }
})();
