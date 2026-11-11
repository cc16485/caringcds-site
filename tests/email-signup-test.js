// assets/email-signup.js + /unsubscribe/ (2026-11-11): run `node tests/email-signup-test.js`
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../assets/email-signup.js', 'utf8');
const un = fs.readFileSync(__dirname + '/../unsubscribe/index.html', 'utf8');
let p = 0, f = 0; const ok = (n, c) => { if (c) p++; else { f++; console.log('FAIL', n); } };
const PAGES = eval(src.match(/var PAGES = (\/.*\/);/)[1]);
for (const x of ['/', '/getting-paid/', '/how-it-works/', '/consumers/', '/check/', '/service-area/', '/greene-county/', '/st-clair-county/'])
  ok('shows on ' + x, PAGES.test(x));
for (const x of ['/apply/', '/enroll/', '/sign/', '/attendants/', '/caregiver-list/', '/start/', '/thank-you/', '/unsubscribe/', '/training/attendant-orientation/', '/privacy/'])
  ok('never on ' + x, !PAGES.test(x));
ok('only first name, email and page are sent', /JSON\.stringify\(\{ first_name: [^}]*, email: [^}]*, page: path\(\) \}\)/.test(src));
ok('writes to the sign-up list only', (src.match(/rest\/v1\/[a-z_]+/g) || []).join() === 'rest/v1/cds_email_signups');
ok('leaves people out of the Facebook ads after signing up', /CDSFb\)\) ?window\.CDSFb\.markSent\(\)|CDSFb\) window\.CDSFb\.markSent\(\)/.test(src));
ok('not counted as a lead in Google', !/CDSGa/.test(src));
ok('the email typed is shown as text, never as HTML', /querySelector\('span'\)\.textContent = email/.test(src));
ok('her small print', src.includes('4 short emails over about 2 weeks, then we stop. Unsubscribe any time.'));
ok('unsubscribe page is noindex', /noindex/.test(un));
ok('unsubscribe page calls only the unsubscribe function', (un.match(/rest\/v1\/[a-z_/]+/g) || []).join() === 'rest/v1/rpc/cds_email_unsubscribe');
ok('unsubscribe page has no tracking', !/fb\.js|ga\.js|gtag|fbq/.test(un));
ok('no em dashes', !src.includes('—') && !un.includes('—'));
console.log(p + ' passed, ' + f + ' failed'); process.exit(f ? 1 : 0);
