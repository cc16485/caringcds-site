/* Caring Companions CDS — shared behaviour for the redesigned site.
   Every page loads this. Each piece checks whether its element exists first, so
   one file can serve pages that have a form and pages that do not. */

/* ---------- nav dropdowns: one open at a time, close on outside click / Escape ---------- */
(function () {
  var all = function () { return document.querySelectorAll('details.om-train, details.om-menu'); };
  document.addEventListener('click', function (e) {
    var inside = e.target.closest('details.om-train, details.om-menu');
    all().forEach(function (d) { if (d !== inside) d.removeAttribute('open'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') all().forEach(function (d) { d.removeAttribute('open'); });
  });
})();

/* ---------- phone formatting ---------- */
(function () {
  Array.prototype.forEach.call(document.querySelectorAll('input[type="tel"]'), function (el) {
    el.addEventListener('input', function () {
      var d = el.value.replace(/\D/g, '').slice(0, 10);
      el.value = d.length > 6 ? '(' + d.slice(0,3) + ') ' + d.slice(3,6) + '-' + d.slice(6)
               : d.length > 3 ? '(' + d.slice(0,3) + ') ' + d.slice(3)
               : d.length > 0 ? '(' + d : '';
    });
  });
})();

/* ---------- caregiver pool form ----------
   The caregiver-list signup goes to the hub's Caregiver Pool tab
   (attendant_pool), not the consumer lead pipeline. If that insert fails for
   any reason, the same submission falls back to site_leads so no applicant is
   ever lost — they just show up in Leads instead of the Pool. */
function cdsPoolRow(form) {
  var g = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? (el.value || '').trim() : ''; };
  var transport = g('transport');
  var notes = [g('notes'), transport ? 'Transport: ' + transport : ''].filter(Boolean).join('\n');
  return {
    agency_id: AGENCY_ID,
    first_name: g('first'), last_name: g('last'),
    phone: g('phone'), email: g('email') || null,
    counties: g('county') ? [g('county')] : null,
    hours_wanted: g('hours') || null,
    experience: g('experience') || null,
    has_transport: transport ? /^yes/i.test(transport) : null,
    applicant_notes: notes || null,
    how_heard: 'caringcds.com caregiver list',
    source: 'public'
  };
}

/* ---------- lead forms ----------
   Any <form data-lead-form="<source>"> posts to Supabase (system of record) and
   optionally to the GoHighLevel inbound webhook. On success the form hides and
   its sibling thank-you panel ([data-thanks]) shows.

   site_leads has a fixed column set. Named fields map onto those columns; any
   other field is folded into the message column as "label: value" lines, so
   nothing a visitor typed is ever dropped. */
var SUPABASE_URL  = 'https://siivpekcaryeyttszwav.supabase.co';
var SUPABASE_ANON = 'sb_publishable_iDJ00Ve4hw5iw2YtVmiulg__FmjShmO';
var AGENCY_ID     = 'caring-companions-cds';
var GHL_WEBHOOK   = null;   // set to the GHL inbound webhook URL to enable automations

(function () {
  var forms = document.querySelectorAll('form[data-lead-form], form[data-pool-form]');
  if (!forms.length) return;

  var COLUMNS = ['first_name','last_name','full_name','phone','email','county',
                 'who_needs_care','has_medicaid','message'];
  var RENAME = { first: 'first_name', last: 'last_name', name: 'full_name',
                 who: 'who_needs_care', medicaid: 'has_medicaid' };

  Array.prototype.forEach.call(forms, function (form) {
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      /* validate required fields */
      var problems = [];
      Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (el) {
        el.style.borderColor = '';
        var bad = !el.value.trim();
        if (!bad && el.type === 'tel') bad = el.value.replace(/\D/g, '').length !== 10;
        if (bad) { problems.push(el); el.style.borderColor = '#9a5a48'; }
      });
      var errBox = form.querySelector('[data-form-error]');
      if (!errBox) {
        errBox = document.createElement('p');
        errBox.setAttribute('data-form-error', '');
        errBox.style.cssText = 'display:none;background:#f6e8e4;border:1px solid #d8b3a7;border-radius:4px;padding:12px 14px;font-size:16px;line-height:1.5;color:#7c4030;';
        form.insertBefore(errBox, form.firstChild);
      }
      if (problems.length) {
        errBox.textContent = 'Please fill in the highlighted fields' +
          (problems.some(function (p) { return p.type === 'tel'; }) ? ' — the phone number needs all 10 digits.' : '.');
        errBox.style.display = 'block';
        problems[0].focus();
        return;
      }
      errBox.style.display = 'none';

      var btn = form.querySelector('button[type="submit"]');
      var btnLabel = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      /* collect fields: known columns directly, everything else into message */
      var row = { agency_id: AGENCY_ID, source: form.getAttribute('data-lead-form') || form.getAttribute('data-pool-form') };
      var extras = [];
      Array.prototype.forEach.call(form.querySelectorAll('[name]'), function (el) {
        var v = (el.value || '').trim();
        if (!v) return;
        var key = RENAME[el.name] || el.name;
        if (COLUMNS.indexOf(key) !== -1 && key !== 'message') row[key] = v;
        else if (key === 'message') extras.push(v);
        else extras.push(key.replace(/_/g, ' ') + ': ' + v);
      });
      if (extras.length) row.message = extras.join('\n');

      try {
        var db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
        var res;
        if (form.hasAttribute('data-pool-form')) {
          res = await db.from('attendant_pool').insert(cdsPoolRow(form));
          if (res.error) res = await db.from('site_leads').insert(row);
        } else {
          res = await db.from('site_leads').insert(row);
        }
        if (res.error) throw res.error;
        if (GHL_WEBHOOK) {
          try { await fetch(GHL_WEBHOOK, { method: 'POST',
            headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row) }); } catch (ignore) {}
        }
        /* swap form for its thank-you panel */
        var key = form.getAttribute('data-thanks-key') || 'main';
        var scope = form.parentElement;
        var thanks = null;
        while (scope && !(thanks = scope.querySelector('[data-thanks="' + key + '"]'))) scope = scope.parentElement;
        form.hidden = true;
        if (thanks) { thanks.hidden = false; thanks.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      } catch (err) {
        if (btn) { btn.disabled = false; btn.textContent = btnLabel; }
        errBox.innerHTML = 'Something went wrong sending that, so nothing was submitted. Please call us on '
          + '<a href="tel:+14172182888" style="color:#7c4030;font-weight:700">417-218-2888</a>, toll free 866-863-5151, and we will help straight away.';
        errBox.style.display = 'block';
        errBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
})();
