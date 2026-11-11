// assets/fb.js (2026-11-11): run `node tests/fb-pixel-test.js`
const fs = require('fs'), vm = require('vm');
const src = fs.readFileSync(__dirname + '/../assets/fb.js', 'utf8');
const ID = (src.match(/PIXEL_ID = '(\d*)'/) || [])[1];
let p = 0, f = 0; const ok = (n, c) => { if (c) p++; else { f++; console.log('FAIL', n); } };
function run(url, code) {
  const u = new URL(url), scripts = [], frames = [];
  const doc = {
    createElement: k => ({ tag: k, style: {}, setAttribute() {} }),
    getElementsByTagName: () => [{ parentNode: { insertBefore: el => scripts.push(el.src) } }],
    body: { appendChild: el => frames.push(el) }
  };
  const ctx = { location: { hostname: u.hostname, pathname: u.pathname }, document: doc };
  ctx.window = ctx;
  vm.runInNewContext(code || src, ctx);
  const calls = ctx.fbq ? ctx.fbq.queue.map(a => Array.from(a)) : [];
  return { ctx, scripts, frames, calls };
}
const withId = src.replace(/PIXEL_ID = '\d*'/, "PIXEL_ID = '123456'");
let r = run('https://caringcds.com/start/', withId);
ok('loads Meta script on live public page', r.scripts[0] === 'https://connect.facebook.net/en_US/fbevents.js');
ok('autoConfig off before init', JSON.stringify(r.calls[0]) === JSON.stringify(['set', 'autoConfig', false, '123456']));
ok('init then PageView only', r.calls[1][0] === 'init' && JSON.stringify(r.calls[2]) === '["track","PageView"]' && r.calls.length === 3);
for (const path of ['/apply/', '/enroll/', '/sign/', '/consumer-orientation/', '/attendant-orientation/', '/training/attendant-orientation/'])
  ok('never on private page ' + path, run('https://caringcds.com' + path, withId).scripts.length === 0);
ok('www counts as live', run('https://www.caringcds.com/', withId).scripts.length === 1);
ok('previews never load it', run('https://cc16485.github.io/caringcds-site/', withId).scripts.length === 0 && run('http://localhost:8000/', withId).scripts.length === 0);
ok('no pixel without an id', run('https://caringcds.com/', src.replace(/PIXEL_ID = '\d*'/, "PIXEL_ID = ''")).scripts.length === 0);
r.ctx.CDSFb.markSent(); r.ctx.CDSFb.markSent();
ok('markSent adds one hidden thank-you frame', r.frames.length === 1 && r.frames[0].src === '/thank-you/?from=form' && /visibility:hidden/.test(r.frames[0].style.cssText));
ok('markSent works even off the live site', (() => { const x = run('http://localhost:8000/'); x.ctx.CDSFb.markSent(); return x.frames.length === 1; })());
ok('real pixel id is set', /^\d{10,20}$/.test(ID || ''));
ok('no em dash', !src.includes('—'));
console.log(p + ' passed, ' + f + ' failed'); process.exit(f ? 1 : 0);
