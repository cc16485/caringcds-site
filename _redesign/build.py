#!/usr/bin/env python3
"""Build the caringcds.com site from the redesign prototypes.

The prototypes in prototypes/ are design references written against a small
template runtime ({{ holes }}, <sc-if>, <sc-for>, style-hover attributes).
Per the handoff README that runtime is not shipped; this script renders each
prototype to plain static HTML at its real URL, rewrites the cross links,
turns style-hover/style-focus into CSS classes, and wires the forms to the
same Supabase site_leads pipeline the previous site used (assets/site.js).

Run from the repo root:  python3 _redesign/build.py
"""
import json, os, re, sys, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "_redesign", "prototypes")

COUNTIES = ["Barry","Barton","Benton","Camden","Cedar","Christian","Dade","Dallas",
            "Douglas","Greene","Hickory","Jasper","Laclede","Lawrence","McDonald",
            "Newton","Ozark","Phelps","Polk","Pulaski","St. Clair","Stone","Taney",
            "Texas","Vernon","Webster","Wright"]

def county_slug(name):
    return re.sub(r"[^a-z]+", "-", name.lower()).strip("-") + "-county"

# dc filename (without .dc.html) -> site path ('' = homepage)
URLMAP = {
    "Caring Companions Home": "",
    "Receive Care": "consumers",
    "Become a Caregiver": "attendants",
    "How It Works": "how-it-works",
    "Check My Eligibility": "check",
    "Caregiver Pay": "caregiver-pay",
    "Pay Calculator": "pay-calculator",
    "Caregiver List": "caregiver-list",
    "Who Can Be The Caregiver": "caregiver-rules",
    "Employer Setup": "employer-setup",
    "Orienting Your Attendant": "orientation",
    "Clocking In And Out": "evv",
    "Consumer Orientation": "training",
    "Attendant Orientation": "training/attendant-orientation",
    "Service Area": "service-area",
    "Contact": "contact",
    "EVV": "evv",  # stray link target in one prototype
}
for c in COUNTIES:
    URLMAP[c + " County"] = county_slug(c)

def url_for(dc_name, anchor=""):
    path = URLMAP[dc_name]
    return ("/" if path == "" else "/" + path + "/") + anchor

TITLES = {
    "": ("Get Paid to Care for a Loved One | Missouri CDS | Caring Companions",
         "Missouri Medicaid pays the caregiver you choose - even family. Caring Companions Consumer Directed Services serves 27 Southwest Missouri counties. Call 417-218-2888."),
    "consumers": ("Receive Care at Home Through Missouri CDS | Caring Companions",
         "Choose your own caregiver and Missouri Medicaid pays them. How Consumer Directed Services works for the person receiving care, and how to get started."),
    "attendants": ("Become a Paid Caregiver in Missouri CDS | Caring Companions",
         "Get paid $15.00 an hour to care for a family member or friend on Missouri Medicaid. How to become a CDS caregiver with Caring Companions."),
    "how-it-works": ("How Missouri CDS Works, Start to Finish | Caring Companions",
         "The full journey from first call to first shift: Medicaid, the state assessment, employer setup, hiring your caregiver, and clocking in."),
    "check": ("Check If You Qualify for Missouri CDS | Caring Companions",
         "Four quick questions to see whether Consumer Directed Services fits your situation. No cost, no obligation."),
    "caregiver-pay": ("How CDS Caregivers Get Paid | Caring Companions",
         "The $15.00 hourly rate, the Sunday-to-Saturday pay week, Thursday payday, direct deposit or pay card, and the answers to the usual pay questions."),
    "pay-calculator": ("CDS Caregiver Pay Calculator | Caring Companions",
         "See what a CDS caregiver earns weekly, monthly and yearly at $15.00 an hour based on hours per week."),
    "caregiver-list": ("Join Our Caregiver List | Caring Companions CDS",
         "Want paid caregiving work but don't have a consumer yet? Join the list and we introduce you to Medicaid consumers looking for a caregiver in your county."),
    "caregiver-rules": ("Who Can Be Your Paid Caregiver in Missouri CDS | Caring Companions",
         "Family, friends and neighbors can be paid CDS caregivers. Spouses and legal guardians cannot. The full rules, in plain language."),
    "employer-setup": ("Becoming the Employer in CDS | Caring Companions",
         "In CDS you are the employer. The EIN, the Missouri employer number, IRS Form 2678 and the weekly routine - and how we handle the setup with you."),
    "orientation": ("Orienting Your Attendant: The 8 Required Topics | Caring Companions CDS",
         "Missouri requires CDS consumers to orient their attendant on eight topics. Here they are in plain terms, and how we help you do it."),
    "evv": ("Clocking In and Out (EVV) | Caring Companions CDS",
         "How electronic visit verification works in CDS: the WellSky app, the home phone option, and what to do when a clock-in is missed."),
    "training": ("CDS Training and Resources | Caring Companions",
         "Orientation videos, the handbook and the pay schedule, all in one place for Caring Companions CDS consumers and attendants."),
    "training/attendant-orientation": ("Attendant Orientation | Caring Companions CDS",
         "The eight orientation modules every CDS attendant completes - public, free, no login. Watch before you are hired if you like."),
    "service-area": ("Our Service Area: 27 Southwest Missouri Counties | Caring Companions CDS",
         "Caring Companions Consumer Directed Services covers 27 counties across Southwest Missouri from our Springfield office."),
    "contact": ("Contact Caring Companions CDS | Springfield, Missouri",
         "Call 417-218-2888, toll free 866-863-5151, Monday to Friday 9am-4pm. 1331 N Stewart Ave, Springfield, MO 65802."),
}
for c in COUNTIES:
    TITLES[county_slug(c)] = (
        f"CDS in {c} County, Missouri | Caring Companions",
        f"Consumer Directed Services in {c} County: choose your own caregiver and Missouri Medicaid pays them. Local support from our Springfield office.")

FOOTER_LINKS = [
    ("/check/", "Check if you qualify"),
    ("/how-it-works/", "How CDS works, start to finish"),
    ("/caregiver-rules/", "Who can be the caregiver"),
    ("/employer-setup/", "Employer setup guide"),
    ("/orientation/", "Orienting your attendant"),
    ("/evv/", "Clocking in and out (EVV)"),
    ("https://hub.caringcds.com/evv-form", "EVV correction form"),
    ("/caregiver-pay/", "How caregivers get paid"),
    ("/pay-calculator/", "Caregiver pay calculator"),
    ("/consumers/", "Receive care"),
    ("/attendants/", "Become a caregiver"),
    ("/caregiver-list/", "Join the caregiver list"),
    ("/service-area/", "Service area"),
    ("/contact/", "Contact us"),
]

class Wrap:
    """sc-if whose content is kept but rendered hidden (for thank-you panels)."""
    def __init__(self, attrs): self.attrs = attrs

def base_vals():
    return {
        "counties": COUNTIES,
        "links": [{"href": h, "label": l} for h, l in FOOTER_LINKS],
        "countyLine": " · ".join(COUNTIES),
        "countyLinks": [{"name": c + " County", "href": "/" + county_slug(c) + "/"} for c in COUNTIES],
        "faqFirstOpen": True,
        "showHeroPhoto": True,
        "submitted": Wrap('data-thanks="main"'),
        "notSubmitted": True,
        "switchSent": Wrap('data-thanks="switch"'),
        "switchNotSent": True,
        "true": True,
        "false": False,
    }

SC_INNER = re.compile(r"<sc-(if|for)\b([^>]*)>((?:(?!<sc-)(?!</sc-).)*?)</sc-\1>", re.S)
HOLE = re.compile(r"\{\{\s*([A-Za-z_][\w.]*)\s*\}\}")

def lookup(vals, name):
    cur = vals
    for part in name.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return None
    return cur

def sub_holes(text, vals):
    def rep(m):
        v = lookup(vals, m.group(1))
        if v is None: return m.group(0)
        if isinstance(v, bool): return "True" if v else "False"
        return str(v)
    return HOLE.sub(rep, text)

def expand(tmpl, vals):
    out = tmpl
    for _ in range(200):
        m = SC_INNER.search(out)
        if not m: break
        kind, attrs, body = m.group(1), m.group(2), m.group(3)
        if kind == "if":
            vm = re.search(r'value="\{\{\s*([\w.]+)\s*\}\}"', attrs)
            v = lookup(vals, vm.group(1)) if vm else None
            if isinstance(v, Wrap):
                rep = f"<div hidden {v.attrs}>" + body + "</div>"
            elif v:
                rep = body
            else:
                rep = ""
        else:  # sc-for
            lm = re.search(r'list="\{\{\s*([\w.]+)\s*\}\}"', attrs)
            am = re.search(r'as="(\w+)"', attrs)
            items = lookup(vals, lm.group(1)) or []
            name = am.group(1)
            parts = []
            for item in items:
                sub = dict(vals)
                sub[name] = item
                parts.append(sub_holes(body, sub) if not isinstance(item, dict)
                             else sub_holes(body, {**vals, name: item}))
            rep = "".join(parts)
        out = out[:m.start()] + rep + out[m.end():]
    return sub_holes(out, vals)

def post_process(body, page_path):
    # handler holes resolved to attributes: value beginning '@' was substituted in
    body = re.sub(r'\son[A-Za-z]+="@([^"]*)"', lambda m: " " + m.group(1), body)
    # unresolved handler holes -> drop
    body = re.sub(r'\son[A-Za-z]+="\{\{[^"]*\}\}"', "", body)
    # boolean attributes
    body = re.sub(r'\s(required|open|checked|disabled)="True"', r" \1", body)
    body = re.sub(r'\s(required|open|checked|disabled)="False"', "", body)
    # style-hover / style-focus -> classes
    hovers, focuses = {}, {}
    def cls_for(store, prefix, style):
        if style not in store: store[style] = f"{prefix}{len(store)+1}"
        return store[style]
    def hov(m):
        return class_inject(m.group(0), cls_for(hovers, "hv", m.group(1)), 'style-hover="' + m.group(1) + '"')
    def foc(m):
        return class_inject(m.group(0), cls_for(focuses, "fc", m.group(1)), 'style-focus="' + m.group(1) + '"')
    def class_inject(tag, cls, attr_text):
        tag = tag.replace(" " + attr_text, "")
        cm = re.search(r'class="([^"]*)"', tag)
        if cm:
            return tag[:cm.start(1)] + cm.group(1) + " " + cls + tag[cm.end(1):]
        return re.sub(r"^<(\w+)", r'<\1 class="' + cls + '"', tag)
    body = re.sub(r'<[^>]*\sstyle-hover="([^"]*)"[^>]*>', hov, body)
    body = re.sub(r'<[^>]*\sstyle-focus="([^"]*)"[^>]*>', foc, body)
    css = []
    for style, cls in hovers.items():
        rules = "".join(p.strip() + " !important;" for p in style.split(";") if p.strip())
        css.append(f".{cls}:hover{{{rules}}}")
    for style, cls in focuses.items():
        rules = "".join(p.strip() + " !important;" for p in style.split(";") if p.strip())
        css.append(f".{cls}:focus{{{rules}}}")
    # rewrite prototype hrefs to real urls
    def href(m):
        name, anchor = m.group(1), m.group(2) or ""
        if name not in URLMAP: raise KeyError("unmapped link: " + name)
        return 'href="' + url_for(name, anchor) + '"'
    body = re.sub(r'href="([^"#]+)\.dc\.html(#[^"]*)?"', href, body)
    body = body.replace('src="assets/logo.png"', 'src="/assets/logo.png"')
    # the mobile call bar "Am I eligible?" anchor: keep #eligibility only when present
    if 'id="eligibility"' not in body:
        body = body.replace(
            '<a href="#eligibility" style="flex: 1; text-align: center; background: #ffffff;',
            '<a href="/check/" style="flex: 1; text-align: center; background: #ffffff;')
    return body, "\n".join(css)

BASE_CSS = None
def get_base_css():
    global BASE_CSS
    if BASE_CSS is None:
        s = open(os.path.join(SRC, "Caring Companions Home.dc.html")).read()
        BASE_CSS = re.search(r"<style>(.*?)</style>", s, re.S).group(1)
    return BASE_CSS

def page_body(dc_name):
    s = open(os.path.join(SRC, dc_name + ".dc.html")).read()
    return re.search(r"<x-dc>(.*)</x-dc>", s, re.S).group(1)

DOC = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://caringcds.com{canon}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://caringcds.com{canon}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="https://caringcds.com/assets/logo.png">
<meta name="theme-color" content="#0e3860">
<link rel="icon" href="/assets/icon-192.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Public+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>{css}</style>
</head>
<body>
{body}
{scripts}
</body>
</html>
"""

def write_page(path, title, desc, body, extra_css="", scripts=""):
    canon = "/" if path == "" else "/" + path + "/"
    out_dir = ROOT if path == "" else os.path.join(ROOT, path)
    os.makedirs(out_dir, exist_ok=True)
    doc = DOC.format(title=html.escape(title, quote=True), desc=html.escape(desc, quote=True),
                     canon=canon, css=get_base_css() + "\n" + extra_css, body=body, scripts=scripts)
    with open(os.path.join(out_dir, "index.html"), "w") as f:
        f.write(doc)

def scripts_for(body, extra=""):
    s = ""
    if "data-lead-form" in body:
        s += '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n'
    s += '<script src="/assets/site.js" defer></script>'
    if extra:
        s += "\n<script>\n" + extra + "\n</script>"
    return s

def build_generic(dc_name, vals=None, pre=None, extra_js=""):
    path = URLMAP[dc_name]
    v = base_vals()
    if vals: v.update(vals)
    tmpl = page_body(dc_name)
    tmpl = apply_hero_photo(tmpl, dc_name)
    if pre: tmpl = pre(tmpl)
    body = expand(tmpl, v)
    body, hover_css = post_process(body, path)
    title, desc = TITLES[path]
    write_page(path, title, desc, body, hover_css, scripts_for(body, extra_js))
    return path

def lead_form_attrs(source, thanks="main"):
    return f"@data-lead-form='{source}' data-thanks-key='{thanks}'"



# Hero photos: when a file exists in assets/photos/, the matching placeholder
# is replaced with the real image. Until then the hatched placeholder ships.
HERO_PHOTOS = {
    "Caring Companions Home": ("home-hero.jpg", "4 / 5",
        "A caregiver and her mother laughing together on the couch at home"),
    "Receive Care": ("receive-care-hero.jpg", "5 / 4",
        "An older gentleman relaxed and comfortable in his favorite chair at home"),
    "Service Area": ("service-area-hero.svg", "4 / 3",
        "Map of the Southwest Missouri counties Caring Companions CDS serves"),
}

def apply_hero_photo(t, dc_name):
    if dc_name not in HERO_PHOTOS:
        return t
    fname, ratio, alt = HERO_PHOTOS[dc_name]
    if not os.path.exists(os.path.join(ROOT, "assets", "photos", fname)):
        return t
    pattern = re.compile(
        r'<div style="border-radius: 6px; overflow: hidden; border: 1px solid #e0d8ca; '
        r'background: repeating-linear-gradient[^>]*aspect-ratio: ' + ratio.replace("/", r"\/") +
        r'[^>]*>.*?</div>', re.S)
    img = (f'<img src="/assets/photos/{fname}" alt="{alt}" '
           f'style="display: block; width: 100%; aspect-ratio: {ratio}; object-fit: cover; '
           f'border-radius: 6px; border: 1px solid #e0d8ca;">')
    return pattern.sub(img, t, count=1)

# page-specific source fixes: wire the training pages into the real interactive
# orientation players (which live at /attendant-orientation/ and
# /consumer-orientation/ and post completions to the CDS hub).
def pre_training_hub(t):
    # card eyebrow copy bug in the prototype
    t = t.replace(">Module 1 of 8<", ">For attendants<")
    # the consumer-orientation card links to the interactive consumer course,
    # not back to this hub page
    t = t.replace('href="Consumer Orientation.dc.html" style="text-decoration: none; background: #faf7f1',
                  'href="/consumer-orientation/" style="text-decoration: none; background: #faf7f1')
    return t


# The real course modules, mirrored from attendant-orientation/index.html (MODS)
REAL_MODULES = [
    ("Welcome and What CDS Is", "The program, and whose employee you actually are. The consumer is your employer; Caring Companions is the vendor; the state funds it.", "6 min"),
    ("Who Directs Your Work", "The consumer directs the care, and the one line nobody may cross.", "8 min"),
    ("Qualifications and Staying Eligible", "Requirements, ongoing screening, and paperwork before your first shift.", "7 min"),
    ("What You May and May Not Do", "The plan of care, who you serve, supplies, and the hard ceiling on hours.", "8 min"),
    ("Professional Expectations", "Attendance, call offs, dignity, boundaries and confidentiality.", "7 min"),
    ("Clocking In and Out", "The WellSky app, the consumer's home phone, and the EVV correction form.", "8 min"),
    ("Medicaid Fraud and Consequences", "What counts as falsification, what happens, and overpayments.", "9 min"),
    ("Reporting, Safety and Support", "Mandated reporting, emergencies, and when to speak up.", "9 min"),
]

def real_module_rows():
    rows = []
    for i, (t, d, mins) in enumerate(REAL_MODULES, 1):
        rows.append(
            '        <li class="om-split" style="border-top: 1px solid #ece5d9; padding: 30px 0; display: grid; '
            'grid-template-columns: 84px 0.85fr 1.15fr 90px; gap: 32px; align-items: start;">\n'
            f'          <span style="font-family: Newsreader, Georgia, serif; font-size: 44px; line-height: 1; color: #8a7a63;">{i:02d}</span>\n'
            f'          <h3 style="font-size: 25px; line-height: 1.22; color: #14304d;">{t}</h3>\n'
            f'          <p style="font-size: 18.5px; line-height: 1.68; color: #4c463c;">{d}</p>\n'
            f'          <span style="font-size: 16px; color: #8a8073; white-space: nowrap; text-align: right;">{mins}</span>\n'
            '        </li>')
    return "\n".join(rows)

def pre_attendant_overview(t):
    # swap the designer's guessed module list for the real course modules
    t = re.sub(r'(<ol style="margin: 48px 0 0; padding: 0; list-style: none; display: grid;">).*?(</ol>)',
               lambda m: m.group(1) + "\n" + real_module_rows() + "\n      " + m.group(2), t, flags=re.S)
    # hero: primary action starts the actual course; keep the hub link second
    t = t.replace(
        '<a href="Consumer Orientation.dc.html" style="background: #0e3860; color: #ffffff; padding: 19px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 18px;" style-hover="background: #0a2844;">All training resources</a>',
        '<a href="/attendant-orientation/" style="background: #0e3860; color: #ffffff; padding: 19px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 18px;" style-hover="background: #0a2844;">Start the orientation</a>\n          <a href="Consumer Orientation.dc.html" style="background: #ffffff; color: #0e3860; padding: 19px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 18px; border: 1.5px solid #d3cabb;" style-hover="border-color: #0e3860;">All training resources</a>')
    # completion is recorded automatically by the course itself
    t = t.replace(
        "Once you are hired, tell us you have completed it and we note it on your employee file. Nothing to print, nothing to post.",
        "When you finish, the course records your completion for us automatically, and you get a certificate page you can print or save. Once you are hired, we note the completion on your employee file.")
    # "Open the modules and start" paragraph gets the actual start link
    t = t.replace(
        "<p>The whole orientation is public. No password, no account, no waiting on us to set anything up.",
        '<p><a href="/attendant-orientation/">The whole orientation is here</a> &mdash; public, no password, no account, no waiting on us to set anything up.')
    return t

PAGE_PRE = {
    "Consumer Orientation": pre_training_hub,
    "Attendant Orientation": pre_attendant_overview,
}

# ---------------------------------------------------------------- generic pages
def build_all():
    simple = ["Caring Companions Home", "Receive Care", "Become a Caregiver",
              "How It Works", "Caregiver Pay", "Caregiver List",
              "Who Can Be The Caregiver", "Employer Setup",
              "Orienting Your Attendant", "Clocking In And Out",
              "Consumer Orientation", "Attendant Orientation",
              "Service Area", "Contact"]
    for name in simple:
        slug = URLMAP[name] or "home"
        v = {
            "onSubmit": lead_form_attrs(f"caringcds {slug}"),
            "onSwitch": lead_form_attrs(f"caringcds {slug} switch", "switch"),
        }
        build_generic(name, v, PAGE_PRE.get(name))
        print("built", name, "->", URLMAP[name] or "/")

    build_calculator()
    build_wizard()
    build_counties()
    build_404()
    build_sitemap()

# ---------------------------------------------------------------- calculator
def build_calculator():
    hours = 25
    weekly = hours * 15
    money = lambda n: "${:,.2f}".format(n)
    v = {
        "hours": hours,
        "hoursLabel": f"{hours} hours a week",
        "weekly": money(weekly),
        "monthly": money(weekly * 52 / 12),
        "yearly": money(weekly * 52),
        "onHours": "@data-calc-range",
        "onSubmit": lead_form_attrs("caringcds pay-calculator"),
        "onSwitch": lead_form_attrs("caringcds pay-calculator switch", "switch"),
    }
    def pre(tmpl):
        # tag the display spans so the script can update them
        tmpl = tmpl.replace("{{ hoursLabel }}", '<span data-calc="label">{{ hoursLabel }}</span>')
        for k in ("weekly", "monthly", "yearly"):
            tmpl = tmpl.replace("{{ %s }}" % k, '<span data-calc="%s">{{ %s }}</span>' % (k, k))
        return tmpl
    js = """(function(){
var r=document.querySelector('[data-calc-range]');if(!r)return;
var money=function(n){return '$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})};
function upd(){var h=Number(r.value)||0,w=h*15;
document.querySelector('[data-calc="label"]').textContent=h===1?'1 hour a week':h+' hours a week';
document.querySelector('[data-calc="weekly"]').textContent=money(w);
document.querySelector('[data-calc="monthly"]').textContent=money(w*52/12);
document.querySelector('[data-calc="yearly"]').textContent=money(w*52);}
r.addEventListener('input',upd);r.addEventListener('change',upd);upd();})();"""
    build_generic("Pay Calculator", v, pre, js)
    print("built Pay Calculator -> pay-calculator")

# ---------------------------------------------------------------- wizard
WIZ_QS = [
    dict(label="Question 1 of 4", key="who_needs_care",
         q="Which of these sounds like you?",
         helper="There is no wrong answer, and nothing here commits you to anything.",
         options=[("I need help at home", "For myself", "self"),
                  ("Someone in my family needs help", "A parent, grandparent or relative", "family member"),
                  ("I want to be paid to care for someone", "I am already helping, or I would like to", "wants to be the caregiver")]),
    dict(label="Question 2 of 4", key="has_medicaid",
         q="Does the person needing care have Missouri Medicaid?",
         helper="This is the one thing that really decides it. Medicaid is sometimes called MO HealthNet.",
         options=[("Yes", "Active Missouri Medicaid or MO HealthNet", "yes"),
                  ("I'm not sure", "Very common. We can check for you.", "not sure"),
                  ("No", "Not on Medicaid at the moment", "no")]),
    dict(label="Question 3 of 4", key="county",
         q="Which county is the care in?",
         helper="We work across 27 counties in Southwest Missouri.",
         options=[]),
    dict(label="Question 4 of 4", key="person",
         q="Is there someone you already have in mind?",
         helper="In this program the person receiving care chooses their own caregiver. It is often someone already helping out.",
         options=[("Yes, a family member or friend", "Not a spouse or legal guardian, they cannot be paid", "has someone in mind"),
                  ("No, I would need help finding someone", "We introduce you to someone in your county", "needs a caregiver match"),
                  ("I would be the caregiver", "I want to be paid for the care I give", "would be the caregiver")]),
]
WIZ_RESULTS = dict(
    no=("Medicaid comes first, and we can point you at it.",
        "CDS is funded by Missouri Medicaid, so enrolling in MO HealthNet is the first step. Call us and we will tell you exactly where to apply and what to have ready. It is a short conversation and there is no cost."),
    unsure=("Very likely yes, and we can check the Medicaid part for you.",
        "Not knowing your Medicaid status is the most common answer we get, and it is the easiest one for us to resolve. Give us ten minutes on the phone and we will confirm it and tell you what happens next."),
    yes=("You look eligible. Let's get it started.",
        "Active Missouri Medicaid, care at home, and a county we serve: that is the shape of an eligible CDS arrangement. The next step is a short call to confirm the details and make the referral."),
)

def build_wizard():
    src = page_body("Check My Eligibility")
    # split out the wizard <section> (the first section after </header>)
    m = re.search(r"(<section[^>]*max-width: 1000px.*?</section>)", src, re.S)
    wiz_src = m.group(1)

    qm = re.search(r'<sc-if value="\{\{ isQuestion \}\}"[^>]*>(.*?)</sc-if>\s*\n\s*<sc-if value="\{\{ isResult \}\}">(.*?)</sc-if>\s*\n\s*</section>', wiz_src, re.S)
    q_tmpl, r_tmpl = qm.group(1), qm.group(2)

    # question blocks
    q_blocks = []
    for i, q in enumerate(WIZ_QS):
        v = base_vals()
        v.update(dict(
            stepLabel=q["label"], question=q["q"], helper=q["helper"],
            isCounty=(q["key"] == "county"), canGoBack=(i > 0),
            options=[{"label": o[0], "sub": o[1],
                      "onClick": f"@data-wiz-set='{q['key']}|{o[2]}'"} for o in q["options"]],
            onCounty="@data-wiz-county", onBack="@data-wiz-back",
        ))
        blk = expand(q_tmpl, v)
        hidden = "" if i == 0 else " hidden"
        q_blocks.append(f'<div data-wiz-step="{i}"{hidden}>{blk}</div>')

    # result blocks (one per branch), each with the call-request form
    r_blocks = []
    for branch, (rt, rb) in WIZ_RESULTS.items():
        v = base_vals()
        v.update(dict(resultTitle=rt, resultBody=rb,
                      onRestart="@data-wiz-restart",
                      onSubmit=lead_form_attrs("caringcds eligibility wizard")))
        blk = expand(r_tmpl, v)
        r_blocks.append(f'<div data-wiz-result="{branch}" hidden>{blk}</div>')

    pips = "".join('<span data-wiz-pip style="flex: 1; height: 5px; border-radius: 999px; background: #e4ddd1;"></span>' for _ in range(5))
    inner = ('<div style="display: flex; gap: 8px; margin-bottom: 40px;">' + pips + "</div>\n"
             + "\n".join(q_blocks) + "\n" + "\n".join(r_blocks))
    new_section = re.sub(r">.*</section>", ">\n" + inner + "\n</section>",
                         wiz_src, count=1, flags=re.S)
    body_tmpl = src.replace(wiz_src, new_section)

    v = base_vals()
    body = expand(body_tmpl, v)
    body, hover_css = post_process(body, "check")

    js = """(function(){
var step=0,answers={};
function show(){
  document.querySelectorAll('[data-wiz-step]').forEach(function(el){el.hidden=Number(el.getAttribute('data-wiz-step'))!==step;});
  var done=step>=4;
  document.querySelectorAll('[data-wiz-result]').forEach(function(el){
    var b=answers.has_medicaid==='yes'?'yes':(answers.has_medicaid==='no'?'no':'unsure');
    el.hidden=!done||el.getAttribute('data-wiz-result')!==b;});
  document.querySelectorAll('[data-wiz-pip]').forEach(function(el,i){el.style.background=i<=step?'#0f7a7c':'#e4ddd1';});
  document.querySelectorAll('form[data-lead-form]').forEach(function(f){
    ['who_needs_care','has_medicaid','county','person'].forEach(function(k){
      var inp=f.querySelector('input[name="'+k+'"]');
      if(!inp){inp=document.createElement('input');inp.type='hidden';inp.name=k;f.appendChild(inp);}
      inp.value=answers[k]||'';});});
  window.scrollTo({top:0,behavior:'smooth'});
}
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-wiz-set]');
  if(b){var kv=b.getAttribute('data-wiz-set').split('|');answers[kv[0]]=kv[1];step++;show();return;}
  if(e.target.closest('[data-wiz-back]')){step=Math.max(0,step-1);show();return;}
  if(e.target.closest('[data-wiz-restart]')){step=0;answers={};show();return;}
});
document.addEventListener('change',function(e){
  var s=e.target.closest('[data-wiz-county]');
  if(s&&s.value){answers.county=s.value;step++;show();}
});
show();})();"""
    title, desc = TITLES["check"]
    write_page("check", title, desc, body, hover_css, scripts_for(body, js))
    print("built Check My Eligibility -> check")

# ---------------------------------------------------------------- counties
def build_counties():
    data = json.load(open(os.path.join(ROOT, "_redesign", "counties.json")))
    towns_by_county = {d["county"]: d["towns"] for d in data}
    for c in COUNTIES:
        towns = towns_by_county[c]
        slug = county_slug(c)
        v = {
            "county": c,
            "towns": towns,
            "onSubmit": lead_form_attrs(f"caringcds {slug}"),
            "onSwitch": lead_form_attrs(f"caringcds {slug} switch", "switch"),
        }
        path_save = URLMAP["Greene County"]
        URLMAP["Greene County"] = slug          # write to this county's dir
        TITLES[slug] = TITLES[slug]
        try:
            build_generic("Greene County", v)
        finally:
            URLMAP["Greene County"] = path_save
    print("built 27 county pages")

# ---------------------------------------------------------------- 404 + sitemap
def build_404():
    body = f"""
<div style="background: #f7f3ec; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; text-align: center;">
  <a href="/"><img src="/assets/logo.png" alt="Caring Companions Consumer Directed Services" style="height: 54px; width: auto;"></a>
  <h1 style="margin-top: 40px; font-size: clamp(38px, 5vw, 60px); line-height: 1.06; color: #14304d; max-width: 18ch;">That page is not here</h1>
  <p style="margin-top: 20px; font-size: 20px; line-height: 1.6; color: #4c463c; max-width: 46ch;">The address may have changed in our redesign. Everything still exists &mdash; start from the homepage, or call us and we will point you right at it.</p>
  <div style="margin-top: 34px; display: flex; flex-wrap: wrap; gap: 14px; justify-content: center;">
    <a href="/" style="background: #0e3860; color: #ffffff; padding: 19px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 18px;">Go to the homepage</a>
    <a href="tel:+14172182888" style="background: #ffffff; color: #0e3860; padding: 19px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 18px; border: 1.5px solid #d3cabb;">Call 417-218-2888</a>
  </div>
</div>"""
    doc = DOC.format(title="Page Not Found | Caring Companions CDS",
                     desc="That page is not here. Start from the homepage or call 417-218-2888.",
                     canon="/404.html", css=get_base_css(), body=body, scripts="")
    open(os.path.join(ROOT, "404.html"), "w").write(doc)
    print("built 404")

def build_sitemap():
    urls = ["/"] + ["/" + p + "/" for p in sorted(set(URLMAP.values())) if p] \
         + ["/attendant-orientation/", "/consumer-orientation/"]
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in sorted(set(urls)):
        lines.append(f"  <url><loc>https://caringcds.com{u}</loc></url>")
    lines.append("</urlset>")
    open(os.path.join(ROOT, "sitemap.xml"), "w").write("\n".join(lines) + "\n")
    print("built sitemap with", len(set(urls)), "urls")

if __name__ == "__main__":
    build_all()
