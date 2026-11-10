# Adds a "Videos" link to the site menus once /videos/ exists (run by the video-page automation the day the
# first CDS video goes public; safe to run again, it skips pages that already have it).
# Where: the "Receive care" and "Become a caregiver" dropdowns (desktop and phone menus) and the footer.
#   python3 tools/add-videos-nav.py            (only does anything when videos/index.html exists)
#   python3 tools/add-videos-nav.py --force    (for a preview)
import glob, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if not (os.path.exists(os.path.join(ROOT, 'videos', 'index.html')) or '--force' in sys.argv):
    print('no /videos/ page yet; nothing to do'); sys.exit(0)
# last link of a dropdown section: followed by the next section heading, or by the end of the dropdown
MENU = re.compile(r'(<a class="hv1" href="/(?:caregiver-rules|caregiver-list)/"[^>]*>(?:Who can be the caregiver|Join the caregiver list)</a>)(?=\s*(?:<span style="margin-top: 10px|</div>\s*</details>))')
FOOT = re.compile(r'(<li><a class="hv9" href="/caregiver-list/"[^>]*>Join the caregiver list</a></li>)')
n = 0
for f in glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True):
    if '/_preview/' in f or '/.git/' in f: continue
    t = open(f, encoding='utf-8').read()
    if 'href="/videos/"' in t and '>Videos</a>' in t: continue
    u = MENU.sub(lambda m: m.group(1) + '\n          ' + re.sub(r'href="[^"]*"', 'href="/videos/"', re.sub(r'>[^<]*</a>$', '>Videos</a>', m.group(1)), 1), t)
    u = FOOT.sub(lambda m: m.group(1) + '\n            <li>' + re.sub(r'href="[^"]*"', 'href="/videos/"', re.sub(r'>[^<]*</a></li>$', '>Videos</a></li>', m.group(1)[4:]), 1), u)
    if u != t:
        open(f, 'w', encoding='utf-8').write(u); n += 1
print('added Videos to the menus on %d pages' % n)
