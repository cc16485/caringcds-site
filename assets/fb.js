/* Facebook (Meta) pixel for caringcds.com (2026-11-11, Samantha: "Yes, create it").
   Page views only, so our Facebook ads can reach people who visited our public pages.
   - Live site only (caringcds.com), never previews or local copies.
   - Never on the private pages: attendant application, enrollment, form signing, training courses.
   - autoConfig off: Meta does not read buttons or forms on its own. Nothing anyone types is ever sent.
   - After a form is sent, /thank-you/ loads in a hidden frame (CDSFb.markSent) so ads can leave out
     people who already wrote to us. Nothing about the person or the form goes with it. */
(function () {
  'use strict';
  var PIXEL_ID = '';   // CDS business pixel, filled in once Meta creates it
  var PRIVATE = /^\/(apply|enroll|sign|consumer-orientation|attendant-orientation|training)(\/|$)/;

  var sentMarked = false;
  window.CDSFb = {
    markSent: function () {
      if (sentMarked) return; sentMarked = true;
      try {
        var f = document.createElement('iframe');
        f.src = '/thank-you/?from=form'; f.title = ''; f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
        f.style.cssText = 'position:absolute;width:1px;height:1px;left:-9999px;top:0;border:0;visibility:hidden';
        (document.body || document.documentElement).appendChild(f);
      } catch (e) {}
    }
  };

  try {
    if (window.__cdsFbLoaded) return; window.__cdsFbLoaded = true;
    if (!PIXEL_ID) return;
    if (!/(^|\.)caringcds\.com$/.test(location.hostname)) return;
    if (PRIVATE.test(location.pathname)) return;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('set', 'autoConfig', false, PIXEL_ID);
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  } catch (e) { /* the pixel must never break the page */ }
})();
