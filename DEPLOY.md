# Deploy leoslectures.com

Target: **Railway** from a **GitHub** repo, custom domain **www.leoslectures.com**.

Everything in `site.config.json` (KOFI_URL, FEEDBACK_EMAIL, analytics) and in
`site.json` (`url`, slugs) is already set. The runtime server is `build/prod-server.mjs`
with zero dependencies: it serves `dist/`, honours `_redirects`, and falls back
to `/404.html`.

---

## 1 · Push to GitHub

The repo currently has no remote. Create a GitHub repo at
<https://github.com/new> (I'll assume the account is `leochimienti` and the repo
name is `leoslectures`; adjust the URL if different), then:

```bash
cd "/home/vito/LVC DESIGNS/Projects/ENG_ITA_Course"

# Rename master → main (GitHub's default)
git branch -M main

# Point at the new empty GitHub repo (replace with the real URL)
git remote add origin git@github.com:leochimienti/leoslectures.git
# …or if you prefer HTTPS:
# git remote add origin https://github.com/leochimienti/leoslectures.git

# Push and set upstream
git push -u origin main
```

Verify at `https://github.com/<you>/leoslectures` that main shows the full
history and `README.md` renders.

## 2 · Deploy to Railway

1. **Sign in** at <https://railway.app> and click **New Project**.
2. **Deploy from GitHub repo** → authorise Railway → pick `leoslectures`.
3. Railway auto-detects Node from `package.json` + `.nvmrc` (20) and reads
   `railway.toml`:
   - **Build:** `npm run build` (generates `dist/`).
   - **Start:** `npm start` (serves `dist/` on `$PORT`).
   - **Health check:** `GET /`.
4. First deploy takes 1–2 minutes. When it's green, Railway assigns a URL like
   `leoslectures-production.up.railway.app`. Open it; the hub should load.
5. If anything is red: Deployments → Logs. The most common issue is a missing
   `PORT`; the server defaults to 8080 but Railway sets `PORT` automatically, so
   nothing to configure.

## 3 · Point www.leoslectures.com at Railway

1. **In Railway** → Project → your service → Settings → Networking →
   **Custom Domains** → `+ Add Custom Domain` → `www.leoslectures.com`.
2. Railway shows you a target like `leoslectures-production.up.railway.app`
   (or sometimes a specific CNAME value). Copy it.
3. **At your DNS registrar** (wherever you bought `leoslectures.com`), open
   the DNS settings for `leoslectures.com` and add:

   | Type   | Name  | Value                                   | TTL   |
   |--------|-------|-----------------------------------------|-------|
   | CNAME  | `www` | `leoslectures-production.up.railway.app` | Auto / 1 h |

4. Save. Propagation is usually 1–5 minutes (TTL may lengthen it to an hour).
5. Back in Railway, the custom domain row flips to green and HTTPS is issued
   automatically via Let's Encrypt. **www.leoslectures.com is live.**

### Apex (leoslectures.com without www) — optional

If you also want the bare `leoslectures.com` to resolve, pick one of these:

- **Easiest, no second record:** at your registrar, set up a **URL Redirect**
  from `leoslectures.com` → `https://www.leoslectures.com` (most registrars
  support this; Namecheap and Porkbun both do). Permanent (301).
- **Via Railway custom domain:** add `leoslectures.com` as a second custom
  domain in Railway, then add an **ALIAS / ANAME record** at the apex pointing
  to the Railway target. Some registrars don't support ALIAS/ANAME for the
  apex; in that case transfer DNS to Cloudflare and use their flattened CNAME.
- **Via Cloudflare in front:** set Cloudflare as the nameserver, add a CNAME
  at the apex (Cloudflare flattens it), proxy ON. Cloudflare also lets you add
  a page rule `leoslectures.com/*` → 301 to `https://www.leoslectures.com/$1`.

Since the primary URL you want is **www**, step 3 is enough on its own.

## 4 · Analytics (optional)

Still off by default. To turn on Plausible:

```jsonc
// site.config.json
"analytics": {
  "script": "https://plausible.io/js/script.js",
  "domain": "www.leoslectures.com",
  "attributes": ""
}
```

Commit and push → Railway auto-redeploys.

For Umami: set `script` to its hosted URL and `attributes` to
`data-website-id="…"`.

## 5 · After launch · sanity checks

```
https://www.leoslectures.com/                         → hub
https://www.leoslectures.com/due-sponde/              → course landing (two tracks)
https://www.leoslectures.com/due-sponde/italiano/     → Italian for English speakers
https://www.leoslectures.com/due-sponde/inglese/      → English for Italian speakers
https://www.leoslectures.com/about                    → About (bilingual)
https://www.leoslectures.com/privacy                  → Privacy (bilingual)
https://www.leoslectures.com/provenance.html          → PROVENANCE.md rendered
https://www.leoslectures.com/sitemap.xml              → full sitemap
https://www.leoslectures.com/robots.txt               → allows all
https://www.leoslectures.com/learn-italian/           → 301 → /due-sponde/italiano/
https://www.leoslectures.com/does-not-exist           → 404 page in both languages
```

Open a unit → click **Report a mistake**. The email `leo@lvcdesigns.com`
reveals with a **Copy** button, and your mail client is also launched if one
is registered.

## 6 · Updating the site

Push to `main`:

```bash
git add -A
git commit -m "…"
git push
```

Railway auto-deploys on push (default). Preview deploys on other branches are
on by default too.

---

**Rollback:** Railway → Deployments → pick an earlier green deploy → **Redeploy**.

**Logs:** Railway → Deployments → the latest → **View Logs**. The server prints
`loaded N redirect rule(s)` on start, so you can confirm the redirects loaded.
