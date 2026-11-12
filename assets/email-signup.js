/* Email sign-up box (2026-11-11, Samantha: "Approved, build it").
   "Get all 6 Getting Paid worksheets by email": first name + email only. Saved to cds_email_signups
   with the public key (the database lets the public add a row, never read one). Not a lead: it does
   not go on Leads and sets off no alert. The CDS server then sends 4 welcome emails and stops.
   Shows just above the footer on: home, Getting Paid, How it works, Consumers, the eligibility check,
   Service area and the 27 county pages. Never on any other page. Loaded by assets/site.js. */
(function () {
  'use strict';
  var URL_ = 'https://siivpekcaryeyttszwav.supabase.co';
  var KEY = 'sb_publishable_iDJ00Ve4hw5iw2YtVmiulg__FmjShmO';
  var PAGES = /^\/(|getting-paid\/|how-it-works\/|consumers\/|check\/|service-area\/|[a-z-]+-county\/)$/;

  function path() { var p = location.pathname.replace(/index\.html$/, ''); return p.charAt(p.length - 1) === '/' ? p : p + '/'; }
  function start() {
  if (!PAGES.test(path()) || document.querySelector('[data-email-signup]')) return;

  var css = '.cds-es{background:#f7f3ec;border-top:1px solid #e6e0d4;padding:56px 20px}'
    + '.cds-es-in{max-width:760px;margin:0 auto;display:grid;grid-template-columns:1.1fr 1fr;gap:32px;align-items:center}'
    + '.cds-es .cds-es-k{font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#0f7a7c;margin:0 0 10px}'
    + '.cds-es h2{font-family:Newsreader,Georgia,serif;font-weight:500;font-size:clamp(28px,4vw,38px);line-height:1.12;color:#14304d;margin:0 0 12px;letter-spacing:-.01em}'
    + '.cds-es p{margin:0;color:#4a5560;font-size:17px;line-height:1.6}'
    + '.cds-es form{display:grid;gap:12px}'
    + '.cds-es label{display:grid;gap:4px;font-size:15px;font-weight:600;color:#14304d}'
    + '.cds-es input{font:inherit;font-size:17px;padding:13px 14px;border:1.5px solid #d6cfc2;border-radius:10px;background:#fff;color:#14304d;width:100%}'
    + '.cds-es input:focus{outline:3px solid #f0a63a;outline-offset:1px;border-color:#0e3860}'
    + '.cds-es button{font:inherit;font-size:17px;font-weight:700;background:#0e3860;color:#fff;border:0;border-radius:999px;padding:15px 24px;cursor:pointer;min-height:52px}'
    + '.cds-es button:disabled{opacity:.6;cursor:default}'
    + '.cds-es small{display:block;font-size:14px;line-height:1.5;color:#6b6358}'
    + '.cds-es-err{background:#f6e8e4;border:1px solid #d8b3a7;border-radius:8px;padding:10px 12px;font-size:15px;color:#7c4030}'
    + '.cds-es-ok{background:#fff;border:1.5px solid #cfe5e3;border-radius:14px;padding:22px}'
    + '.cds-es-ok b{display:block;font-family:Newsreader,Georgia,serif;font-weight:500;font-size:24px;color:#14304d;margin-bottom:6px}'
    + '@media (max-width:720px){.cds-es{padding:44px 16px}.cds-es-in{grid-template-columns:1fr;gap:20px}}';

  var sec = document.createElement('section');
  sec.className = 'cds-es'; sec.setAttribute('data-email-signup', ''); sec.setAttribute('aria-labelledby', 'cds-es-h');
  sec.innerHTML = '<style>' + css + '</style><div class="cds-es-in"><div>'
    + '<p class="cds-es-k">Free worksheets</p>'
    + '<h2 id="cds-es-h">Get all 6 Getting Paid worksheets by email.</h2>'
    + '<p>Print-ready worksheets from Getting Paid to Care for Dad, from "Is CDS a Fit for Our Family?" to "Our Yearly Check-In".</p>'
    + '</div><div data-es-box><form novalidate>'
    + '<label>First name<input name="first" autocomplete="given-name" maxlength="60" required></label>'
    + '<label>Email<input name="email" type="email" autocomplete="email" inputmode="email" maxlength="200" required></label>'
    + '<button type="submit">Send me the worksheets</button>'
    + '<small>4 short emails over about 2 weeks, then we stop. Unsubscribe any time.</small>'
    + '</form></div></div>';

  var foot = document.querySelector('footer.om-foot') || Array.prototype.slice.call(document.querySelectorAll('body > footer, footer')).pop();
  if (foot && foot.parentNode) foot.parentNode.insertBefore(sec, foot); else document.body.appendChild(sec);

  var form = sec.querySelector('form'), box = sec.querySelector('[data-es-box]');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var first = form.first.value.trim(), email = form.email.value.trim();
    var old = form.querySelector('.cds-es-err'); if (old) old.remove();
    var err = function (msg) { var p = document.createElement('p'); p.className = 'cds-es-err'; p.setAttribute('role', 'alert'); p.innerHTML = msg; form.insertBefore(p, form.firstChild); };
    if (!first || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err('Please add your first name and a full email address.'); (first ? form.email : form.first).focus(); return; }
    var btn = form.querySelector('button'); btn.disabled = true; btn.textContent = 'Sending…';
    fetch(URL_ + '/rest/v1/cds_email_signups', { method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ first_name: first.slice(0, 60), email: email.slice(0, 200), page: path() }) })
      .then(function (r) {
        if (!r.ok) throw new Error('save ' + r.status);
        try { if (window.CDSFb) window.CDSFb.markSent(); } catch (x) {}
        box.innerHTML = '<div class="cds-es-ok" role="status"><b>Check your email.</b><p>Your worksheets are on the way to <span></span>. If they are not there in a few minutes, look in your spam or promotions folder.</p></div>';
        box.querySelector('span').textContent = email;
      })
      .catch(function () {
        btn.disabled = false; btn.textContent = 'Send me the worksheets';
        err('Something went wrong, so nothing was saved. Please try again, or call us on <a href="tel:+14172182888" style="color:#7c4030;font-weight:700">417-218-2888</a>.');
      });
  });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
