# mrh-solutions-website

Website for MRH Solutions: clinical AI and clinical decision support consulting.

A single-page site built with plain HTML, CSS, and JavaScript. There is no build step, no framework, and
no dependencies. Every file is served as-is, so any static host works.

## Project structure

```
.
├── index.html              # All page content (hero, services, experience, about, CTA, contact)
├── 404.html                # Self-contained "page not found" page
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/styles.css      # Design tokens at the top, then one block per section
    ├── js/main.js          # Mobile menu, active nav link, scroll reveal, contact form
    ├── fonts/              # Self-hosted Inter + Source Serif 4 (SIL Open Font License)
    └── img/                # Favicon, Apple touch icon, social share image (og-image.png)
```

## Preview locally

From the repository root:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Editing content

- **Copy:** all text lives in `index.html`. Each section starts with a comment banner such as
  `<!-- ============ Services ============ -->`.
- **Colors, fonts, spacing:** change the CSS custom properties in the `:root` block at the top of
  `assets/css/styles.css`. The brand teal is `--brand` and the dark navy is `--ink`.
- **Headshot:** the About section shows an "MH" monogram. To use a photo, add it to `assets/img/` and
  follow the comment next to the monogram in `index.html`.
- **Social share image:** `assets/img/og-image.png` (1200×630) is what LinkedIn, Slack, and others show
  when the link is shared.

## Contact form

The form has name, email, and message fields, inline validation, and a hidden spam honeypot.

**Default (no setup needed):** the form's `action` is `mailto:matt@mrhsolutions.co`. Submitting opens the
visitor's email app with the message already filled in.

**To receive submissions directly** (recommended once the site is live):

1. Create a form with a form backend such as [Formspree](https://formspree.io), or any service that accepts
   a standard HTML form POST and returns a 2xx response.
2. In `index.html`, change the form's `action` from `mailto:matt@mrhsolutions.co` to your endpoint, for example
   `action="https://formspree.io/f/abcdwxyz"`.

That is the only change. `main.js` sees an `https://` action, sends the form in the background, and shows a
success or error message without leaving the page. The honeypot field is named `_gotcha`, which Formspree
filters automatically.

## Deploying

The site is static, so deploy the repository root as-is. No build command is needed.

- **GitHub Pages:** Settings → Pages → *Deploy from a branch* → `main` / `(root)`. For the custom domain,
  enter `mrhsolutions.co` under *Custom domain* (GitHub adds a `CNAME` file) and point DNS at GitHub Pages.
- **Netlify / Cloudflare Pages / Vercel:** import the repository, leave the build command empty, and set the
  publish/output directory to the repository root (`/` or `.`).

If the site will live somewhere other than `https://mrhsolutions.co/`, update the canonical URL, the
`og:url` and `og:image` tags, and the JSON-LD block in `index.html`, plus `robots.txt` and `sitemap.xml`.

## Before launch

- [ ] Review the three case studies in the Selected Experience section and adjust wording or add metrics you can share
- [ ] Connect a form endpoint (see above), or keep the `mailto:` default
- [ ] Optional: add a headshot and a LinkedIn link
- [ ] Confirm the domain in the canonical/Open Graph tags, `robots.txt`, and `sitemap.xml`

## Accessibility and performance notes

- Semantic landmarks, a skip link, visible focus states, and labeled form fields with announced errors
- Works without JavaScript: the menu becomes a row of links and the form falls back to a plain `mailto:` submit
- Respects `prefers-reduced-motion`
- Fonts are self-hosted (about 150 KB total, Latin subset), so the page makes no third-party requests
