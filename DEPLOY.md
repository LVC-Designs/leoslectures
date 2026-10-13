# Deploy leoslecture.com

Target: **Railway** from a **GitHub** repo, custom domain **www.leoslecture.com**.

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

## 3 · Point leoslecture.com at Railway (Hostinger)

Your registrar is **Hostinger**. Both domains are already registered on the
Railway side; Railway is just waiting for DNS. Do this in Hostinger **hPanel →
Domains → leoslecture.com → DNS / Nameservers**.

**The main record — `www` (edit, don't add):** Hostinger's parking zone already
has a `www` CNAME pointing at the bare domain. Edit that existing record:

| Type  | Name  | Points to                   | TTL  |
|-------|-------|-----------------------------|------|
| CNAME | `www` | `ue7oudcg.up.railway.app`   | Auto |

Save. Within 1–5 minutes Railway's row for `www.leoslecture.com` turns green and
HTTPS is issued automatically (Let's Encrypt). **https://www.leoslecture.com is
live.** This one record is enough for the canonical URL.

**The apex — `leoslecture.com` (no www), so the bare name also works:**

| Type  | Name | Points to                   | TTL  |
|-------|------|-----------------------------|------|
| CNAME | `@`  | `qb0dp5xp.up.railway.app`   | Auto |

If hPanel refuses a CNAME on `@` (some zones do), fall back to a redirect
instead: hPanel → Domains → leoslecture.com → **Redirects** → from
`leoslecture.com` to `https://www.leoslecture.com`, permanent (301). Either way
the bare name lands on the site.

**Optional ownership-verification TXT records.** Railway normally verifies via
the CNAME alone. Only if the Railway custom-domain row stays on
"validating ownership" after the CNAME has propagated, add:

| Type | Name                  | Value |
|------|-----------------------|-------|
| TXT  | `_railway-verify.www` | `railway-verify=d2ed5c15cb9eff9b2e443ba7f8171563b1406690c617d15f4b15dcd34da0250e` |
| TXT  | `_railway-verify`     | `railway-verify=678b4dd998552af3225c0be26d8b4854221eeedde89e502289ddb36ef27cb803` |

**Check propagation** from any machine:

```bash
dig @1.1.1.1 +short CNAME www.leoslecture.com   # → ue7oudcg.up.railway.app
curl -sI https://www.leoslecture.com/ | head -1  # → HTTP/2 200
```

Then in Railway: `railway domain status www.leoslecture.com` → `verified: true`,
certificate `ISSUED`.

## 4 · Analytics (optional)

Still off by default. To turn on Plausible:

```jsonc
// site.config.json
"analytics": {
  "script": "https://plausible.io/js/script.js",
  "domain": "www.leoslecture.com",
  "attributes": ""
}
```

Commit and push → Railway auto-redeploys.

For Umami: set `script` to its hosted URL and `attributes` to
`data-website-id="…"`.

## 5 · After launch · sanity checks

```
https://www.leoslecture.com/                         → hub
https://www.leoslecture.com/due-sponde/              → course landing (two tracks)
https://www.leoslecture.com/due-sponde/italiano/     → Italian for English speakers
https://www.leoslecture.com/due-sponde/inglese/      → English for Italian speakers
https://www.leoslecture.com/about                    → About (bilingual)
https://www.leoslecture.com/privacy                  → Privacy (bilingual)
https://www.leoslecture.com/provenance.html          → PROVENANCE.md rendered
https://www.leoslecture.com/sitemap.xml              → full sitemap
https://www.leoslecture.com/robots.txt               → allows all
https://www.leoslecture.com/learn-italian/           → 301 → /due-sponde/italiano/
https://www.leoslecture.com/does-not-exist           → 404 page in both languages
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
