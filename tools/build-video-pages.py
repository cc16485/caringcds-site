# Builds a caringcds.com page for each long CDS YouTube video: the video, a written version, a
# next-step box, chapters and the full transcript (tap to open). Data: videos/data/<id>.json
# (exported by youtube/long/export_for_site.py, plus "youtube_id" once the video is public).
# A page is only built once its video has a youtube_id, unless --preview (then into
# videos/_preview/, which git ignores). Usage: python3 tools/build-video-pages.py [--preview]
import json, os, re, sys, glob, html, datetime as D
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://caringcds.com'
PREVIEW = '--preview' in sys.argv
TEMPLATE = open(os.path.join(ROOT, 'how-it-works', 'index.html'), encoding='utf-8').read()
TOP = TEMPLATE[:TEMPLATE.index('</header>') + len('</header>')]
BOTTOM = TEMPLATE[TEMPLATE.index('<footer'):]
E = lambda s: html.escape(s or '', quote=True)
NAVY, TEAL, INK, MUTED = '#14304d', '#0f7a7c', '#4c463c', '#6b6358'
P = lambda s: '<p style="margin-top: 14px; font-size: 18px; line-height: 1.7; color: %s;">%s</p>' % (INK, E(s))
H2 = lambda s, i: '<h2 id="%s" style="margin-top: 40px; font-size: clamp(24px, 2.4vw, 30px); line-height: 1.2; color: %s;">%s</h2>' % (i, NAVY, E(s))
NUMBERED = r'(Sign|Step|Tip|Way|Level|Room|Checklist|Topic) \d+( of \d+)?$'
def slug(s): return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', s.lower().replace("'", ''))).strip('-')
def drop_self_intro(t): return re.sub(r"\s*I'm Samantha with Caring Companions[^.]*\.", '', t).strip()
def body_of(p):
    t = drop_self_intro(p['text']); first, _, rest = t.partition('. ')
    if rest and p.get('head') and p['head'].lower().rstrip('.') in first.lower(): t = rest
    return t
def when_of(v):
    w = D.datetime.fromisoformat(v['publish'].replace('Z', '+00:00')).astimezone(D.timezone(D.timedelta(hours=-6)))
    return w.strftime('%B %-d, %Y'), w.date().isoformat()
def head_meta(page, title, desc, url, image):
    for a, b in [(r'<title>.*?</title>', '<title>%s</title>' % E(title)), (r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="%s">' % url),
                 (r'<meta name="description" content="[^"]*">', '<meta name="description" content="%s">' % E(desc)),
                 (r'<meta property="og:url" content="[^"]*">', '<meta property="og:url" content="%s">' % url),
                 (r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="%s">' % E(title)),
                 (r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="%s">' % E(desc)),
                 (r'<meta property="og:image" content="[^"]*">', '<meta property="og:image" content="%s">' % image)]:
        page = re.sub(a, lambda m: b, page, count=1)
    return re.sub(r'<script type="application/ld\+json"[^>]*>.*?</script>\s*', '', page, flags=re.S)
def build(v):
    datestr, iso = when_of(v); s = slug(v['short_title']); url = '%s/videos/%s/' % (SITE, s)
    thumb = '%s/assets/videos/thumbs/%s.jpg' % (SITE, v['id'])
    parts = [p for p in v['parts'] if p.get('chip')]
    secs = []
    for i, p in enumerate(parts[1:], 1):
        head = (p['chip'] + ': ' + p['head']) if re.match(NUMBERED, p['chip'] or '') else p['head']
        secs.append(H2(head, 's%d' % i) + P(body_of(p)))
    transcript = ' '.join(drop_self_intro(p['text']) if i else p['text'] for i, p in enumerate(v['parts']))
    yt = v.get('youtube_id')
    media = (('<div style="position: relative; padding-top: 56.25%%; border-radius: 6px; overflow: hidden; background: %s;"><iframe src="https://www.youtube-nocookie.com/embed/%s" title="%s" loading="lazy" '
              'allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position: absolute; inset: 0; width: 100%%; height: 100%%; border: 0;"></iframe></div>') % (NAVY, E(yt), E(v['title']))
             if yt else ('<figure style="margin: 0;"><img src="/assets/videos/thumbs/%s.jpg" alt="%s" width="1280" height="720" style="width: 100%%; height: auto; border-radius: 6px; display: block;">'
                         '<figcaption style="font-size: 14px; color: %s; margin-top: 8px;">Preview only: the video goes live on YouTube on %s.</figcaption></figure>') % (v['id'], E(v['title']), MUTED, datestr))
    chapters = ''.join('<li><strong>%s</strong> %s</li>' % (E(t), E(n)) for t, n in v['chapters'])
    det = '<details style="border: 1px solid #e4ddd1; border-radius: 6px; padding: 16px 18px; margin-top: 14px; background: #fff;"><summary style="cursor: pointer; font-weight: 600; color: %s;">%s</summary>%s</details>'
    main = ('<main style="max-width: 860px; margin: 0 auto; padding: 48px 20px 80px;">'
            '<p style="font-size: 14px;"><a href="/videos/">Videos</a> &rsaquo; <span style="color: %s;">%s</span></p>'
            '<p style="margin-top: 22px; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: %s; font-weight: 700;">Video</p>'
            '<h1 style="margin-top: 14px; font-size: clamp(32px, 3.6vw, 46px); line-height: 1.1; color: %s;">%s</h1>'
            '<p style="margin-top: 14px; font-size: 15px; color: %s;">By Samantha Troutman, owner of Caring Companions CDS &middot; %s</p>'
            '<div style="margin-top: 28px;">%s</div>%s%s'
            '<div style="margin-top: 40px; background: #eaf4f6; border: 1px solid #d6e7ea; border-radius: 6px; padding: 22px;">'
            '<p style="font-family: Newsreader, Georgia, serif; font-size: 24px; color: %s;">%s</p>'
            '<p style="margin-top: 8px; font-size: 17px; line-height: 1.6; color: %s;">Call <a href="tel:+14172182888" style="font-weight: 600;">417-218-2888</a>, toll free 866-863-5151, Monday to Friday 9am to 4pm. We serve 27 Southwest Missouri counties.</p>'
            '<a href="/check/" style="display: inline-block; margin-top: 14px; background: %s; color: #fff; border-radius: 999px; padding: 12px 22px; font-weight: 600; text-decoration: none;">Check if you qualify</a></div>') % (MUTED, E(v['short_title'][:1].upper() + v['short_title'][1:]), TEAL, NAVY, E(v['title']), MUTED, datestr, media,
                            P(drop_self_intro(parts[0]['text'])), '\n'.join(secs), NAVY, E(v.get('end') or 'Questions? We are here to help.'), INK, NAVY)
    main += (det % (NAVY, 'Chapters', '<ul style="margin-top: 12px; padding-left: 18px; line-height: 1.9; color: %s; list-style: disc;">%s</ul>' % (INK, chapters))
             + det % (NAVY, 'Read the full transcript', '<p style="margin-top: 12px; font-size: 17px; line-height: 1.7; color: %s;">%s</p>' % (INK, E(transcript))) + '</main>')
    desc = v['description'] if len(v['description']) <= 158 else v['description'][:155].rsplit(' ', 1)[0]
    page = head_meta(TOP, v['short_title'][:1].upper() + v['short_title'][1:] + ' | Caring Companions CDS', desc, url, thumb) + '\n' + main + '\n' + BOTTOM
    graph = [{'@type': 'Article', 'headline': v['title'][:110], 'datePublished': iso, 'image': thumb, 'mainEntityOfPage': url,
              'author': {'@type': 'Person', 'name': 'Samantha Troutman', 'jobTitle': 'Owner'},
              'publisher': {'@type': 'Organization', 'name': 'Caring Companions Consumer Directed Services', 'url': SITE + '/'}}]
    if yt: graph.append({'@type': 'VideoObject', 'name': v['title'], 'description': v['description'], 'uploadDate': iso, 'thumbnailUrl': thumb,
                         'embedUrl': 'https://www.youtube.com/embed/' + yt, 'contentUrl': 'https://www.youtube.com/watch?v=' + yt})
    page = page.replace('</head>', '<script type="application/ld+json">%s</script>\n</head>' % json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, separators=(',', ':')), 1)
    d = os.path.join(ROOT, 'videos', '_preview', s) if (PREVIEW and not yt) else os.path.join(ROOT, 'videos', s)
    os.makedirs(d, exist_ok=True); open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(page)
    return d, {'title': v['title'], 'url': '/videos/%s/' % s, 'date': iso, 'datestr': datestr, 'thumb': '/assets/videos/thumbs/%s.jpg' % v['id'], 'desc': desc, 'live': bool(yt)}
def index(items, preview):
    items = sorted(items, key=lambda x: x['date'], reverse=True)
    cards = ''.join('<a href="%s" style="display: block; background: #fff; border: 1px solid #e4ddd1; border-radius: 6px; overflow: hidden; text-decoration: none; color: inherit;">'
                    '<img src="%s" alt="" width="1280" height="720" loading="lazy" style="width: 100%%; height: auto; display: block;">'
                    '<div style="padding: 16px 18px;"><p style="font-size: 13px; color: %s;">%s</p>'
                    '<p style="margin-top: 6px; font-family: Newsreader, Georgia, serif; font-size: 21px; line-height: 1.25; color: %s;">%s</p>'
                    '<p style="margin-top: 8px; font-size: 15px; line-height: 1.6; color: %s;">%s</p></div></a>' % (i['url'], i['thumb'], MUTED, i['datestr'], NAVY, E(i['title']), INK, E(i['desc'])) for i in items)
    main = ('<main style="max-width: 1160px; margin: 0 auto; padding: 48px 20px 80px;">'
            '<p style="font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: %s; font-weight: 700;">Videos</p>'
            '<h1 style="margin-top: 14px; font-size: clamp(32px, 3.6vw, 46px); line-height: 1.1; color: %s;">Missouri CDS, explained</h1>'
            '<p style="margin-top: 14px; font-size: 18px; line-height: 1.65; color: %s; max-width: 62ch;">Short videos on how Consumer Directed Services works, who can be a paid caregiver, pay and the rules that protect you. Each one has a written version and the full transcript.</p>'
            '<div style="margin-top: 32px; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px;">%s</div></main>') % (TEAL, NAVY, INK, cards)
    page = head_meta(TOP, 'Videos | Caring Companions CDS', 'Short videos on Missouri Consumer Directed Services: how it works, who can be a paid caregiver, pay and the rules, each with a written version.',
                     SITE + '/videos/', SITE + '/assets/logo.png') + '\n' + main + '\n' + BOTTOM
    d = os.path.join(ROOT, 'videos', '_preview') if preview else os.path.join(ROOT, 'videos')
    os.makedirs(d, exist_ok=True); open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(page); return d
built = []
for f in sorted(glob.glob(os.path.join(ROOT, 'videos', 'data', '*.json'))):
    for v in json.load(open(f, encoding='utf-8')):
        if v.get('youtube_id') or PREVIEW:
            out, item = build(v); built.append(item); print('built', out)
        else: print('waiting for video', v['id'], v['publish'])
live = [i for i in built if i['live']]
if live: print('index', index(live, False))
if PREVIEW and built: print('preview index', index(built, True))
