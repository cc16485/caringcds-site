// assets/visit.js (2026-11-09): run `node tests/visit-counter-test.js`
const fs = require('fs'), vm = require('vm');
const src = fs.readFileSync(__dirname + '/../assets/visit.js', 'utf8');
let p = 0, f = 0; const ok = (n, c) => { if (c) p++; else { f++; console.log('FAIL', n); } };
function run(url, referrer, store) {
  const sent = [], u = new URL(url); store = store || {};
  const listeners = [];
  const ctx = { location: { hostname: u.hostname, pathname: u.pathname, search: u.search }, document: { referrer, addEventListener: (k, fn) => listeners.push(fn) },
    sessionStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } },
    fetch: (to, o) => { sent.push({ to, body: JSON.parse(o.body), h: o.headers }); return { catch() {} }; }, URL, URLSearchParams, JSON, Math, Date, String };
  ctx.window = ctx; vm.runInNewContext(src, ctx); return { sent, listeners };
}
let r = run('https://caringcds.com/start/?utm_source=facebook&utm_campaign=get_paid_to_care', 'https://m.facebook.com/');
ok('one page view', r.sent.length === 1 && r.sent[0].body.event === 'page_view');
ok('goes to the CDS database', r.sent[0].to === 'https://siivpekcaryeyttszwav.supabase.co/rest/v1/site_events');
ok('utm_source becomes the tag', r.sent[0].body.from_tag === 'facebook');
ok('came from site name only', r.sent[0].body.came_from === 'm.facebook.com');
ok('path kept, no query string', r.sent[0].body.path === '/start/');
ok('no personal fields', Object.keys(r.sent[0].body).sort().join() === 'came_from,event,from_tag,path,session_id');
r.listeners[0]({ target: { closest: s => s === 'a[href^="tel:"]' ? {} : null } });
ok('phone tap counted', r.sent[1] && r.sent[1].body.event === 'call_click');
ok('own site is not a source', run('https://www.caringcds.com/faq/', 'https://caringcds.com/').sent[0].body.came_from === null);
const st = {}; const a = run('https://caringcds.com/', '', st).sent[0].body.session_id, b = run('https://caringcds.com/faq/', '', st).sent[0].body.session_id;
ok('same tab keeps its id', a === b);
ok('previews never count', run('https://cc16485.github.io/caringcds-site/', '').sent.length === 0 && run('http://localhost:8000/', '').sent.length === 0);
ok('no em dash', !src.includes('—'));
console.log(p + ' passed, ' + f + ' failed'); process.exit(f ? 1 : 0);
