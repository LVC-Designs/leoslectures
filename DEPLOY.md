# Deploy leoslectures.com

Status: the site is ready. These are the steps I (Leo) need to take to point
the domain and enable deployment. Nothing in this file is run automatically —
I ask for a go-ahead before touching DNS or publishing.

## Target

**Cloudflare Pages**, project `leoslectures`, deployed from `main`.

An equivalent setup for Netlify is given at the end if you prefer.

---

## Cloudflare Pages setup

1. **Create the Pages project.** cloudflare.com → Workers & Pages → Create → Pages
   → Connect to Git → pick this repo (`ENG_ITA_Course`) → branch `main`.

2. **Build settings:**
   - **Framework preset:** None.
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/`
   - **Node version:** 20 (set `NODE_VERSION=20` in environment variables).
   - **Environment variables:** none required. All config is read from
     `site.config.json` at build time.

3. **Preview deploys.** On by default: every non-main branch deploys to
   `<branch>.leoslectures.pages.dev`. Keep that on; it's useful for review.

4. **First successful build** will host the site at
   `leoslectures.pages.dev`. Verify there before the DNS swap.

## DNS at the registrar

The domain `leoslectures.com` is registered somewhere (user to confirm — e.g.
Namecheap, Cloudflare Registrar, Porkbun, GoDaddy). Add these records at the
registrar's DNS panel:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `www` | `leoslectures.pages.dev.` | Auto / 1 h |
| ALIAS / ANAME / Flattened CNAME | `@` (apex) | `leoslectures.pages.dev.` | Auto / 1 h |

If the registrar does not support ALIAS / ANAME / CNAME flattening for the
apex (common with Namecheap, GoDaddy), transfer DNS to Cloudflare and add the
custom domain in Pages — Cloudflare's DNS lets the apex use a CNAME-like record
for free.

Then in Cloudflare Pages → Project → Custom domains → Add:
- `leoslectures.com` (apex)
- `www.leoslectures.com`

Cloudflare validates ownership automatically if DNS is at Cloudflare; otherwise
you'll see a verification record to add.

## HTTPS and redirects

- **Automatic HTTPS:** on by default via Cloudflare. Nothing to configure.
- **www → apex redirect:** in Cloudflare Pages → Project → Custom domains, mark
  the apex as the primary domain. Then add a Bulk Redirect (Rules → Redirect Rules):
  - If URL hostname = `www.leoslectures.com`, redirect to
    `https://leoslectures.com$1` with 301 (preserve path).

- **Legacy path redirects** are already in `dist/_redirects` (Netlify-format).
  Cloudflare Pages reads `_redirects` with the same syntax. These handle:
  ```
  /learn-italian/*      → /due-sponde/italiano/*     301
  /impara-inglese/*     → /due-sponde/inglese/*      301
  ```
  If anyone bookmarked the pre-launch paths from the preview deploys, they land
  on the right place.

## Analytics (optional, cookieless)

The site has no analytics by default. To enable Plausible (recommended):

1. Create a site at plausible.io for `leoslectures.com`.
2. In `site.config.json` set:
   ```json
   "analytics": {
     "script": "https://plausible.io/js/script.js",
     "domain": "leoslectures.com",
     "attributes": ""
   }
   ```
3. Push to main. The analytics script is injected into every page's `<head>`
   automatically. No cookies, no banner required.

For Umami, use its hosted script URL instead, with `attributes` set to
`data-website-id="…"`.

## After launch

- Confirm `https://leoslectures.com/` loads the hub.
- Confirm `https://leoslectures.com/due-sponde/italiano/` and
  `https://leoslectures.com/due-sponde/inglese/` load the two tracks.
- Confirm the legacy redirects return 301 to the new paths.
- Confirm the sitemap at `/sitemap.xml` and robots at `/robots.txt` are served.
- Open `/about`, `/privacy`, `/provenance`, and a bogus URL to see the 404.
- Share one page on social to verify OG preview; the OG image comes from
  `assets/og/due-sponde.svg` by default (replace with a 1200×630 PNG if any
  platform rejects SVG).

## Netlify alternative (if Cloudflare Pages isn't preferred)

1. netlify.com → Add new site → Import from Git → pick this repo.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Node version: 20 (`NODE_VERSION=20` in Environment variables).
5. Custom domain: add `leoslectures.com` and `www.leoslectures.com`; follow
   the registrar DNS instructions Netlify shows.
6. `_redirects` is honoured out of the box.

---

**Before I touch DNS:** ask Leo for the go-ahead. The site works locally and
on the Pages preview URL today; the switch to the custom domain is the only
step I'm pausing on.
