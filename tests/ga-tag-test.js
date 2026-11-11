// assets/ga.js (2026-11-11): run `node tests/ga-tag-test.js`
const fs = require('fs'), vm = require('vm');
const src = fs.readFileSync(__dirname + '/../assets/ga.js', 'utf8');
let p = 0, f = 0; const ok = (n, c) => { if (c) p++; else { f++; console.log('FAIL', n); } };
function run(url, referrer, code) {
  const u = new URL(url), scripts = [], listeners = [];
  const doc = {
    referrer: referrer || '',
    createElement: k => ({ tag: k }),
    head: { appendChild: el => scripts.push(el.src) },
    addEventListener: (t, fn) => listeners.push([t, fn])
  };
  const ctx = { location: { hostname: u.hostname, pathname: u.pathname, href: u.href }, document: doc, URL, Date, String, encodeURIComponent };
  ctx.window = ctx;
  vm.runInNewContext(code || src, ctx);
  const calls = () => (ctx.dataLayer || []).map(a => Array.from(a));
  return { ctx, scripts, listeners, calls };
}
const tap = (r, href) => r.listeners.filter(l => l[0] === 'click').forEach(l => l[1]({ target: { closest: s => (s === 'a[href^="tel:"]' && href.startsWith('tel:')) ? { href } : null } }));

// Google's tag reads the real address itself, so a page whose address carries a lead link code must not load it at all.
let k = run('https://caringcds.com/start/?utm_campaign=x&k=SECRETLEADKEY1234567890');
ok('no Google tag when the address has a lead link code', k.scripts.length === 0 && !k.ctx.dataLayer);
k = run('https://caringcds.com/how-it-works/', 'https://caringcds.com/start/?k=SECRETOTHER1234567890123');
ok('no Google tag when coming from a caringcds.com page with a link code', k.scripts.length === 0);
ok('outside referrers with their own codes are fine', run('https://caringcds.com/', 'https://www.google.com/search?q=cds').scripts.length === 1);
let r = run('https://caringcds.com/start/?utm_campaign=x&gclid=abc', 'https://caringcds.com/how-it-works/?utm_source=fb');
ok('loads the Google tag on a live public page', r.scripts[0] === 'https://www.googletagmanager.com/gtag/js?id=G-71L1VY58Q4');
const cfg = r.calls().find(c => c[0] === 'config');
ok('config uses the CDS measurement id', cfg && cfg[1] === 'G-71L1VY58Q4');
ok('ad codes are kept', cfg[2].page_location === 'https://caringcds.com/start/?utm_campaign=x&gclid=abc');
ok('clean() drops everything but ad codes', r.ctx.CDSGa.clean('https://caringcds.com/start/?k=SECRET&utm_source=a') === 'https://caringcds.com/start/?utm_source=a');
ok('Google signals and ad personalization off', cfg[2].allow_google_signals === false && cfg[2].allow_ad_personalization_signals === false);
r.ctx.CDSGa.lead('caringcds greene-county');
let ev = r.calls().filter(c => c[0] === 'event');
ok('sent form is lead_submitted with a plain name', JSON.stringify(ev[ev.length - 1]) === '["event","lead_submitted",{"form":"area"}]');
const names = { 'caringcds contact': 'contact', 'caringcds consumers': 'consumer', 'caringcds consumers switch': 'consumer', 'caringcds attendants switch': 'caregiver',
  'caringcds eligibility wizard': 'check', 'caringcds home': 'home', 'caringcds service-area': 'area', caregiver_list: 'caregiver_list', start: 'start', 'my mom has dementia': 'contact' };
for (const k in names) ok('form name ' + k, r.ctx.CDSGa.formName(k) === names[k]);
tap(r, 'tel:+14172182888');
ev = r.calls().filter(c => c[0] === 'event');
ok('phone tap is call_click', JSON.stringify(ev[ev.length - 1]) === '["event","call_click"]');
const before = r.calls().length; tap(r, 'https://caringcds.com/contact/');
ok('other links send nothing', r.calls().length === before);
for (const path of ['/apply/', '/enroll/', '/sign/', '/consumer-orientation/', '/attendant-orientation/', '/training/x/', '/thank-you/']) {
  const x = run('https://caringcds.com' + path);
  x.ctx.CDSGa.lead('caringcds contact');
  ok('never on private page ' + path, x.scripts.length === 0 && !x.ctx.dataLayer);
}
ok('www counts as live', run('https://www.caringcds.com/').scripts.length === 1);
ok('previews never load it', run('https://cc16485.github.io/caringcds-site/').scripts.length === 0 && run('http://localhost:8000/').scripts.length === 0);
ok('loading twice does nothing more', (() => { const x = run('https://caringcds.com/'); vm.runInNewContext(src, x.ctx); return x.scripts.length === 1; })());
const site = fs.readFileSync(__dirname + '/../assets/site.js', 'utf8'), start = fs.readFileSync(__dirname + '/../start/index.html', 'utf8');
ok('site.js loads ga.js and reports sent forms', site.includes("/assets/ga.js?v=2") && site.includes('CDSGa.lead('));
ok('/start loads ga.js and reports a sent form', start.includes('/assets/ga.js?v=2') && start.includes("CDSGa.lead('start')"));
for (const pg of ['apply', 'enroll', 'sign', 'consumer-orientation', 'attendant-orientation'])
  ok('private page has no ga.js: ' + pg, !fs.readFileSync(__dirname + '/../' + pg + '/index.html', 'utf8').includes('ga.js'));
ok('privacy page names Google Analytics', fs.readFileSync(__dirname + '/../privacy/index.html', 'utf8').includes('Google Analytics'));
ok('no em dash', !src.includes('—'));
console.log(p + ' passed, ' + f + ' failed'); process.exit(f ? 1 : 0);
