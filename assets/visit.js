/* Visit counter (2026-11-09, her monthly content scorecard on the CDS Hub Owners tab). Counts only, never a person,
   no cookies: a random id for this tab, the page, the website a visitor came from (name only) and the post tag
   (?from= or utm_source). Only Hub logins can read the counts. caringcds.com only, so previews never count. */
(function () {
  try {
    if (window.__cdsVisitCounted) return; window.__cdsVisitCounted = true;
    if (!/(^|\.)caringcds\.com$/.test(location.hostname)) return;
    var sid = sessionStorage.getItem('cds-visit');
    if (!sid) { sid = 'v' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36); sessionStorage.setItem('cds-visit', sid); }
    var ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ''; } catch (e) {}
    if (/(^|\.)caringcds\.com$/.test(ref)) ref = '';
    var q = new URLSearchParams(location.search);
    var tag = String(q.get('from') || q.get('utm_source') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
    var send = function (event) {
      fetch('https://siivpekcaryeyttszwav.supabase.co/rest/v1/site_events', { method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', apikey: 'sb_publishable_iDJ00Ve4hw5iw2YtVmiulg__FmjShmO', Prefer: 'return=minimal' },
        body: JSON.stringify({ session_id: sid, event: event, path: location.pathname.slice(0, 200), came_from: ref.slice(0, 120) || null, from_tag: tag || null }) }).catch(function () {});
    };
    send('page_view');
    document.addEventListener('click', function (ev) { var t = ev.target && ev.target.closest ? ev.target.closest('a[href^="tel:"]') : null; if (t) send('call_click'); });
  } catch (e) { /* counting must never break the page */ }
})();
