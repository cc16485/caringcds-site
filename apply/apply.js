// CDS attendant application (2026-10-21). Screens match the preview Samantha
// approved (claude.ai/artifact/KSUq7fbBKJYXuygFZC4N9t). Every answer is saved by
// the cds-match server function as you go; signatures are saved one form at a
// time and can never be changed. No em dashes in anything a person reads.

const FN = 'https://siivpekcaryeyttszwav.supabase.co/functions/v1/cds-match';
const KEY = 'sb_publishable_iDJ00Ve4hw5iw2YtVmiulg__FmjShmO';
const LINK = new URLSearchParams(location.search).get('c') || '';
const COUNTIES = ['Barry', 'Barton', 'Benton', 'Camden', 'Cedar', 'Christian', 'Dade', 'Dallas', 'Douglas', 'Greene', 'Hickory', 'Jasper', 'Laclede',
  'Lawrence', 'McDonald', 'Newton', 'Ozark', 'Phelps', 'Polk', 'Pulaski', 'St. Clair', 'Stone', 'Taney', 'Texas', 'Vernon', 'Webster', 'Wright'];
const TASKS = ['Bladder Care', 'Bowel Care', 'Equipment Maintenance', 'Grooming & Hygiene', 'Household Management', 'Laundry', 'Transfers', 'Turning in Bed',
  'Bathing/Showering', 'Meal Consumption', 'Meal Clean Up', 'Meal Preparation', 'ROM Exercises', 'Transportation', 'Dressing/Undressing', 'House Cleaning', 'Medications', 'Shopping'];
const DAYS = [['Mon', 'Monday'], ['Tue', 'Tuesday'], ['Wed', 'Wednesday'], ['Thu', 'Thursday'], ['Fri', 'Friday'], ['Sat', 'Saturday'], ['Sun', 'Sunday']];

async function api(role, action, input = {}) {
  if (window.__PACKET_API) return window.__PACKET_API(role, action, input);   // local practice harness only
  let r;
  try { r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY }, body: JSON.stringify({ role, action, input }) }); }
  catch { throw new Error('We could not reach our server. Check your connection, or call (417) 218-2888.'); }
  const b = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(b.error || 'Something went wrong. Please call (417) 218-2888.');
  return b;
}
const call = (action, input = {}) => api('caregiver', action, { link: LINK, ...input });

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = s => document.querySelector(s);
const app = $('#app');
let D = null, A = {}, at = 0, msg = '', busy = false, local = {};
const first = () => esc(A.first || (D && D.first) || '');
const cfirst = () => esc(((D && D.consumer) || A.consumer_name || 'your consumer').split(' ')[0]);
const fromList = () => D && D.via === 'list';

// ---------- small builders ----------
const get = k => k.split('.').reduce((o, p) => (o == null ? o : o[p]), A);
function set(k, v) { const ps = k.split('.'); let o = A; ps.slice(0, -1).forEach((p, i) => { if (o[p] == null) o[p] = /^\d+$/.test(ps[i + 1]) ? [] : {}; o = o[p]; }); o[ps[ps.length - 1]] = v; }
const txt = (k, label, o = {}) => `<label class="f" for="${k}">${label}${o.opt ? ' <span class="opt">(optional)</span>' : ''}${o.from && fromList() ? '<span class="from">From your sign-up</span>' : ''}</label>
  <input id="${k}" data-k="${k}" type="${o.type || 'text'}" value="${esc(get(k))}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.auto ? `autocomplete="${o.auto}"` : ''} ${o.mode ? `inputmode="${o.mode}"` : ''}>`;
const area = (k, label, o = {}) => `<label class="f" for="${k}">${label}${o.opt ? ' <span class="opt">(optional)</span>' : ''}</label><textarea id="${k}" data-k="${k}" rows="2">${esc(get(k))}</textarea>`;
const seg = (k, opts) => `<div class="seg" role="radiogroup">${opts.map(([v, l]) => `<label><input type="radio" name="${k}" data-k="${k}" data-re="1" value="${v}" ${get(k) === v ? 'checked' : ''}> ${l}</label>`).join('')}</div>`;
const yn = k => seg(k, [['yes', 'Yes'], ['no', 'No']]);
// Missouri's attendant questions (her yes 2026-10-22). The server sends them only while its switch is on;
// the guardian question only when they have a consumer.
const moQs = () => Object.entries((D && D.mo_questions) || {}).filter(([k]) => k !== 'guardian' || A.has_consumer !== 'no');
const today = () => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const sign = (what) => `<div class="sign">
  <label class="check"><input type="checkbox" id="agree" ${local.agree ? 'checked' : ''}> <span>I have read the ${what} and agree to it.</span></label>
  <label class="f" for="signame">Type your full name to sign</label>
  <input id="signame" type="text" value="${esc(local.signame || '')}" autocomplete="name">
  <div class="sigline" id="sigline" aria-hidden="true">${esc(local.signame || '')}</div>
  <p class="small">Signed ${today()}. You get a PDF copy.</p></div>`;
const docHtml = key => { const d = D.docs[key]; return d ? `<div class="doc">${d.doc.map(b => (b.h ? `<h3>${esc(b.h)}</h3>${key === 'contract' && /^\d+\./.test(b.h) ? '' : ''}` : `<p>${esc(b.p)}</p>`)).join('')}</div>` : ''; };
function contractHtml() {
  const d = D.docs.contract; let out = '', part = null;
  const flush = () => { if (part) out += `<div class="init"><label for="i-${part}">Your initials</label><input id="i-${part}" data-ini="${part}" type="text" maxlength="4" value="${esc((local.ini || {})[part] || '')}" autocomplete="off"></div>`; };
  for (const b of d.doc) { if (b.h) { flush(); part = (b.h.match(/^(\d+)\./) || [])[1] || null; out += `<h3>${esc(b.h)}</h3>`; } else out += `<p>${esc(b.p)}</p>`; }
  flush();
  return `<div class="doc">${out}</div>`;
}

// ---------- the screens ----------
const S1 = [
  { id: 'welcome', title: () => 'Welcome, ' + first() + '!', body: () => `
    <p class="lead">${fromList() ? 'Thanks for joining the Caring Companions CDS caregiver list.' : 'We are glad to help you get started as ' + esc(D.consumer || 'your consumer') + "'s CDS caregiver."} This is your application. It takes about 15 minutes, and it saves as you go, so you can stop and come back with the same link.</p>
    <ol class="road">
      ${fromList() ? '<li class="done"><div><b>Join the caregiver list</b><span>Done. Thank you!</span></div></li>' : `<li class="done"><div><b>${esc(D.consumer || 'Your consumer')} chose you</b><span>The consumer is the employer and picks their own caregiver.</span></div></li>`}
      <li class="now"><div><b>Your application</b><span>You are here. About you, your work history, references, and the details we need for the state background checks.</span></div></li>
      <li><div><b>We run the background checks</b><span>Family Care Safety Registry and the other checks Missouri requires. We text you when they come back.</span></div></li>
      <li><div><b>Onboarding</b><span>Opens on this same link once your checks are clear: your attendant papers, payroll setup in Empeon, and a 5-minute ID check.</span></div></li>
    </ol>
    <h2>Have these handy</h2>
    <ul class="tight"><li>Your jobs for the last 7 years (company, supervisor, phone)</li><li>2 personal references who are not relatives</li><li>Your Social Security number and your addresses for the last 7 years</li></ul>
    <div class="note">Your Social Security number is locked away the moment you type it. Only the person who runs your background check can open it, and it is never sent by text or email.</div>
    <label class="check"><input type="checkbox" id="esign" ${D.esign || local.esign ? 'checked' : ''}> <span>I agree to sign these forms electronically by typing my name. My typed name counts as my signature.</span></label>`,
    next: 'Begin my application',
    async done() { if (!D.esign) { if (!$('#esign').checked) return 'Tick the box to agree to sign electronically.'; await call('packetEsign'); D.esign = true; } } },

  { id: 'about', title: () => 'About you', body: () => `
    <p class="lead">Check what you entered, and fill in the rest.</p>
    <div class="row">${txt('first', 'First name', { from: 1, auto: 'given-name' })}${txt('last', 'Last name', { from: 1, auto: 'family-name' })}</div>
    <div class="row">${txt('mi', 'Middle initial', { opt: 1 })}${txt('phone', 'Phone', { from: 1, type: 'tel', auto: 'tel' })}</div>
    ${txt('email', 'Email', { from: 1, type: 'email', auto: 'email' })}
    ${txt('street', 'Street address', { auto: 'address-line1' })}
    <div class="row">${txt('apt', 'Apartment or unit', { opt: 1 })}${txt('city', 'City', { from: 1 })}</div>
    <div class="row">${txt('state', 'State')}${txt('zip', 'ZIP code', { from: 1, mode: 'numeric' })}</div>
    ${txt('aliases', 'Other names you have used <span class="opt">(maiden name, nicknames on ID, aliases)</span>', { opt: 1, ph: 'None' })}`,
    check: () => !!(A.first && A.last && A.street && A.city && A.zip && String(A.phone || '').replace(/\D/g, '').length >= 10) || 'Fill in your name, address and phone.' },

  { id: 'consumer', title: () => 'Who you will care for', body: () => `
    ${fromList() ? `<label class="f">Do you have a CDS consumer planning to hire you?</label>${yn('has_consumer')}` : `<div class="note">You are applying to be <b>${esc(D.consumer)}</b>'s CDS attendant.</div>`}
    ${!fromList() || A.has_consumer === 'yes' ? `
      ${fromList() ? txt('consumer_name', "Your consumer's name") : ''}
      <label class="f">Are you related to ${esc(A.consumer_name || D.consumer || 'them')}?</label>${yn('related')}
      ${A.related === 'yes' ? `<label class="f" for="relation">I am ${cfirst()}'s</label>
        <select id="relation" data-k="relation" data-re="1">${[['', 'Choose one'], ['child', 'Son or daughter'], ['grandchild', 'Grandson or granddaughter'], ['parent', 'Parent'], ['sibling', 'Brother or sister'], ['inlaw', 'In-law'], ['spouse', 'Husband or wife'], ['other', 'Other relative']].map(([v, l]) => `<option value="${v}" ${A.relation === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        ${A.relation === 'spouse' ? `<div class="warn">Missouri does not allow a husband or wife to be paid as their spouse's CDS attendant. Please call us at (417) 218-2888 and we will talk through other options with you.</div>` : ''}` : ''}`
    : `<div class="note">That is fine. Once your checks are clear, families looking for a caregiver can meet you through findcdscaregivers.com. You choose who you work for.</div>`}`,
    check: () => (fromList() && A.has_consumer === 'no') || (A.relation === 'spouse' ? 'A spouse cannot be the attendant. Call us at (417) 218-2888.' : !!((A.consumer_name || D.consumer) && A.related && (A.related === 'no' || A.relation)) || "Answer the questions about your consumer.") },

  { id: 'qual', title: () => 'Can you do the job?', body: () => `
    <p class="lead">Every CDS attendant must be able to say yes to all of these.</p>
    <ul class="tight"><li>I am at least 18 years old.</li><li>I can meet the physical and mental demands of my consumer's care.</li><li>I will keep my consumer's information private.</li><li>I am dependable and emotionally mature.</li><li>I can handle an emergency.</li><li>I am not my consumer's husband or wife.</li></ul>
    <label class="f">Is all of this true for you?</label>${yn('qualified')}
    ${A.qualified === 'no' ? `<div class="warn">If one of these is not true for you, call us at (417) 218-2888 before you go on. We can usually help sort it out.</div>` : ''}`,
    check: () => A.qualified === 'yes' || 'Choose Yes to go on, or call us.' },

  { id: 'list', title: () => (fromList() ? 'The caregiver list' : 'Want more hours?'), body: () => `
    ${fromList() ? '' : '<p class="lead">This is optional. Some attendants also want hours with other consumers.</p>'}
    <p class="${fromList() ? 'lead' : 'small'}">Our caregiver list helps consumers find attendants for long-term, short-term and emergency needs, and helps you find more hours. Families see your first name, your availability and the area you want to work, on findcdscaregivers.com.</p>
    ${seg('list', [['join', 'Yes, list me on findcdscaregivers.com'], ['no', fromList() ? 'Take me off. I only want to work for my consumer.' : 'No thanks, I only want to work for ' + cfirst()]])}
    ${A.list === 'no' && !fromList() ? '<p class="small">Your application is only for ' + cfirst() + '. You can join the list later from this same link.</p>' : A.list === 'join' ? '<p class="small">Next we will set up your caregiver profile. Most of it is filled in from your answers.</p>' : ''}
    <p class="small">If you take a shift from the list and cannot make it, call the office. A no-call, no-show can take you off the list.</p>
    ${A.list === 'join' ? `
      <label class="f">Would you rather care for</label>${seg('prefer', [['men', 'Men'], ['women', 'Women'], ['either', 'Either']])}
      <h2>When can you work?</h2><p class="small">Leave a day empty if you cannot work it.</p>
      ${DAYS.map(([d, l]) => `<label class="f" for="days.${d}">${l}</label><input id="days.${d}" data-k="days.${d}" type="text" value="${esc((A.days || {})[d])}" placeholder="Hours, like 8am to 2pm">`).join('')}
      <label class="f">Can you come in on short notice or be on call?</label>${yn('on_call')}` : ''}
    <h2>Which tasks will you do?</h2><p class="small">Some consumers need these. Tick every one you are willing to do.</p>
    <div class="chips">${TASKS.map(t => `<label><input type="checkbox" data-task="${esc(t)}" ${(A.tasks || []).includes(t) ? 'checked' : ''}> ${esc(t)}</label>`).join('')}</div>`,
    check: () => !!A.list || 'Choose whether to be on the caregiver list.' },

  { id: 'myprofile', only: () => A.list === 'join', title: () => 'Your caregiver profile', body: () => `
    <p class="lead">This is what families see on findcdscaregivers.com. We filled in what you already told us. Add a few things only you can.</p>
    <label class="f" for="photo">A friendly photo of you</label>
    ${local.photoUrl ? `<img class="photo" src="${local.photoUrl}" alt="Your photo">` : local.photoDone ? '<div class="ok">Your photo is saved. Choose another to replace it.</div>' : ''}
    <input type="file" accept="image/*" id="photo">
    <p class="small">Your face clearly visible, good light, no sunglasses.</p>
    <label class="f" for="about_me">In two sentences, why do you like caring for people?</label><textarea id="about_me" rows="3">${esc(local.about_me || '')}</textarea>
    <label class="f">Which counties will you work in?</label>
    <div class="chips">${COUNTIES.map(c => `<label><input type="checkbox" data-county="${esc(c)}" ${(local.counties || []).includes(c) ? 'checked' : ''}> ${esc(c)}</label>`).join('')}</div>
    <label class="f" for="miles">How far will you drive?</label>
    <select id="miles">${[['', 'Choose one'], ['10', 'Up to 10 miles'], ['20', 'Up to 20 miles'], ['30', 'Up to 30 miles'], ['50', 'Up to 50 miles']].map(([v, l]) => `<option value="${v}" ${local.miles === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <label class="check"><input type="checkbox" id="listok" ${local.listok ? 'checked' : ''}> <span>${esc(D.listing_consent)}</span></label>
    <div class="note">Families see your profile only after your background checks are clear and our office approves it. You can add a short hello video and change your profile any time later.</div>`,
    async done() {
      local.about_me = $('#about_me').value.trim(); local.miles = $('#miles').value;
      local.listok = $('#listok').checked;
      if (!local.photoDone) return 'Add a photo of you.';
      if (!local.about_me || !(local.counties || []).length || !local.miles) return 'Add your two sentences, at least one county and how far you will drive.';
      if (!local.listok) return 'Tick the box to say it is OK to show your profile to families.';
      await call('saveProfile', { draft: { about_me: local.about_me, counties: local.counties, travel_miles: +local.miles, town: A.city || '' } });
      await call('giveConsent', { kind: 'profile' });
      await call('submitForReview');   // waits in the office's review list; shown only after checks clear + one tap
    } },

  { id: 'work', title: () => 'Your work history', body: () => {
    const jobs = A.jobs && A.jobs.length >= 3 ? A.jobs : (A.jobs = [...(A.jobs || []), {}, {}, {}].slice(0, Math.max(3, (A.jobs || []).length)));
    return `<p class="lead">List your jobs for the last 7 years, newest first. We need at least 2 past jobs. If you worked for someone on CDS, list them only if they said it is OK.</p>
    <label class="check"><input type="checkbox" data-k="not_working" data-re="1" ${A.not_working ? 'checked' : ''}> <span>I am not working right now</span></label>
    ${jobs.map((j, i) => (i === 0 && A.not_working) ? '' : `<div class="sub"><h3>${i === 0 ? 'Your current job' : 'Past job ' + i + (i <= 2 ? '' : ' (optional)')}</h3>
      <div class="row">${txt(`jobs.${i}.co`, 'Company')}${txt(`jobs.${i}.city`, 'City and state')}</div>
      <div class="row">${txt(`jobs.${i}.sup`, 'Supervisor')}${txt(`jobs.${i}.ph`, 'Their phone', { type: 'tel' })}</div>
      <div class="row">${txt(`jobs.${i}.from`, 'From', { ph: 'Month and year' })}${i === 0 ? '' : txt(`jobs.${i}.to`, 'To', { ph: 'Month and year' })}</div>
      ${area(`jobs.${i}.duties`, 'What you did')}
      ${i === 0 ? '' : txt(`jobs.${i}.why`, 'Why you left')}
      <label class="f">May we call ${esc(j.sup || 'your supervisor')} for a reference?</label>${yn(`jobs.${i}.call`)}</div>`).join('')}
    <button class="add" data-act="addjob">+ Add another job</button>
    ${area('gaps', 'Any gaps between jobs? Tell us why.', { opt: 1 })}
    <h2>School</h2>
    <div class="row">${txt('hs', 'High school')}${txt('hs_years', 'Years')}</div>
    <label class="f">Did you graduate?</label>${yn('hs_grad')}
    <div class="row">${txt('col', 'College', { opt: 1 })}${txt('col_years', 'Years', { opt: 1 })}</div>`; },
    check: () => { const past = (A.jobs || []).slice(1).filter(j => j.co && j.sup && j.ph).length;
      return !!(past >= 2 && (A.not_working || (A.jobs[0] || {}).co)) || 'Add your current job (or tick "not working") and at least 2 past jobs with a supervisor and phone.'; } },

  { id: 'refs', title: () => 'Your references', body: () => {
    if (!A.refs || A.refs.length < 2) A.refs = [...(A.refs || []), {}, {}].slice(0, 2);
    return `<p class="lead">Two people who know you well. Not relatives, and not the supervisors you listed. A friend, co-worker, past client or pastor is great.</p>
    ${A.refs.map((r, i) => `<div class="sub"><h3>Reference ${i + 1}</h3>${txt(`refs.${i}.name`, 'Full name')}
      <label class="f" for="refs.${i}.rel">How do you know them?</label>
      <select id="refs.${i}.rel" data-k="refs.${i}.rel">${['', 'Friend', 'Co-worker', 'Past client', 'Pastor', 'Neighbor', 'Other'].map(o => `<option ${r.rel === o ? 'selected' : ''} value="${o}">${o || 'Choose one'}</option>`).join('')}</select>
      <div class="row">${txt(`refs.${i}.ph`, 'Phone', { type: 'tel' })}${txt(`refs.${i}.em`, 'Email', { type: 'email', opt: 1 })}</div></div>`).join('')}`; },
    check: () => A.refs.every(r => r.name && r.rel && r.ph) || 'Fill in a name, how you know them, and a phone for both references.' },

  { id: 'bgq', title: () => 'Background questions', body: () => {
    if (!A.offenses || !A.offenses.length) A.offenses = [{}];
    return `<p class="lead">Missouri requires a background check for every CDS attendant. Please answer honestly. Leaving something out is against the law and is a bigger problem than the record itself.</p>
    <label class="f">Have you ever been convicted of a crime, or pled guilty or no contest to one? <span class="opt">(Not counting minor traffic tickets. Any time, anywhere.)</span></label>${yn('convicted')}
    ${A.convicted === 'yes' ? A.offenses.map((o, i) => `<div class="sub"><h3>Offense ${i + 1}</h3>${txt(`offenses.${i}.what`, 'What it was')}<div class="row">${txt(`offenses.${i}.when`, 'Date')}${txt(`offenses.${i}.where`, 'City and state')}</div></div>`).join('') + '<button class="add" data-act="addoff">+ Add another</button>' : ''}
    <label class="f">Have you been granted a Good Cause Waiver?</label>${yn('gcw')}
    <p class="small">If a check comes back with something on it, you can apply to the state for a Good Cause Waiver. We will explain how.</p>
    <label class="f">Are you registered with the Family Care Safety Registry (FCSR)?</label>${seg('fcsr', [['yes', 'Yes'], ['no', 'No'], ['notsure', 'Not sure']])}
    ${A.fcsr === 'yes' ? '<div class="ok">Good. If you are already registered, there is no fee again.</div>' : A.fcsr ? '<div class="note">You will need to register once. It costs $16 ($16.57 online) and you never pay it again. If you are already registered, there is no fee again. We will text you the link and help if you get stuck.</div>' : ''}
    <label class="f">For the last 5 years, where have you lived?</label>${seg('mo_only', [['mo', 'Only in Missouri'], ['more', 'In more than one state']])}
    ${moQs().map(([k, x]) => `<label class="f">${esc(x.q)}</label>${yn(k)}${A[k] === 'yes' ? `<div class="note">Missouri does not allow this. Please call us at (417) 218-2888 if you have questions.</div>` : ''}`).join('')}
    <p class="small">This employer uses E-Verify to confirm you can work in the United States.</p>`; },
    check: () => {
      if (!(A.convicted && A.gcw && A.fcsr && A.mo_only && (A.convicted === 'no' || A.offenses.some(o => o.what))) || moQs().some(([k]) => !A[k])) return 'Answer each question.';
      const stop = moQs().find(([k]) => A[k] === 'yes');
      return stop ? 'Missouri does not allow this: ' + stop[1].q.replace(/\?$/, '') + '. Please call us at (417) 218-2888.' : true; } },

  { id: 'bgd', title: () => 'Details for the checks', body: () => {
    if (!A.addrs || !A.addrs.length) A.addrs = [{ a: [A.street, A.apt, A.city, A.state, A.zip].filter(Boolean).join(', '), d: '' }, {}];
    return `<p class="lead">The state checks need these exactly as they are on your ID.</p>
    ${D.identity_done ? '<div class="ok">Your date of birth and Social Security number are saved and locked. You do not need to type them again.</div>' : `
    <label class="f" for="dob">Date of birth</label><input id="dob" type="date" autocomplete="bday" value="${esc(local.dob || '')}">
    <label class="f" for="ssn">Social Security number</label><input id="ssn" type="password" inputmode="numeric" autocomplete="off" placeholder="123-45-6789" value="${esc(local.ssn || '')}">
    <label class="f" for="ssn2">Type it again</label><input id="ssn2" type="password" inputmode="numeric" autocomplete="off" value="${esc(local.ssn2 || '')}">
    ${local.ssn && local.ssn2 && local.ssn.replace(/\D/g, '') !== local.ssn2.replace(/\D/g, '') ? '<div class="err">The two numbers do not match.</div>' : ''}
    <label class="f" for="other_ssn">Any other Social Security number you have used <span class="opt">(leave empty if none)</span></label><input id="other_ssn" type="password" inputmode="numeric" autocomplete="off" value="${esc(local.other_ssn || '')}">
    <div class="note">Locked away as soon as you tap Continue. We keep only the last 4 digits visible.</div>`}
    <label class="f">Gender</label>${seg('gender', [['m', 'Male'], ['f', 'Female']])}
    <h2>Where you have lived for the last 7 years</h2>
    ${A.addrs.map((x, i) => `<div class="sub"><h3>${i === 0 ? 'Now' : 'Before that'}</h3>${txt(`addrs.${i}.a`, 'Full address')}${txt(`addrs.${i}.d`, 'From and to', { ph: '2019 to 2022' })}</div>`).join('')}
    <button class="add" data-act="addaddr">+ Add another address</button>`; },
    async done() {
      if (!A.gender || !(A.addrs[0] || {}).a) return 'Fill in your gender and your current address.';
      if (!D.identity_done) {
        await call('packetIdentity', { dob: local.dob, ssn: local.ssn, ssn2: local.ssn2, other_ssn: local.other_ssn });
        D.identity_done = true; local.ssn = local.ssn2 = local.other_ssn = '';   // never kept once sealed
      }
    } },

  { id: 'signapp', title: () => 'Sign your application', body: () => (D.signed.application ? `<div class="ok">Signed by ${esc(D.signed.application.name)}.</div>` : `<p class="lead">Please read this, then sign.</p>${docHtml('application')}${sign('applicant statement')}`),
    async done() { if (!D.signed.application) await signForm('application'); } },

  { id: 'signbg', title: () => 'Permission for the background checks', body: () => (D.signed.background ? `<div class="ok">Signed by ${esc(D.signed.background.name)}.</div>` : `${docHtml('background')}${sign('background screening policy')}`),
    next: 'Sign and send my application', async done() { if (!D.signed.background) await signForm('background'); } },

  { id: 'done1', last: true, title: () => 'All done, ' + first() + '. Thank you!', body: () => `
    <div class="ok">Your application is in. The office has it now.</div>
    <h2>While we run your checks</h2>
    <a class="go" href="${esc(D.orientation_url)}" target="_blank" rel="noopener">Watch your 1-hour orientation</a>
    <a class="go back" style="margin-top:10px" href="${esc(D.handbook_url)}" target="_blank" rel="noopener">Open your Attendant Handbook</a>
    <div class="note"><b>Save the handbook link</b> on your phone: <b style="user-select:all">caringcds.com/handbook</b>. Come back to it any time you have a question while you work as an attendant. We also just texted and emailed you both links.</div>
    ${D.orientation_done ? '<div class="ok">Orientation finished. Thank you!</div>' : '<button class="back" style="width:100%;margin-top:10px" data-act="orientdone">I finished the orientation</button>'}
    <h2>What happens next</h2>
    <ol class="road">
      <li class="done"><div><b>Your application</b><span>Signed. Each form was saved the moment you finished it, with your signature and the time.</span></div></li>
      <li class="now"><div><b>We run your background checks</b><span>Family Care Safety Registry (FCSR), the Employee Disqualification List (EDL) and the federal OIG exclusion list.${A.fcsr !== 'yes' ? ' Watch for our text with the FCSR registration link ($16, one time).' : ''}</span></div></li>
      <li><div><b>We text you when they are clear</b><span>Then this same link opens Step 2: your attendant papers, payroll setup in Empeon, and a 5-minute ID check.</span></div></li>
    </ol>` },
];

const S2 = [
  { id: 'welcome2', title: () => 'Welcome to Caring Companions!', body: () => `
    <div class="ok">Your background checks came back clear.</div>
    <p>Thank you for choosing to become a caregiver through the Consumer Directed Services (CDS) Program with Caring Companions. We are excited to have you on board and grateful that you are stepping up to care for someone who trusts you.</p>
    <h2>Here is what to expect</h2>
    <ol class="road">
      <li class="now"><div><b>Your attendant papers</b><span>The Attendant Care Contract, your pay rate, how hours and units work, and your handbook. About 10 minutes.</span></div></li>
      <li><div><b>Payroll setup in Empeon</b><span>Your W-4, I-9, direct deposit, and photos of your ID documents, on Empeon's own secure site.</span></div></li>
      <li><div><b>A 5-minute video call</b><span>You show us your ID documents so we can finish your I-9.</span></div></li>
    </ol>
    <p>We are a locally owned agency, and we are here to support you from day one. Welcome to the team. We are glad you are here.<br><i>Warmly, the Caring Companions Team</i></p>`, next: 'Start' },
  { id: 'contract', title: () => 'Attendant Care Contract', body: () => (D.signed.contract ? `<div class="ok">Signed by ${esc(D.signed.contract.name)}.</div>` : `
    <p class="lead">Between <b>${esc(D.company)}</b>, you, and your consumer and employer (<b>${esc(D.consumer || 'your consumer')}</b>). Read each part and put your initials after it.</p>
    ${contractHtml()}${sign('Attendant Care Contract')}<p class="small">Caring Companions signs after you. You will get the fully signed copy.</p>`),
    next: 'Sign the contract', async done() { if (!D.signed.contract) { const miss = D.contract_parts.filter(p => !/^[A-Za-z]{2,4}$/.test(((local.ini || {})[p] || '').trim())); if (miss.length) return 'Put your initials after every part (' + miss.length + ' left).'; await signForm('contract', local.ini); } } },
  { id: 'pay', title: () => 'Your pay rate', body: () => (D.signed.pay ? `<div class="ok">Signed by ${esc(D.signed.pay.name)}.</div>` : docHtml('pay') + sign('pay rate information') + '<p class="small">Your consumer or their authorized representative signs this too.</p>'),
    next: 'Sign', async done() { if (!D.signed.pay) await signForm('pay'); } },
  { id: 'units', title: () => 'Hours, units and getting paid', body: () => (D.signed.units ? `<div class="ok">Signed by ${esc(D.signed.units.name)}.</div>` : docHtml('units') + sign('unit utilization and payroll agreement')),
    next: 'Sign', async done() { if (!D.signed.units) await signForm('units'); } },
  { id: 'handbook', title: () => 'Your Attendant Handbook', body: () => (D.signed.handbook ? `<div class="ok">Signed by ${esc(D.signed.handbook.name)}.</div>` : `
    <p class="lead">Everything about being a Caring Companions CDS attendant in one place.</p>
    <a class="go back" href="${esc(D.handbook_url)}" target="_blank" rel="noopener">Open your Attendant Handbook</a>
    <p class="small"><b>Save this link</b> on your phone: caringcds.com/handbook. It is yours to keep for any question while you work as an attendant.</p>
    ${docHtml('handbook')}${sign('Attendant Handbook')}`),
    next: 'Sign', async done() { if (!D.signed.handbook) await signForm('handbook'); } },
  { id: 'empeon', title: () => 'Set up your payroll in Empeon', body: () => `
    <p class="lead">Empeon is the payroll company. Your W-4, I-9 and direct deposit are done on their secure site, not here.</p>
    <ol class="road">
      <li><div><b>Watch for an email from Empeon</b><span>Our office sends the invite. It goes to ${esc(A.email || D.answers.email || 'your email')}. Check your spam folder too.</span></div></li>
      <li><div><b>Fill in your W-4 and direct deposit</b><span>Have your bank's routing and account numbers ready.</span></div></li>
      <li><div><b>Fill in your I-9 and upload your documents</b><span>Take clear photos, front and back, of the documents that show who you are and that you can work in the U.S. (for example a driver's license and Social Security card, or a passport).</span></div></li>
      <li><div><b>Show the same documents on a 5-minute video call</b><span>The originals, not copies. Then we finish your I-9.</span></div></li>
    </ol>
    ${D.empeon_done ? '<div class="ok">Thanks, you told us Empeon is done.</div>' : '<button class="back" style="width:100%;margin-top:12px" data-act="empeondone">I finished my Empeon paperwork</button><p class="small">You can come back and tap this later.</p>'}` },
  { id: 'wellsky', title: () => 'Clocking in and out', body: () => `
    <p class="lead">Every shift is clocked in WellSky. There are two ways, and both count the same.</p>
    <div class="sub"><h3>The WellSky app</h3><p>On your phone, at your consumer's home. We text you how to sign in.</p></div>
    <div class="sub"><h3>Your consumer's home phone</h3><p>Call from their landline at the start and end of each shift.</p></div>
    <h2>Three rules</h2>
    <ul class="tight"><li>Clock in and out only in your consumer's home.</li><li>You can only be clocked in for one person at a time.</li><li>Missed a clock-in or clock-out? Fill out the EVV correction form by Saturday at 11:59pm.</li></ul>` },
  { id: 'call', title: () => 'Book your 5-minute ID check', body: () => `
    <p class="lead">A quick video call with our office. You hold up the same original ID documents you uploaded to Empeon, so we can finish your I-9. That is all.</p>
    ${D.call_slot ? `<div class="ok">Booked for ${esc(D.call_slot)}. We will text you the video link before your call.</div>${D.room_url ? `<a class="go" style="margin-top:10px" href="${esc(D.room_url)}" target="_blank" rel="noopener">Join the video call</a><p class="small">Open it at your time and wait to be let in. Need a different time? Call (417) 218-2888.</p>` : ''}` : `<label class="f">Pick a time</label>
    <div class="seg" role="radiogroup">${D.call_slots.map(t => `<label><input type="radio" name="slot" value="${esc(t.value)}" ${local.slot === t.value ? 'checked' : ''}> ${esc(t.label)}</label>`).join('')}</div>`}
    <h2>Have these ready</h2>
    <ul class="tight"><li>Your original ID documents (not copies)</li><li>Your phone, charged</li><li>A spot with good light</li></ul>`,
    next: 'Book it', async done() { if (!D.call_slot) { const r = document.querySelector('input[name=slot]:checked'); if (!r) return 'Pick a time for your call.'; await call('packetBookCall', { slot: r.value }); } } },
  { id: 'done2', last: true, title: () => 'Your part is done, ' + first() + '!', body: () => `
    <div class="ok">Thank you. Next is your 5-minute ID check${D.call_slot ? ' on ' + esc(D.call_slot) : ''}.</div>
    <ol class="road">
      <li class="done"><div><b>Attendant papers and handbook</b><span>Signed.</span></div></li>
      <li class="${D.empeon_done ? 'done' : 'now'}"><div><b>Empeon payroll</b><span>${D.empeon_done ? 'Done.' : 'Still to do. Watch for the Empeon email.'}</span></div></li>
      <li class="${D.call_slot ? 'now' : ''}"><div><b>5-minute ID check</b><span>${D.call_slot ? esc(D.call_slot) + '. Have your original ID documents ready.' : 'Not booked yet.'}</span></div></li>
      <li><div><b>The office finishes your I-9 and payroll setup</b><span>Then we let you and ${cfirst()} know you can start.</span></div></li>
    </ol>
    <div class="note">Your Attendant Handbook is always here: <b style="user-select:all">caringcds.com/handbook</b></div>` },
];

// ---------- running it ----------
const screens = () => (D.step === 1 ? S1 : D.step === 'checks' ? S1 : S2).filter(s => !s.only || s.only());
async function signForm(form, initials) {
  const agree = $('#agree') && $('#agree').checked, name = ($('#signame') || {}).value || '';
  if (!agree) throw new Error('Tick the box to say you read it and agree.');
  if (name.trim().split(/\s+/).length < 2) throw new Error('Type your full name, first and last, to sign.');
  await call('packetSign', { form, typed_name: name, agree: true, initials });
  local.agree = false; local.signame = '';
}
function render(keep) {
  const list = screens(); at = Math.max(0, Math.min(at, list.length - 1));
  const s = list[at];
  $('#chip').textContent = D.step === 1 || D.step === 'checks' ? 'Step 1 · Application' : 'Step 2 · Onboarding';
  $('#barfill').style.width = Math.round(100 * (at + 1) / list.length) + '%';
  $('#count').textContent = 'Screen ' + (at + 1) + ' of ' + list.length;
  const nav = s.last ? (at > 0 && D.step !== 'checks' && D.step !== 'done' ? '' : '') : `<div class="nav">${at > 0 ? '<button class="back" data-act="back">Back</button>' : ''}<button class="go" data-act="next">${s.next || 'Continue'}</button></div>`;
  app.innerHTML = `<section class="card" aria-live="polite"><h1>${s.title()}</h1>${s.body()}<div class="err" id="msg">${esc(msg)}</div>${nav}</section>`;
  if (!keep) window.scrollTo({ top: 0 });
}
let saveT = null;
function saveSoon() {
  $('#saved').textContent = 'Saving…';
  clearTimeout(saveT);
  saveT = setTimeout(async () => {
    if (D.signed && D.signed.application) { $('#saved').textContent = ''; return; }
    try { await call('packetSave', { answers: A }); $('#saved').textContent = 'Saved'; }
    catch (e) { $('#saved').textContent = ''; msg = e.message; const m = $('#msg'); if (m) m.textContent = msg; }
  }, 700);
}
document.addEventListener('input', e => {
  const t = e.target;
  // Typed here only, sent once on Continue, never saved in the browser.
  if (['dob', 'ssn', 'ssn2', 'other_ssn'].includes(t.id)) { local[t.id] = t.value; return; }
  if (t.id === 'signame') { local.signame = t.value; $('#sigline').textContent = t.value; return; }
  if (t.id === 'agree') { local.agree = t.checked; return; }
  if (t.dataset.ini) { (local.ini = local.ini || {})[t.dataset.ini] = t.value.toUpperCase(); t.value = t.value.toUpperCase(); return; }
  if (t.dataset.county) { const c = t.dataset.county; local.counties = t.checked ? [...new Set([...(local.counties || []), c])] : (local.counties || []).filter(x => x !== c); return; }
  if (t.dataset.task) { const n = t.dataset.task; A.tasks = t.checked ? [...new Set([...(A.tasks || []), n])] : (A.tasks || []).filter(x => x !== n); saveSoon(); return; }
  const k = t.dataset.k; if (!k) return;
  set(k, t.type === 'checkbox' ? t.checked : t.value);
  saveSoon();
  if (t.dataset.re || t.tagName === 'SELECT') { msg = ''; render(true); }
});
document.addEventListener('change', async e => {
  if (e.target.id !== 'photo' || !e.target.files.length) return;
  const f = e.target.files[0];
  if (f.size > 15 * 1024 * 1024) { msg = 'That photo is too big. Please choose one under 15 MB.'; render(true); return; }
  const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
  try { await call('uploadMedia', { kind: 'photo', mime: f.type || 'image/jpeg', data }); local.photoDone = true; local.photoUrl = data; msg = ''; }
  catch (err) { msg = err.message; }
  local.about_me = ($('#about_me') || {}).value || local.about_me; local.miles = ($('#miles') || {}).value || local.miles;
  render(true);
});
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-act]'); if (!a || busy) return;
  const act = a.dataset.act, list = screens(), s = list[at];
  if (act === 'addjob') { A.jobs.push({}); render(true); return; }
  if (act === 'addoff') { A.offenses.push({}); render(true); return; }
  if (act === 'addaddr') { A.addrs.push({}); render(true); return; }
  if (act === 'back') { msg = ''; at--; render(); return; }
  if (act === 'orientdone' || act === 'empeondone') {
    try { await call('packetSelf', { what: act === 'orientdone' ? 'orientation' : 'empeon' }); await reload(); } catch (err) { msg = err.message; }
    render(true); return;
  }
  if (act !== 'next') return;
  busy = true; a.disabled = true;
  try {
    clearTimeout(saveT);
    if (!(D.signed && D.signed.application) && s.id !== 'done1') { await call('packetSave', { answers: A }); $('#saved').textContent = 'Saved'; }
    else $('#saved').textContent = '';
    const r = s.check ? s.check() : true;
    if (r !== true) throw new Error(typeof r === 'string' ? r : 'Please finish this screen first.');
    if (s.done) { const m = await s.done(); if (typeof m === 'string') throw new Error(m); }
    msg = '';
    const before = D.step;
    await reload();
    if (D.step !== before) at = startAt(); else at++;
    render();
  } catch (err) {
    // Show the message without redrawing, so nothing typed on the screen is lost.
    msg = err.message; const m = $('#msg');
    if (m) { m.textContent = msg; m.scrollIntoView({ block: 'center' }); } else render(true);
    a.disabled = false;
  }
  busy = false;
});
async function reload() {
  D = await call('packet');
  A = { ...D.answers, ...pick(A) };
  // The caregiver profile they may have started earlier on this link.
  const pr = D.profile || {}, dr = pr.draft || {};
  if (pr.photo) local.photoDone = true;
  if (local.about_me == null && dr.about_me) local.about_me = dr.about_me;
  if (local.counties == null && dr.counties) local.counties = dr.counties;
  if (local.miles == null && dr.travel_miles) local.miles = String(dr.travel_miles);
  if (local.listok == null && pr.consent) local.listok = true;
}
// Where to open: the thank-you screen while checks run, the end once all is done,
// otherwise the first screen (after the welcome once they agreed to e-sign).
const startAt = () => (D.step === 'checks' || D.step === 'done' ? screens().length - 1 : D.step === 1 && D.esign ? 1 : 0);
// Keep what was typed but not yet on the server (lists the user just added rows to).
const pick = o => { const k = {}; for (const x of ['jobs', 'refs', 'offenses', 'addrs']) if (o[x] && o[x].length > ((D.answers || {})[x] || []).length) k[x] = o[x]; return k; };

// ---------- the start screen: the one public link ----------
function startScreen() {
  $('#chip').textContent = 'Application'; $('#bar').hidden = true;
  app.innerHTML = `<section class="card"><h1>Apply to be a CDS attendant</h1>
    <p class="lead">With Caring Companions. It takes about 15 minutes on your phone, and it saves as you go.</p>
    <label class="f" for="consumer">Who will you care for? <span class="opt">(your consumer's full name)</span></label><input id="consumer" type="text">
    <div class="row"><div><label class="f" for="fn">Your first name</label><input id="fn" type="text" autocomplete="given-name"></div><div><label class="f" for="ln">Last name</label><input id="ln" type="text" autocomplete="family-name"></div></div>
    <div class="row"><div><label class="f" for="ph">Your cell phone</label><input id="ph" type="tel" autocomplete="tel"></div><div><label class="f" for="em">Your email</label><input id="em" type="email" autocomplete="email"></div></div>
    <input id="website" type="text" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
    <p class="small">We text you a private link so you can come back to your application any time.</p>
    <div class="err" id="msg"></div>
    <div class="nav"><button class="go" id="startgo">Start my application</button></div></section>`;
  $('#startgo').onclick = async () => {
    const b = $('#startgo'); b.disabled = true;
    try {
      const r = await api('public', 'applyStart', { consumer_name: $('#consumer').value, first_name: $('#fn').value, last_name: $('#ln').value, phone: $('#ph').value, email: $('#em').value, website: $('#website').value });
      if (r.link) { location.href = r.link; return; }
      app.innerHTML = `<section class="card"><h1>Check your texts</h1><div class="ok">${esc(r.message || 'We texted your private link to the phone number we have on file.')}</div></section>`;
    } catch (e) { $('#msg').textContent = e.message; b.disabled = false; }
  };
}

(async () => {
  if (!LINK) return startScreen();
  try { await reload(); at = startAt(); render(); }
  catch (e) { app.innerHTML = `<section class="card"><h1>We could not open your application</h1><p class="lead">${esc(e.message)}</p></section>`; }
})();
