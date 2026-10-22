// CDS consumer enrollment packet (2026-10-22). Screens match the preview Samantha
// approved (claude.ai/artifact/9W6GJLThKTgqE5o7sTWu1W). Every answer is saved by the
// cds-match server function as you go; each form is saved the moment it is signed and
// can never be changed; the Social Security number is sealed the moment it is sent.
// No em dashes in anything a person reads.

const FN = 'https://siivpekcaryeyttszwav.supabase.co/functions/v1/cds-match';
const KEY = 'sb_publishable_iDJ00Ve4hw5iw2YtVmiulg__FmjShmO';
const LINK = new URLSearchParams(location.search).get('c') || '';
const COUNTIES = ['Barry', 'Barton', 'Benton', 'Camden', 'Cedar', 'Christian', 'Dade', 'Dallas', 'Douglas', 'Greene', 'Hickory', 'Jasper', 'Laclede',
  'Lawrence', 'McDonald', 'Newton', 'Ozark', 'Phelps', 'Polk', 'Pulaski', 'St. Clair', 'Stone', 'Taney', 'Texas', 'Vernon', 'Webster', 'Wright'];

async function api(action, input = {}) {
  if (window.__ENROLL_API) return window.__ENROLL_API('consumer', action, { link: LINK, ...input });   // local practice harness only
  let r;
  try { r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY }, body: JSON.stringify({ role: 'consumer', action, input: { link: LINK, ...input } }) }); }
  catch { throw new Error('We could not reach our server. Check your connection, or call (417) 218-2888.'); }
  const b = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(b.error || 'Something went wrong. Please call (417) 218-2888.');
  return b;
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = s => document.querySelector(s);
const app = $('#app');
let D = null, A = {}, at = 0, msg = '', busy = false, local = {};
const rep = () => A.who === 'rep';
const cfirst = () => esc(A.first || (D && D.first) || '');
const signerName = () => (rep() ? A.rep_name : [A.first, A.last].filter(Boolean).join(' ')) || '';

// ---------- small builders ----------
const txt = (k, label, o = {}) => `<label class="f" for="${k}">${label}${o.opt ? ' <span class="opt">(optional)</span>' : ''}${o.from && D.answers[k] ? '<span class="from">From your call</span>' : ''}</label>
  <input id="${k}" data-k="${k}" type="${o.type || 'text'}" value="${esc(A[k])}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.auto ? `autocomplete="${o.auto}"` : ''} ${o.mode ? `inputmode="${o.mode}"` : ''}>`;
const seg = (k, opts, two) => `<div class="seg${two ? ' two' : ''}" role="radiogroup">${opts.map(([v, l]) => `<label><input type="radio" name="${k}" data-k="${k}" data-re="1" value="${v}" ${A[k] === v ? 'checked' : ''}> ${l}</label>`).join('')}</div>`;
const formsOf = g => D.forms.filter(f => f.group === g && f.who === 'consumer');
function docCard(f) {
  const body = f.doc ? f.doc.map(b => b.p ? `<p>${esc(b.p)}</p>` : `<dl class="filled">${b.kv.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`).join('')
    : `<dl class="filled">${f.rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>${f.agree ? `<p class="small">${esc(f.agree)}</p>` : ''}`;
  const sign = f.signed
    ? `<div class="signed"><div class="sigline">${esc(f.signed.name)}</div>Signed ${esc(new Date(f.signed.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))}${rep() ? ' for ' + esc([A.first, A.last].join(' ')) : ''}</div>`
    : f.missing.length ? `<p class="warn">Before you can sign this, add: ${esc(f.missing.join('; '))}.</p>`
    : `<label class="check"><input type="checkbox" data-agree="${f.key}" ${local['agree_' + f.key] ? 'checked' : ''}> <span>I have read this and agree to it.</span></label>
       <button type="button" class="signbtn" data-sign="${f.key}">Sign ${esc(f.title.replace(/^(IRS|Missouri) Form [\w-]+: /, ''))}</button>`;
  return `<div class="doc${f.signed ? ' done' : ''}"><h3>${esc(f.title)}</h3><p class="what">${esc(f.what)}</p>${body}<div class="signrow">${sign}</div></div>`;
}
const signerBox = () => `<div class="signer"><label class="f" for="signame">Type your full name to sign${rep() ? ', as ' + esc(A.first) + "'s representative" : ''}</label>
  <input id="signame" type="text" value="${esc(local.signame || '')}" autocomplete="name" placeholder="${esc(signerName())}">
  <div class="sigline" id="sigline" aria-hidden="true">${esc(local.signame || '')}</div>
  <p class="small">Your typed name is your signature. Each form is saved the moment you sign it.</p></div>`;

// ---------- the screens ----------
const SCREENS = [
  { id: 'welcome', title: () => 'Welcome to Caring Companions', body: () => `
    <p class="lead">Hi ${cfirst()}! These forms set you up as your attendant's employer, so we can run payroll and pay them every Thursday.</p>
    <ol class="road">
      <li class="now"><div><b>A few questions</b><span>We filled in what we already know.</span></div></li>
      <li><div><b>Sign our ${formsOf('ours').length} forms</b><span>Choosing us, clocking in, your back-up plan.</span></div></li>
      <li><div><b>Sign your ${formsOf('tax').length} tax forms</b><span>We fill them in from your answers and send them for you.</span></div></li>
    </ol>
    <h2>Have these handy</h2>
    <ul class="tight"><li>The Social Security number of the person getting care</li><li>The name and phone number of someone who can help if the attendant cannot come</li></ul>
    <p class="small">About 15 minutes. Your answers save as you go, so you can stop and come back with the same link.</p>
    <label class="check"><input type="checkbox" id="esign" ${D.esign || local.esign ? 'checked' : ''}> <span>I agree to sign these forms electronically by typing my name. My typed name counts as my signature.</span></label>`,
    next: 'Begin',
    async done() { if (!D.esign) { if (!$('#esign').checked) return 'Tick the box to agree to sign electronically.'; await api('enrollEsign'); D.esign = true; } } },

  { id: 'who', title: () => 'Who is filling this out?', body: () => `
    ${seg('who', [['me', 'I am ' + esc([A.first, A.last].filter(Boolean).join(' ') || 'the person getting care')], ['rep', "I am " + cfirst() + "'s legal representative"]])}
    ${rep() ? `${txt('rep_name', 'Your full name', { auto: 'name' })}${txt('rep_rel', 'How you are related, and your legal role', { ph: 'Daughter, power of attorney' })}
      <p class="note">You will sign each form for ${cfirst()}. We may ask for a copy of your power of attorney or guardianship papers.</p>` : ''}`,
    check: () => !!(A.who === 'me' || (A.who === 'rep' && String(A.rep_name || '').trim().split(/\s+/).length > 1 && A.rep_rel)) || 'Choose who is filling this out (and for a representative, your full name and role).' },

  { id: 'about', title: () => (rep() ? 'About ' + cfirst() : 'About you'), body: () => `
    <p class="small">The employer on every form is ${rep() ? cfirst() + ', the person getting care' : 'you, the person getting care'}.</p>
    <div class="row">${txt('first', 'First name', { from: 1, auto: 'given-name' })}${txt('last', 'Last name', { from: 1, auto: 'family-name' })}</div>
    ${txt('street', 'Home address', { from: 1, auto: 'address-line1' })}
    <div class="row">${txt('apt', 'Apartment or unit', { opt: 1 })}${txt('city', 'City', { from: 1 })}</div>
    <div class="row">${txt('zip', 'ZIP code', { from: 1, mode: 'numeric' })}<div><label class="f" for="county">County</label>
      <select id="county" data-k="county"><option value="">Choose</option>${COUNTIES.map(c => `<option ${A.county === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
    <div class="row">${txt('phone', 'Phone', { from: 1, type: 'tel', auto: 'tel' })}${txt('email', 'Email', { from: 1, type: 'email', auto: 'email', opt: 1 })}</div>`,
    check: () => !!(A.first && A.last && A.street && A.city && /^\d{5}$/.test(String(A.zip || '').trim()) && A.county) || 'Fill in the name, full home address (5-digit ZIP) and county.' },

  { id: 'identity', title: () => 'For the tax forms', body: () => D.identity_done ? `
    <div class="ok">Saved and locked away. The tax forms show only the last 4: ${esc(D.ssn_last4)}.</div>
    <p class="small">To change it, call us at (417) 218-2888.</p>` : `
    <p class="lead">The IRS and Missouri need ${rep() ? cfirst() + "'s" : 'your'} Social Security number and date of birth to set ${rep() ? 'them' : 'you'} up as an employer.</p>
    <label class="f" for="dob">Date of birth</label><input id="dob" type="date" value="${esc(local.dob || A.dob || '')}">
    <label class="f" for="ssn">Social Security number</label><input id="ssn" type="text" inputmode="numeric" autocomplete="off" value="${esc(local.ssn || '')}" placeholder="000-00-0000">
    <label class="f" for="ssn2">Type it again</label><input id="ssn2" type="text" inputmode="numeric" autocomplete="off" value="${esc(local.ssn2 || '')}">
    <div class="note">It is locked away the moment you press Continue. Only the office can open it, to fill the tax forms, and it is never sent by text or email.</div>`,
    async done() { if (!D.identity_done) { await api('enrollIdentity', { dob: local.dob || A.dob, ssn: local.ssn, ssn2: local.ssn2 }); local.ssn = local.ssn2 = ''; } } },

  { id: 'employer', title: () => 'Paying the attendant', body: () => `
    ${D.kind === 'move' ? `<p class="note">You already have an employer ID from your old agency. We will get your numbers from them, so you do not need a new one.</p>
      ${txt('v1', 'Your old CDS agency', { from: 1 })}${txt('v1_phone', 'Their phone', { type: 'tel', opt: 1 })}
      ${txt('v2', 'Any other CDS agency before that?', { opt: 1 })}${txt('v2_phone', 'Their phone', { type: 'tel', opt: 1 })}` : ''}
    ${txt('first_pay', 'When do you expect the attendant\'s first shift? <span class="opt">(a guess is fine)</span>', { type: 'date' })}
    <p class="small">The attendant is ${rep() ? cfirst() + "'s" : 'your'} one employee. We pay them every Thursday and file the payroll taxes for ${rep() ? 'them' : 'you'}.</p>`,
    check: () => D.kind !== 'move' || !!A.v1 || 'Type the name of your old CDS agency.' },

  { id: 'evv', title: () => 'How the attendant clocks in', body: () => `
    <p class="lead">Missouri requires a clock in and clock out for every shift. The attendant can use the WellSky app on their phone, or call from ${rep() ? cfirst() + "'s" : 'your'} home phone.</p>
    ${seg('evv', [['phone', 'Yes, the attendant may use the home phone'], ['app', 'No, they will use the WellSky app'], ['none', 'There is no home phone']])}
    <p class="small">Calls are only for clocking in and out, and they are never charged to you.</p>`,
    check: () => !!A.evv || 'Pick one.' },

  { id: 'backup', title: () => 'The back-up plan', body: () => `
    <p class="lead">Who will help if the attendant is sick or cannot get there?</p>
    <div class="sub"><h3>Back-up person</h3><div class="row">${txt('b1_name', 'Name')}${txt('b1_rel', 'Relationship', { ph: 'Son, neighbor' })}</div>${txt('b1_phone', 'Phone', { type: 'tel' })}</div>
    <div class="sub"><h3>Another emergency contact <span class="opt">(optional)</span></h3><div class="row">${txt('b2_name', 'Name')}${txt('b2_rel', 'Relationship')}</div>${txt('b2_phone', 'Phone', { type: 'tel' })}</div>
    <p class="small">Need help finding a back-up caregiver? We can help through findcdscaregivers.com.</p>`,
    check: () => !!(A.b1_name && A.b1_rel && String(A.b1_phone || '').replace(/\D/g, '').length >= 10) || 'Add a back-up person with a name, relationship and 10-digit phone.' },

  { id: 'ours', title: () => 'Sign our forms', body: () => `<p class="lead">Read each form, then sign it.</p>${signerBox()}${formsOf('ours').map(docCard).join('')}`,
    check: () => formsOf('ours').every(f => f.signed) || 'Sign every form to keep going.' },

  { id: 'tax', title: () => 'Sign the tax forms', body: () => `<p class="lead">We filled these in from your answers. Check them, then sign. We send them to the IRS and Missouri for you.</p>
    ${signerBox()}${formsOf('tax').map(docCard).join('')}
    <p class="small">Something wrong? Go back and fix the answer. Missouri Form 2643A is filled in and signed by our office.</p>`,
    next: 'Finish', check: () => formsOf('tax').every(f => f.signed) || 'Sign every tax form to finish.' },

  { id: 'done', last: true, title: () => 'You are all set', body: () => `
    <div class="ok">All ${formsOf('ours').length + formsOf('tax').length} forms are signed and saved.</div>
    <h2>What happens next</h2>
    <ol class="road">
      <li class="done"><div><b>Your forms</b><span>Signed. We got a copy the moment you finished.</span></div></li>
      <li class="now"><div><b>We set ${rep() ? cfirst() : 'you'} up as an employer</b><span>${D.kind === 'move' ? 'We get the numbers from the old agency and send the forms to the IRS and Missouri.' : 'We apply for the EIN, then send the forms to the IRS and Missouri.'} Nothing for you to do.</span></div></li>
      <li><div><b>Consumer orientation</b><span>A short online course: <b style="user-select:all">caringcds.com/consumer-orientation</b>. You sign the Training Acknowledgement at the end.</span></div></li>
      <li><div><b>The attendant applies</b><span>Send them to <b style="user-select:all">caringcds.com/apply</b>.</span></div></li>
    </ol>` },
];

// ---------- running it ----------
function render(keep) {
  at = Math.max(0, Math.min(at, SCREENS.length - 1));
  const s = SCREENS[at];
  $('#barfill').style.width = Math.round(100 * (at + 1) / SCREENS.length) + '%';
  $('#count').textContent = s.last ? 'Finished' : 'Step ' + (at + 1) + ' of ' + (SCREENS.length - 1);
  const nav = s.last ? '' : `<div class="nav">${at > 0 ? '<button class="back" data-act="back">Back</button>' : ''}<button class="go" data-act="next">${s.next || 'Continue'}</button></div>`;
  app.innerHTML = `<section class="card" aria-live="polite"><h1>${s.title()}</h1>${s.body()}<div class="err" id="msg">${esc(msg)}</div>${nav}</section>`;
  if (!keep) window.scrollTo({ top: 0 });
}
let saveT = null;
function saveSoon() {
  if (D.done) return;
  $('#saved').textContent = 'Saving…';
  clearTimeout(saveT);
  saveT = setTimeout(async () => {
    try { await api('enrollSave', { answers: A }); $('#saved').textContent = 'Saved'; }
    catch (e) { $('#saved').textContent = ''; msg = e.message; const m = $('#msg'); if (m) m.textContent = msg; }
  }, 700);
}
document.addEventListener('input', e => {
  const t = e.target;
  // Typed here only, sent once on Continue, never saved in the browser.
  if (['dob', 'ssn', 'ssn2'].includes(t.id)) { local[t.id] = t.value; return; }
  if (t.id === 'esign') { local.esign = t.checked; return; }
  if (t.id === 'signame') { local.signame = t.value; $('#sigline').textContent = t.value; return; }
  if (t.dataset.agree) { local['agree_' + t.dataset.agree] = t.checked; return; }
  const k = t.dataset.k; if (!k) return;
  A[k] = t.value;
  saveSoon();
  if (t.dataset.re) { msg = ''; render(true); }
});
document.addEventListener('change', e => { if (e.target.tagName === 'SELECT' && e.target.dataset.k) { A[e.target.dataset.k] = e.target.value; saveSoon(); } });
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-act],[data-sign]'); if (!a || busy) return;
  busy = true; a.disabled = true;
  try {
    if (a.dataset.sign) {
      const key = a.dataset.sign;
      if (!local['agree_' + key]) throw new Error('Tick the box to say you read it and agree.');
      const name = String(local.signame || '').trim();
      if (name.split(/\s+/).length < 2) throw new Error('Type your full name in the box at the top to sign.');
      clearTimeout(saveT); await api('enrollSave', { answers: A });
      await api('enrollSign', { form: key, typed_name: name, agree: true });
      await reload(); msg = ''; render(true);
    } else if (a.dataset.act === 'back') { msg = ''; at--; render(); }
    else {
      const s = SCREENS[at];
      clearTimeout(saveT);
      if (!D.done) { await api('enrollSave', { answers: A }); $('#saved').textContent = 'Saved'; }
      const r = s.check ? s.check() : true;
      if (r !== true) throw new Error(typeof r === 'string' ? r : 'Please finish this screen first.');
      if (s.done) { const m = await s.done(); if (typeof m === 'string') throw new Error(m); }
      msg = ''; await reload(); at++; render();
    }
  } catch (err) {
    // Show the message without redrawing, so nothing typed on the screen is lost.
    msg = err.message; const m = $('#msg');
    if (m) { m.textContent = msg; m.scrollIntoView({ block: 'center' }); } else render(true);
    a.disabled = false;
  }
  busy = false;
});
async function reload() { D = await api('enroll'); A = { ...A, ...D.answers }; }

(async () => {
  if (!LINK) { app.innerHTML = '<section class="card"><h1>Your enrollment forms</h1><p class="lead">Please open the link from your text or email. Lost it? Call (417) 218-2888 and we will send it again.</p></section>'; $('#bar').hidden = true; return; }
  try {
    await reload();
    at = D.done ? SCREENS.length - 1 : D.esign ? 1 : 0;
    render();
  } catch (e) { $('#bar').hidden = true; app.innerHTML = `<section class="card"><h1>We could not open your forms</h1><p class="lead">${esc(e.message)}</p></section>`; }
})();
