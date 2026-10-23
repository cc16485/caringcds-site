// One Missouri form for a consumer already with Caring Companions (2026-10-22, Samantha approved
// the mockup claude.ai/artifact/L4Sq459wGcwy7JBX5A5yGb). The form's words come from the server;
// the signature is saved there the moment it is made and can never be changed.
// No em dashes in anything a person reads.

const FN = 'https://siivpekcaryeyttszwav.supabase.co/functions/v1/cds-match';
const KEY = 'sb_publishable_iDJ00Ve4hw5iw2YtVmiulg__FmjShmO';
const LINK = new URLSearchParams(location.search).get('c') || '';

async function api(action, input = {}) {
  if (window.__SIGN_API) return window.__SIGN_API('consumer', action, { link: LINK, ...input });   // local practice harness only
  let r;
  try { r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY }, body: JSON.stringify({ role: 'consumer', action, input: { link: LINK, ...input } }) }); }
  catch { throw new Error('We could not reach our server. Check your connection, or call (417) 218-2888.'); }
  const b = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(b.error || 'Something went wrong. Please call (417) 218-2888.');
  return b;
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const app = document.getElementById('app');
let D = null, msg = '', busy = false;
const local = { name: '', rep: false, rel: '', att: '', agree: false };

function block(b) {
  if (b.h) return `<h3 style="margin:16px 0 6px">${esc(b.h)}</h3>`;
  if (b.p) return `<p>${esc(b.p)}</p>`;
  if (b.li) return `<ul>${b.li.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  if (b.kv) return `<dl class="filled">${b.kv.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;
  return '';
}

function render() {
  if (!D) return;
  const when = iso => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const sign = D.signed
    ? `<div class="signed"><div class="sigline">${esc(D.signed.name)}</div>${D.signed.att_name ? `<div class="sigline">${esc(D.signed.att_name)}</div>` : ''}Signed ${esc(when(D.signed.at))}. Thank you, nothing else to do.</div>`
    : `<div class="signer">
        <label class="check"><input type="checkbox" id="rep" ${local.rep ? 'checked' : ''}> <span>I am signing for ${esc(D.name)} as their legal representative.</span></label>
        ${local.rep ? `<label class="f" for="rel">How are you related to ${esc(D.first || D.name)}?</label><input id="rel" type="text" value="${esc(local.rel)}" placeholder="For example: daughter, legal guardian">` : ''}
        <label class="f" for="signame">Type your full name to sign</label>
        <input id="signame" type="text" value="${esc(local.name)}" autocomplete="name" placeholder="${esc(local.rep ? 'Your full name' : D.name)}">
        <div class="sigline" aria-hidden="true">${esc(local.name)}</div>
        ${D.attendant ? `<label class="f" for="att">Attendant, type your full name</label>
          <input id="att" type="text" value="${esc(local.att)}" autocomplete="off" placeholder="${esc(D.att_name || 'Attendant full name')}">
          <div class="sigline" aria-hidden="true">${esc(local.att)}</div>` : ''}
        <label class="check"><input type="checkbox" id="agree" ${local.agree ? 'checked' : ''}> <span>${esc(D.agree)}</span></label>
        <p class="small">Your typed name is your signature.</p>
        <button type="button" class="signbtn" id="signbtn" ${busy ? 'disabled' : ''}>${busy ? 'Signing…' : 'Sign'}</button>
      </div>`;
  app.innerHTML = `<div class="card doc${D.signed ? ' done' : ''}">
    <h2 style="margin-top:0">${esc(D.title)}${D.year ? ' ' + esc(D.year) : ''}</h2>
    <p class="what">${esc(D.what)}</p>
    ${D.doc.map(block).join('')}
    <div class="signrow">${sign}</div>
    ${msg ? `<p class="warn" role="alert">${esc(msg)}</p>` : ''}
  </div>`;
}

app.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'signame') { local.name = t.value; t.nextElementSibling.textContent = t.value; }
  if (t.id === 'att') { local.att = t.value; t.nextElementSibling.textContent = t.value; }
  if (t.id === 'rel') local.rel = t.value;
});
app.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'rep') { local.rep = t.checked; render(); }
  if (t.id === 'agree') local.agree = t.checked;
});
app.addEventListener('click', async e => {
  if (e.target.id !== 'signbtn' || busy) return;
  busy = true; msg = ''; render();
  try {
    await api('signDo', { typed_name: local.name, agree: local.agree, att_typed: local.att, rep: local.rep ? { rel: local.rel } : null });
    D = await api('signGet');
  } catch (x) { msg = x.message; }
  busy = false; render();
});

(async () => {
  try { D = await api('signGet'); render(); }
  catch (x) { app.innerHTML = `<div class="card"><p class="warn">${esc(x.message)}</p></div>`; }
})();
