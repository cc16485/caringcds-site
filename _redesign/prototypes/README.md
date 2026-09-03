# Handoff: Caring Companions CDS — Full Site Redesign

## Overview

A complete visual and information-architecture redesign of **caringcds.com**, the site for Caring Companions Consumer Directed Services — a Missouri CDS (Consumer Directed Services) provider in Springfield, MO. CDS lets a Medicaid participant hire their own caregiver, often a family member or friend, and Medicaid pays that caregiver.

The redesign covers **44 pages**: the homepage, the two lead-generation journeys (Receive Care / Become a Caregiver), a guided eligibility wizard, current-client resource pages, two training pages, and 27 per-county landing pages.

Goals driving the design:

- Make the two audiences (someone who needs care vs. someone who wants to be paid to give care) the first choice a visitor makes.
- Separate **lead** content from **current-client** resources, which the old site mixed together.
- Raise trust and legibility for an older, often anxious audience: large type, high contrast, no decorative noise.
- Make the phone number impossible to miss, since a call is the highest-converting action for this business.

## About the Design Files

The files in this bundle are **design references created in HTML** — prototypes that show the intended look, copy, and behavior. They are **not production code to copy directly**.

Each `.dc.html` file is a self-contained prototype built on a small internal runtime (`support.js`) that provides a template syntax (`{{ value }}` holes, `<sc-if>`, `<sc-for>`) plus a logic class. **Do not port that runtime.** Recreate these designs in the target codebase's existing environment using its established patterns:

- If the site is being rebuilt in a framework (Next.js, Astro, Eleventy, etc.), implement each page as a component/route there.
- If it stays a static site, extract the shared shell (top bar, header, footer, mobile call bar) into a layout/partial and render the pages from it.
- If no environment exists yet, a static site generator is the right choice for this content: 44 largely static pages, a handful of forms, no authenticated area. Astro or Eleventy both fit.

The 27 county pages were generated from one template and should stay that way — a single template plus a data file of county names and towns, not 27 hand-maintained files.

## Fidelity

**High-fidelity.** Colors, typography, spacing, copy, hover states, and responsive breakpoints are all final and intentional. Recreate the UI faithfully. Every hex value, font size, and spacing figure in this document is the value used in the prototypes.

Two exceptions, both deliberate:

1. **Photography is placeholder.** Hero image slots render as a hatched grey box with a monospace caption describing the intended shot. Real photography must be dropped in before launch.
2. **Forms are non-functional.** Every form submits to local state and swaps to a thank-you message. They need real endpoints (see *Forms* below).

---

## Design Tokens

### Color

| Token | Hex | Use |
|---|---|---|
| Cream (page background) | `#F7F3EC` | Default page background |
| White (raised surface) | `#FFFFFF` | Alternating sections, cards, form panels |
| Warm white (nested surface) | `#FAF7F1` | Cards *inside* a white section, testimonial cards |
| Navy (brand primary) | `#0E3860` | Buttons, links, logo lockup |
| Navy hover | `#0A2844` | Button hover; also the top bar and footer background |
| Navy display | `#14304D` | All headings; dark section backgrounds |
| Turquoise (accent, from logo) | `#50C0C0` | Accent on dark backgrounds only |
| Turquoise text | `#0F7A7C` | Eyebrow labels and accents on light backgrounds (darkened for contrast) |
| Turquoise surface | `#14807F` | Full-bleed accent CTA band background |
| Turquoise deep | `#0E6B6B` | Button text sitting on the turquoise band |
| Ink | `#2B2721` | Body text default |
| Ink secondary | `#4C463C` | Paragraph text in most sections |
| Ink tertiary | `#554F45` | Card body copy |
| Muted | `#6B6358` / `#776E61` | Supporting notes, stat captions |
| Faint | `#8A8073` | Disclaimers, form fine print |
| Numeral | `#8A7A63` | Large serif step numerals |
| Border | `#E4DDD1` | Section dividers, card borders |
| Border light | `#ECE5D9` | List row dividers, dividers inside white sections |
| Border input | `#DED5C6` | Form field borders |
| Error / negative | `#9A5A48` | "Not allowed" markers on the caregiver-rules page |

Dark-section text: `#FFFFFF` for headings, `#C6D3E0` for lede, `#D5E0EA` / `#E8EEF4` for list rows, `#A9BCCD` for footer supporting text, `rgba(255,255,255,0.16)` for dividers.

The turquoise is sampled directly from the client's logo (`#50C0C0`). It is **only** used at full strength on dark backgrounds; on cream or white it is darkened to `#0F7A7C` to hold contrast.

Rule of thumb: no more than two background colors compete on any page. Sections alternate cream → white → cream, with at most one navy section and one turquoise band per page.

### Typography

Two families, loaded from Google Fonts:

```
Newsreader — opsz 6..72, weights 400, 500, 600   (serif; all headings)
Public Sans — weights 400, 500, 600, 700         (sans; all body, UI, labels)
```

- All `h1`/`h2`/`h3` are Newsreader, `font-weight: 500`, `letter-spacing: -0.015em`.
- Everything else is Public Sans.
- `body { text-wrap: pretty; }` globally.

Type scale as used:

| Role | Size | Line height | Notes |
|---|---|---|---|
| Page h1 | `clamp(42px, 5vw, 68px)` | 1.04 | Homepage uses `clamp(44px, 5.4vw, 74px)` / 1.03 |
| Section h2 | `clamp(32px, 3.3vw, 46px)` | 1.1 | |
| Band h2 (turquoise/navy CTA) | `clamp(30px, 3.2vw, 42px)` | 1.12 | |
| Card h3 | 25–30px | 1.2–1.25 | |
| FAQ question (`summary`) | 24px | — | Newsreader |
| Hero lede | 20.5px | 1.6 | `max-width: 48ch` |
| Body paragraph | 18.5–19px | 1.65–1.68 | |
| Body in cards | 17.5–18px | 1.55–1.6 | |
| List row | 18–18.5px | 1.5–1.55 | |
| Eyebrow label | 13px | — | `letter-spacing: 0.16em; text-transform: uppercase; font-weight: 700` |
| Eyebrow (in dropdown) | 11.5–12px | — | same treatment |
| Form label | 15.5px | — | weight 600 |
| Form input | 17px | — | weight 400 |
| Fine print | 14.5–15px | 1.55 | |
| Big number (stat, pay) | 34–86px | 1 | Newsreader |
| Step numeral | 44–46px | 1 | Newsreader, color `#8A7A63` |

Minimum body size anywhere is 15px; nothing informational is below 17px. This is deliberate — the audience skews older.

### Spacing & layout

- Content container: `max-width: 1440px; margin: 0 auto; padding: 88px 48px;`
- Hero sections use `padding: 72px 48px 48px`.
- Two-column splits: `display: grid; gap: 64px` (content) or `gap: 56px` (content + form).
- Common column ratios: `1.05fr 0.95fr` (hero), `0.85fr 1.15fr` (copy + form), `0.72fr 1.28fr` (sticky aside + FAQ), `0.8fr 1.2fr` (heading + lede).
- Card grids: `gap: 22px`.
- Form field grids: `gap: 20px`.
- Numbered list rows: `grid-template-columns: 84px 0.8fr 1.2fr; gap: 32px; padding: 30–34px 0`.

**Sibling groups are laid out with flex/grid + `gap`**, never with margins on individual children or source whitespace.

### Radius, borders, shadows

- Cards and panels: `border-radius: 4px` with a `1px` border.
- Hero image slots: `border-radius: 6px`.
- Buttons: `border-radius: 999px` (fully round pill).
- Form inputs: `border-radius: 3px`, `1.5px` border.
- Dropdown panels: `border-radius: 6px`, `box-shadow: 0 18px 40px rgba(20,48,77,0.14)`.
- No shadows anywhere else. Elevation is expressed through background color, not shadow.

### Buttons

Three variants, all `border-radius: 999px`:

| Variant | Background | Text | Border | Hover |
|---|---|---|---|---|
| Primary | `#0E3860` | `#FFFFFF` | none | bg → `#0A2844` |
| Secondary (on light) | `#FFFFFF` | `#0E3860` | `1.5px solid #D3CABB` | border → `#0E3860` |
| On navy | `#FFFFFF` | `#0E3860` | none | bg → `#E9DFD1` |
| On turquoise | `#FFFFFF` | `#0E6B6B` | none | bg → `#E4F4F2` |
| Ghost on dark | transparent | `#FFFFFF` | `1.5px solid rgba(255,255,255,0.35–0.55)` | border → `#FFFFFF` |

Sizes: large `padding: 19px 32px; font-size: 18px`; medium `padding: 16–17px 26–28px; font-size: 17px`; nav CTA `padding: 13px 22px`.

### Links

`a { color: #0E3860; text-decoration-thickness: 1px; text-underline-offset: 3px; }` and `a:hover { color: #1A7F78; }` are set globally in the stylesheet so any link added later inherits brand color rather than browser blue.

---

## Global Shell

Every one of the 44 pages shares four elements, in this order. Extract them into one layout.

### 1. Utility top bar

Full-bleed `#0A2844`, text `#DFE8F1` at 15px, `padding: 10px 48px`, centered flex row with `gap: 10px`, wrapping. Contents:

> Monday to Friday, 9am to 4pm · **Call 417-218-2888** · toll free 866-863-5151

Phone numbers are `#FFFFFF`, `tel:` links, the primary one at weight 600. The `·` separators are `opacity: 0.4`.

### 2. Sticky header

`position: sticky; top: 0; z-index: 50;` with `background: rgba(247,243,236,0.93); backdrop-filter: blur(10px); border-bottom: 1px solid #E4DDD1;` and inner `padding: 14px 48px`.

Left: the logo image at `height: 46px`, linking home. Right (`margin-left: auto`): the nav.

**Desktop nav** (`.om-nav`, `display: flex; gap: 26px; font-size: 16px; font-weight: 500`), in order:

1. **Receive care ▾** — dropdown
2. **Become a caregiver ▾** — dropdown
3. **Already with us ▾** — dropdown
4. Service area
5. Contact
6. **Check my eligibility** — primary pill button

Nav links are `#453F36`, hover `#0E3860`, `white-space: nowrap; flex: none` so labels never wrap or shrink.

Dropdowns are `<details>` elements (`position: relative`) whose panel is `position: absolute; left: -14px; top: calc(100% + 14px); min-width: 290–300px`, white, `1px solid #E4DDD1`, `border-radius: 6px`, the shadow above, `padding: 12px`, `display: grid; gap: 2px`. Panel rows are `padding: 13–14px`, `font-size: 16.5–17px`, `border-radius: 4px`, hover `background: #F7F3EC; color: #0E3860`. The disclosure caret is a `▼` glyph at 11px in `#0F7A7C`. `summary` markers are hidden (`list-style: none`, `::-webkit-details-marker { display: none }`).

Dropdown contents — **this is the core IA of the redesign**:

**Receive care ▾** (leads only)
- Receive care → *(the landing page itself, weight 600, followed by a hairline divider)*
- How CDS works, start to finish
- Who can be the caregiver

**Become a caregiver ▾** (leads only)
- Become a caregiver →
- How caregivers get paid
- Caregiver pay calculator
- Join the caregiver list

**Already with us ▾** (current clients)
- **EVV correction form** → `https://hub.caringcds.com/evv-form` *(external, `target="_blank" rel="noopener"`, weight 600, first, followed by a divider)*
- *For caregivers* — Clocking in and out (EVV) · How caregivers get paid · Caregiver pay calculator · Attendant Orientation
- *For consumers* — Employer setup guide · Orienting your attendant · Who can be the caregiver · Consumer Orientation

The two subheadings inside this dropdown are 11.5px uppercase eyebrows in `#0F7A7C`.

**Mobile nav** (`.om-menu`): a "Menu" `<details>` with a three-bar hamburger glyph, styled as a secondary pill. Its panel is `position: absolute; right: 0; min-width: 290px; max-height: 78vh; overflow-y: auto`. It mirrors the desktop dropdowns as one flat scrolling list with 12px uppercase group headings in this order: **Receive care**, **Become a caregiver**, **Already with us** (with the same *For caregivers* / *For consumers* subheadings), **More** (Service area, Contact), then the Check my eligibility pill.

### 3. Footer

Full-bleed `#0A2844`, text `#C6D3E0`, inner `padding: 72px 48px 32px`, three columns `1fr 1fr 1.2fr` with `gap: 56px`:

- **Column 1** — logo on a white rounded plate (`padding: 14px 18px`), the line "Helping Missourians choose their own caregivers since 2017", then phone `417-218-2888` at 21px weight 700 in white, toll free, hours, and the address `1331 N Stewart Ave, Springfield, MO 65802`.
- **Column 2** — heading "Get started" (13px uppercase, `#50C0C0`), then a link list rendered from data: Check if you qualify · How CDS works, start to finish · Who can be the caregiver · Employer setup guide · Orienting your attendant · Clocking in and out (EVV) · **EVV correction form** *(external)* · How caregivers get paid · Caregiver pay calculator · Receive care · Become a caregiver · Join the caregiver list · Service area · Contact us.
- **Column 3** — heading "Counties we serve", then all 27 county names joined with ` · ` at 16.5px / line-height 1.9, and a link to the full service area.

Below, separated by `1px solid rgba(255,255,255,0.13)`: `© 2026 Caring Companions Consumer Directed Services, LLC. All rights reserved.` at 14.5px in `#8FA6BA`.

### 4. Sticky mobile call bar

`position: fixed; bottom: 0; left: 0; right: 0; z-index: 60`, `background: rgba(247,243,236,0.96); backdrop-filter: blur(10px); border-top: 1px solid #DDD4C5; padding: 12px 16px; gap: 10px`. Two equal-width (`flex: 1`) pills: **Call 417-218-2888** (primary) and **Am I eligible?** (secondary).

Hidden by default (`display: none`); shown only below the breakpoint. The footer takes `padding-bottom: 96px` at that width so the bar never covers footer content. *(Note: page-level `body` padding does not work here because the prototype renders inside a mount container — clearance must live on the footer.)*

### Responsive behavior

One breakpoint: **1120px**. Below it:

```
.om-split  → grid-template-columns: 1fr; gap: 40px
.om-two    → grid-template-columns: 1fr
.om-nav    → display: none
.om-menu   → display: block
.om-callbar→ display: flex
.om-sticky → position: static
.om-foot   → padding-bottom: 96px
```

Above 1120px the desktop nav shows and the hamburger and call bar are hidden. Type scales fluidly via `clamp()` rather than at breakpoints.

---

## Recurring Section Patterns

The whole site is composed from eight reusable patterns. Build these as components and most pages assemble themselves.

**A. Split hero.** Two columns (`1.05fr 0.95fr`, `align-items: end`). Left: eyebrow, then the h1 at `max-width: 13–17ch`. Right: the lede at `max-width: 48ch` plus a button row (`flex; gap: 14px; flex-wrap: wrap`). Some pages (homepage, Receive Care, Service Area) instead put a photo slot in the right column and move the buttons under the h1.

**B. Numbered editorial list.** An `<ol>` with no markers. Each row: `grid-template-columns: 84px 0.8fr 1.2fr; gap: 32px`, divider above (or below), `padding: 30–34px 0`. Column 1 is a zero-padded Newsreader numeral (`01`, `02`…) at 44–46px in `#8A7A63`; column 2 the step title at 25–27px; column 3 the explanation at 18.5px. This carries How It Works, the four consumer steps, employer setup, the pay cycle, the eight orientation topics, and the caregiver-list flow. On dark backgrounds the numeral becomes `#50C0C0` and dividers `rgba(255,255,255,0.16)`.

**C. Fact list.** A borderless `<ul>` where each row has a `1px solid #ECE5D9` top border and `padding: 17–22px 0`, with the lead phrase in `<strong style="color:#14304D">`. Used for the pay facts, the yours/ours split, EVV bullets.

**D. Two-card choice.** `grid-template-columns: 1fr 1fr; gap: 22px`. Cards are either white-on-cream or `#FAF7F1`-on-white. The homepage's audience pair inverts one card to solid navy (`#0E3860`) with white text and a `#50C0C0` eyebrow, so the caregiver path reads as the visually distinct choice.

**E. FAQ accordion.** Two columns `0.72fr 1.28fr; gap: 56px`. Left is a `position: sticky; top: 100px` aside with eyebrow, h2, and a phone prompt (or a small callout card). Right is a stack of `<details>`, each `border-bottom: 1px solid #ECE5D9; padding: 24px 0`. The `summary` is a flex row: question (Newsreader 24px, `flex: 1`) and a `+` glyph in `#0F7A7C` that rotates 45° into an `×` when open via `details[open] .om-chev { transform: rotate(45deg) }` with `transition: transform 0.18s ease`. Answers are 18px at `max-width: 62ch`.

**F. Form panel.** Two columns `0.85fr 1.15fr; gap: 56px; align-items: start`. Left: eyebrow, h2, reassurance copy, phone fallback. Right: a white card (`padding: 36px`) holding the form. Fields are `display: grid; gap: 8px` label-over-input; paired fields sit in a nested `1fr 1fr` grid with `gap: 20px`. Inputs: `padding: 15px 14px; border: 1.5px solid #DED5C6; border-radius: 3px; background: #FDFBF7; font-size: 17px`, focus `border-color: #0E3860; outline: none`. Submit is a full-width primary pill. Every form closes with fine print at 14.5px in `#8A8073` warning never to send a Social Security number.

**G. Dark stress/context band.** Full-bleed `#14304D`. Two columns: heading + lede + buttons on the left, a plain typographic list on the right with `rgba(255,255,255,0.16)` dividers. Used for the homepage's "Self-directed care will change your world", the switching block, and the caregiver-initiated-contact explainer.

**H. Turquoise closing band.** Full-bleed `#14807F`, `padding: 72px 48px`, a flex row with `justify-content: space-between`: h2 at `max-width: 24ch` in `#F2FBF9` on the left, two buttons on the right. Closes most interior pages.

---

## Pages

### Journeys (lead-facing)

**`Caring Companions Home.dc.html` — Homepage**
Hero ("Get paid to care for a loved one") with a vertical 4:5 photo slot, three stats (400+ families since 2017 · 27 counties · 4.9 on Google Reviews) on a hairline rule, then the two-card audience choice (pattern D, navy inversion). Then: the `$15.00` pay spread (86px numeral + fact list), a "Your trusted CDS provider" copy spread, the dark stress-list band, a two-card "Two ways in" eligibility/tasks pair, the FAQ accordion (8 questions), the eligibility form panel, four testimonials in a 2×2 grid of `#FAF7F1` cards, and the turquoise closing band.

**`Receive Care.dc.html`**
Hero with a 5:4 photo slot, the four-step consumer journey (pattern B), eligibility form, a "What if I don't have anyone to be my caregiver?" spread, FAQ, and the switching-provider band.

**`Become a Caregiver.dc.html`**
Hero with a `$15.00` facts card in the right column, a two-card application split — "If you already know who you would care for" vs "If you do not have anyone to care for yet" — then **the caregiver-initiated-contact band** (see *Domain rules*), FAQ with an orientation callout, and the switching band.

**`How It Works.dc.html`**
The full eight-step journey from first call to first shift as one numbered sequence on white, then an "honest timing" spread about what the state controls versus what we control.

**`Check My Eligibility.dc.html` — guided wizard**
A four-question wizard, one question per screen: *Which of these sounds like you?* → *Does the person needing care have Missouri Medicaid?* → *Which county is the care in?* (a `<select>`) → *Is there someone you already have in mind?* Progress is five pips (`#0F7A7C` filled, `#E4DDD1` empty). Options are large stacked cards, each with a label and a sub-line. A Back link is available from step 2 onward.

The Medicaid answer branches the result into one of three outcomes — **yes** ("You look eligible. Let's get it started."), **no** ("Medicaid comes first, and we can point you at it."), **unsure** — each with tailored copy and a call CTA. A Start again action resets it.

### Caregiver pages

**`Caregiver Pay.dc.html`** — The four-stage pay cycle (pay week Sun–Sat → clock in/out → weekly approval → **Thursday payday**) as a numbered list, then a six-question FAQ covering rate, direct deposit vs pay card, tax withholding and W-2, overtime, missed clock-ins, and mileage.

**`Pay Calculator.dc.html`** — A live calculator. Left: an `<input type="range" min="1" max="60" step="1">` (`accent-color: #14807F`, `height: 34px`) with the current value echoed as "N hours a week" in Newsreader at 62px. Right: a navy card showing **weekly**, **monthly** (`weekly × 52 ÷ 12`), and **yearly** (`weekly × 52`) gross at $15.00/hr, formatted `$0,000.00` via `toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`. Default 25 hours. Below: a spread explaining that authorized hours come from the state assessment, not from preference.

**`Caregiver List.dc.html`** — For caregivers who want paid work but have **no consumer yet**. Four-step explanation of how matching works, then the signup form (name, phone, email, county, hours wanted, experience level, transport, notes). Two places explicitly redirect anyone who already knows their consumer to Become a Caregiver, and note that the consumer is the one who enrolls.

### Consumer guides (current clients)

**`Who Can Be The Caregiver.dc.html`** — A two-column allowed/not-allowed layout. Left: six permitted relationships with `✓` in `#0F7A7C`. Right: four disqualifiers with `✗` in `#9A5A48`, each with an explanation — spouse, legal guardian, a POA who also directs the care, and anyone failing background screening. Closes with a candid spread on the most common disappointment (the spouse case) and what usually works instead.

**`Employer Setup.dc.html`** — Six numbered steps: why you are the employer, federal EIN, Missouri employer number, IRS Form 2678 agent appointment, attendant hiring paperwork, and the weekly routine. Then **"Your EIN numbers are yours to keep"** (see *Domain rules*), then a yours/ours responsibility split.

**`Orienting Your Attendant.dc.html`** — The eight state-required orientation topics the consumer must cover with their attendant, as a numbered list, plus practical notes on doing it even when the attendant is family.

**`Clocking In And Out.dc.html`** — EVV explained: a two-card comparison of the mobile app vs calling from the consumer's landline, then **the EVV correction form block** (see *Domain rules*), then a six-question FAQ.

### Training

**`Consumer Orientation.dc.html`** — A training/resources hub linking the orientation modules, handbook, and pay schedule.

**`Attendant Orientation.dc.html`** — The eight orientation modules listed with durations (6–10 min each, ~1 hour total) in a four-column row layout (`84px 0.85fr 1.15fr 90px`, duration right-aligned). **Explicitly public: no login, no password, no account**, watchable before being hired. Completion is noted on the employee file once hired.

### Local

**`Service Area.dc.html`** — Hero with a map photo slot, all 27 counties as a linked auto-fill multi-column list (`repeat(auto-fill, minmax(230px, 1fr))`), and an eligibility form.

**27 × `<County> County.dc.html`** — One template rendered per county. Headline "CDS in {County} County, Missouri"; a two-column body pairing the county's towns against a six-point "what you get" list; a shortened eligibility form; and a link back to the full service area. Counties served: Barry, Barton, Benton, Camden, Cedar, Christian, Dade, Dallas, Douglas, Greene, Hickory, Jasper, Laclede, Lawrence, McDonald, Newton, Ozark, Phelps, Polk, Pulaski, St. Clair, Stone, Taney, Texas, Vernon, Webster, Wright.

**Implement this as one template plus a data file.** `counties.json` in this bundle is that data file — all 27 counties with their town lists, ready to drive the template. Only `Greene County.dc.html` is included as the representative rendering; the other 26 are identical but for the county name and towns.

The town lists are a best-effort first pass and **must be reviewed by the client** before launch — they are coverage claims.

---

## Interactions & Behavior

All interaction in the design is deliberately minimal — no scroll animations, no carousels, no parallax, no modals.

| Interaction | Behavior |
|---|---|
| Nav dropdowns | Native `<details>`/`<summary>` disclosure. Click to open. Caret rotates. In a rebuild, add outside-click-to-close and `Escape`-to-close, and ensure only one is open at a time. |
| Mobile menu | Same `<details>` pattern; panel scrolls internally at `max-height: 78vh`. |
| FAQ accordions | Native `<details>`. First item on each page is open by default (a page-level flag controls this). `+` rotates 45° over 180ms. |
| Buttons & links | Color/background transitions on hover only. No transform, no shadow change. |
| Anchor navigation | `html { scroll-behavior: smooth }`. In-page CTAs target `#eligibility`, `#form`, `#start`, `#join`, `#corrections`. |
| Sticky elements | Header (`top: 0`) and FAQ asides (`top: 100px`). Asides become static below 1120px. |
| Eligibility wizard | Client-side step state. Selecting an option advances immediately; the county step advances on `change`. Back decrements. The result screen branches on the Medicaid answer. Start again resets. |
| Pay calculator | Range input drives derived weekly/monthly/yearly figures on both `input` and `change`. |
| Form submit | `preventDefault()`, then swap the form for a thank-you panel promising a callback within one business day, with the phone number for anything urgent. |
| External links | The EVV correction form opens in a new tab with `rel="noopener"`. |

### Accessibility notes

- Keyboard: `<details>`-based menus are natively focusable and toggleable. Preserve that. If you replace them with JS menus, implement `aria-expanded`, arrow-key movement, and focus return.
- Focus: inputs show `border-color: #0E3860` on focus with `outline: none`. **Add a visible focus ring for keyboard users** — the prototypes are weak here and this audience includes keyboard and screen-reader users.
- Contrast: all body and heading colors clear WCAG AA on their backgrounds. `#0F7A7C` (not `#50C0C0`) must be used for accent text on light backgrounds; `#8A7A63` (not the original lighter tan) for numerals.
- Targets: every button and nav row is at least 44px tall.
- Motion: only two transitions exist (caret rotation, color changes), both under 200ms.

---

## State Management

Per-page client state only. No global store, no routing state, no persistence.

| Page | State | Notes |
|---|---|---|
| Every page with a form | `submitted: boolean` | Toggles form ↔ thank-you |
| Pages with the switching band | `switchSent: boolean` | Independent second form |
| Pay Calculator | `hours: number` (default 25) | Derived: weekly, monthly, yearly |
| Check My Eligibility | `step: number` (0–4), `answers: {}` | Result branches on `answers.medicaid` |
| Every page | `faqFirstOpen: boolean` (default true) | Whether the first FAQ item starts open |
| Pages with photo slots | `showHeroPhoto: boolean` (default true) | Lets a page render without imagery |
| County pages | `county: string`, `towns: string` | Data-driven, not user state |

Shared data lives in each page's logic class and should become a single shared data module in the rebuild:

- `counties` — the 27 county names
- `links` — the footer link list (`{ href, label }`)
- Derived: `countyLine` (counties joined with ` · `), `countyLinks` (county → page URL)

---

## Forms

Six distinct forms, all currently non-functional. Each needs a real endpoint, server-side validation, spam protection, and a delivery destination (CRM or email).

| Form | Location | Fields |
|---|---|---|
| Eligibility check | Homepage, Receive Care, Service Area, county pages | First, last, phone*, email, who needs care*, Medicaid status*, county |
| Eligibility wizard | Check My Eligibility | who, medicaid, county, has-someone-in-mind |
| Contact | Contact | First*, last*, phone*, email, topic*, message |
| Caregiver list signup | Caregiver List | First*, last*, phone*, email, county*, hours wanted*, experience, transport, notes |
| Switch provider | Receive Care, Become a Caregiver | Name*, phone*, email |
| EVV correction | **External** — `hub.caringcds.com/evv-form` | Not in scope |

*\* = required in the prototype.*

**Compliance requirement:** this is health-adjacent PII for Medicaid participants. No form asks for a Social Security number, Medicaid ID, or bank details, and every form states this in its fine print. **Keep that constraint** and make sure submissions travel over TLS to a destination appropriate for PII. Confirm HIPAA posture with the client before wiring anything up.

---

## Domain Rules Encoded in the Copy

These are business rules the client corrected during design. They are load-bearing — do not paraphrase them away.

1. **Pay is `$15.00/hour`**, set by what the Missouri Department of Health and Senior Services funds — not by Caring Companions. If it changes, the client must be told before it takes effect.
2. **Pay week runs Sunday–Saturday; payday is the following Thursday**, by direct deposit or pay card.
3. **Spouses and legal guardians cannot be paid caregivers.** No exception, no application. Other family can.
4. **The consumer is the employer**, not Caring Companions and not the state. This is the basis for the whole self-direction pitch.
5. **The caregiver list is for caregivers seeking work who have no consumer yet** — not a directory consumers browse, and not something a consumer joins. Consumers ask to be matched; we make the introduction; the consumer still chooses.
6. **When a caregiver initiates contact, the consumer must still enroll.** The caregiver is welcome to call first and we will explain everything to them, but only the consumer can enroll in CDS or request a provider switch, and we must speak with them directly. New to CDS = Medicaid first, then state assessment. Already in CDS = a provider switch, authorization moves with them, no new assessment, care does not pause. This is the dedicated band on Become a Caregiver.
7. **The consumer's federal EIN and Missouri employer number belong to them permanently** and are not tied to Caring Companions. If they switch provider, both numbers go with them — no reapplying, no waiting on the IRS. Consumers are encouraged to keep both written down.
8. **EVV is mandatory**; corrections go through the external EVV correction form and must be submitted before the weekly approval closes.
9. **Attendant Orientation is public** — no login, no password, watchable before being hired.
10. **Service area is 27 Southwest Missouri counties**, office at 1331 N Stewart Ave, Springfield, MO 65802, hours Mon–Fri 9am–4pm.
11. **Phone numbers:** `417-218-2888` primary, `866-863-5151` toll free.

---

## Assets

**`assets/logo.png`** — the client's Caring Companions CDS logo, supplied by them. Rendered at `height: 46px` in the header and `height: 42px` on a white plate in the footer. The turquoise accent throughout the design is sampled from this file (`#50C0C0`). Use the client's original vector if they have one.

**Fonts** — Newsreader and Public Sans, both Google Fonts, loaded via `<link>` with `preconnect`. Self-host them in production for performance and privacy.

**Photography — NOT SUPPLIED.** Hero slots render as a hatched placeholder (`repeating-linear-gradient(135deg, #ECE5D9 0 9px, #F4EFE6 9px 18px)`, `1px solid #E0D8CA`, `border-radius: 6px`) with a monospace caption naming the intended shot. Three slots exist:

| Page | Slot | Aspect | Intended shot |
|---|---|---|---|
| Homepage | hero right | 4:5 | Caregiver and client at home, vertical |
| Receive Care | hero right | 5:4 | Consumer at home, landscape |
| Service Area | hero right | 4:3 | Service-area map, Southwest Missouri |

Real consented photography of actual clients and caregivers would lift this design more than any other single change. Stock is acceptable but weaker. The Service Area map should be generated from real geographic data, not drawn.

**No icon set.** The design uses two text glyphs only: `✓` (`&#10003;`) and `✗` (`&#10007;`). Don't introduce an icon library.

---

## Files in This Bundle

The 17 distinct page designs, plus `counties.json`, `support.js` (the prototype runtime — **reference only, do not port**) and `assets/logo.png`. The 26 remaining county pages are omitted as exact duplicates of `Greene County.dc.html` with different data.

**Shell and journeys**
`Caring Companions Home.dc.html` · `Receive Care.dc.html` · `Become a Caregiver.dc.html` · `How It Works.dc.html` · `Check My Eligibility.dc.html`

**Caregiver**
`Caregiver Pay.dc.html` · `Pay Calculator.dc.html` · `Caregiver List.dc.html`

**Consumer guides**
`Who Can Be The Caregiver.dc.html` · `Employer Setup.dc.html` · `Orienting Your Attendant.dc.html` · `Clocking In And Out.dc.html`

**Training**
`Consumer Orientation.dc.html` · `Attendant Orientation.dc.html`

**Local**
`Service Area.dc.html` · `Greene County.dc.html` (representative county page) · `counties.json` (all 27 counties + town lists)

**Other**
`Contact.dc.html` · `support.js` (prototype runtime, reference only) · `assets/logo.png`

Any `.dc.html` file opens directly in a browser. To read one: the markup between `<x-dc>` and `</x-dc>` is the template, and the `<script data-dc-script>` block at the bottom holds the logic class supplying the `{{ }}` values.

---

## Suggested Build Order

1. **Shell first** — top bar, sticky header with the three dropdowns, footer, mobile call bar, the 1120px breakpoint, and the design tokens. Everything else depends on it.
2. **The eight section patterns** as components.
3. **Homepage**, which exercises nearly every pattern.
4. **The two lead journeys** plus the eligibility wizard, then wire the forms to real endpoints.
5. **County template + data file**, generating all 27 routes.
6. **Guides and training pages**, which are mostly pattern B and E.
7. **Then:** real photography, self-hosted fonts, focus rings, and a client review of the 27 town lists.
