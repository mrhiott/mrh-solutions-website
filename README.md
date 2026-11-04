# mrh-solutions-website

Website for MRH Solutions: clinical AI and clinical decision support consulting.

A single-page site built with plain HTML, CSS, and JavaScript. There is no build step, no framework, and
no dependencies. Every file is served as-is, so any static host works.

## Project structure

```
.
├── index.html              # All page content: hero, services, approach, experience, about, CTA, contact
├── 404.html                # Self-contained "page not found" page
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/styles.css      # Design tokens at the top, then one numbered block per section
    ├── js/main.js          # Menu, header state, scroll reveals, micro-interactions, contact form
    ├── fonts/              # Self-hosted Newsreader + Instrument Sans (SIL Open Font License)
    └── img/                # Favicon, Apple touch icon, social share image (og-image.jpg)
```

## Preview locally

From the repository root:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Design system

Everything visual is driven by the custom properties in the `:root` block at the top of
`assets/css/styles.css`.

- **Type:** Newsreader (an editorial serif) for headlines and statements; Instrument Sans for body copy and
  interface text. Both are self-hosted as Latin subsets (about 150 KB total), so the page makes no
  third-party requests.
- **Color:** deep spruce (`--ink`, `--dark`), warm ivory (`--paper`, `--card`), and burnished copper
  (`--accent`, plus `--dark-accent` on dark surfaces), with a sage tint for outcomes. Text colors meet WCAG AA
  contrast on the surfaces they're used on.
- **Layout:** a 12-column grid. Section labels ("01 — Services") sit in the left three columns and headings
  start at column four, which gives every section the same alignment.

## Editing content

- **Copy:** all text lives in `index.html`. Each section starts with a comment banner such as
  `<!-- ============ Services ============ -->`.
- **Headshot:** the About section shows an "MH" monogram. To use a photo, add it to `assets/img/` and
  follow the comment next to the monogram in `index.html`.
- **Social share image:** `assets/img/og-image.jpg` (1200×630) is what LinkedIn, Slack, and others show
  when the link is shared.

## Contact form

The form has name, email, company (optional), and message fields, inline validation, a message box that
grows as you type, and a hidden spam honeypot (`_gotcha`, which Formspree filters automatically).

Submissions go to **Formspree** (form ID `xzeeogav`), set as the form's `action` in `index.html`:

- With JavaScript, `main.js` sends the form in the background and swaps it for a "Message sent"
  confirmation. If Formspree rejects a field, the message appears under that field; any other failure shows
  an inline error with the email address as a fallback.
- Without JavaScript, the browser posts straight to Formspree, which shows its own thank-you page.
- The email subject reads "New inquiry from {name} ({company}) via mrhsolutions.co", and replying goes to
  the sender's address.

Manage notification settings, spam filtering, and allowed domains in the Formspree dashboard. To switch
services, replace the `action` URL; setting it to `mailto:you@example.com` makes the form open the
visitor's email app instead.

## Motion and interaction

- The hero headline rises in line by line, and the illustration plays out like a live recommendation:
  patient context, then the alert, then the guideline lifecycle ticking through its steps.
- Sections fade up as they scroll into view; items that arrive together are staggered automatically.
- The Approach timeline draws itself and lights each step in turn.
- Buttons, links, service rows, and case studies have subtle hover states. On mouse and trackpad devices
  the hero illustration shifts slightly with the pointer, and a soft spotlight follows it across the
  call-to-action panel.
- A thin progress bar under the header tracks reading position.

All of it is skipped for visitors who set "reduce motion", and none of it is required: without JavaScript the
page is fully readable, the menu becomes a row of links, and the form falls back to a plain `mailto:` submit.

## Deploying

The site is static, so deploy the repository root as-is. No build command is needed.

- **GitHub Pages:** Settings → Pages → *Deploy from a branch* → `main` / `(root)`. For the custom domain,
  enter `mrhsolutions.co` under *Custom domain* (GitHub adds a `CNAME` file) and point DNS at GitHub Pages.
- **Netlify / Cloudflare Pages / Vercel:** import the repository, leave the build command empty, and set the
  publish/output directory to the repository root (`/` or `.`).

If the site will live somewhere other than `https://mrhsolutions.co/`, update the canonical URL, the
`og:url` and `og:image` tags, and the JSON-LD block in `index.html`, plus `robots.txt` and `sitemap.xml`.

The markup has no inline `style` attributes or inline event handlers, so a strict Content-Security-Policy is
straightforward; the one small inline script in `<head>` (which sets the `js` and `motion` classes before
first paint) needs a hash or nonce.

## Before launch

- [ ] Review the three case studies and the Approach steps, and adjust wording or add metrics you can share
- [ ] Optional: add a headshot and a LinkedIn link
- [ ] Confirm the domain in the canonical/Open Graph tags, `robots.txt`, and `sitemap.xml`

## Accessibility notes

- Semantic landmarks, a skip link, visible focus states, labeled form fields with announced errors
- The full-screen menu moves focus into itself, makes the page behind it inert, and closes with Escape
- Decorative illustration is hidden from assistive technology
- Respects `prefers-reduced-motion`
