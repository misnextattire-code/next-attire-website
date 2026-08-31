# Next Attire — Website

A responsive landing page for the Next Attire brand (built from `Next attire_Brand Vision.pdf`), split into:

```
website/
├── frontend/                static site — HTML, CSS, JS, images
│   ├── index.html
│   ├── css/style.css
│   ├── js/main.js
│   └── assets/              logo + photography
├── backend/                  Node/Express app
│   ├── app.js                the actual Express app (routes + middleware)
│   ├── server.js             thin wrapper: runs app.js as a normal server (VPS / GoDaddy / local)
│   ├── package.json
│   ├── .env.example          copy to .env and fill in
│   └── data/enquiries.json   created automatically when a form is submitted
├── netlify/functions/api.js  wraps the SAME backend/app.js as a Netlify serverless function
├── netlify.toml               Netlify build + redirect config
└── package.json                dependency manifest Netlify's build installs from
```

The backend serves the frontend as static files **and** exposes one API route, `POST /api/enquiry`, used by the "Send us an enquiry" form in the Contact section. `backend/app.js` holds all the actual logic once; `server.js` (for a normal always-on server) and `netlify/functions/api.js` (for Netlify) both just run that same app, so nothing is duplicated or can drift out of sync between the two hosting paths.

If you only need a static site (no form backend), you can skip the backend entirely and host `frontend/` on any static host — see Option A below.

---

## Run it locally

```bash
cd backend
npm install
cp .env.example .env      # edit values if you want email notifications
npm start                  # -> http://localhost:3000
```

Open `http://localhost:3000` — the backend serves `frontend/` for you, so there's nothing extra to run.

---

## Option A — Static hosting only (no backend, no enquiry form)

If you don't need the enquiry form to actually deliver anywhere, the fastest path is to drop the `frontend/` folder as-is onto any static host:

- **Netlify / Vercel / Cloudflare Pages**: drag-and-drop the `frontend` folder, or connect the repo and set the publish directory to `frontend`.
- **GitHub Pages**: push `frontend/`'s contents to a `gh-pages` branch (or the repo root) and enable Pages in the repo settings.
- **Shared cPanel hosting**: upload the contents of `frontend/` into `public_html/` via FTP/File Manager.

In this mode, remove or hide the enquiry form (or point `window.NEXT_ATTIRE_API_BASE` in `index.html` at a backend hosted elsewhere) — the "tel:" / "mailto:" buttons in the Contact section work with no backend at all.

---

## Option A2 — Netlify (frontend + backend, form fully working)

This is the easiest way to get **everything working** — static site and enquiry form — with no server to manage. The frontend deploys as static files on Netlify's CDN; the backend (`backend/app.js`) deploys as one Netlify serverless function, wired up by `netlify.toml` so `/api/enquiry` keeps working exactly like it does locally.

**Important limitation to know up front:** Netlify's functions run in short-lived containers, so writes to `backend/data/enquiries.json` are **not reliably saved** there (a fresh container can reset the file). Set the `SMTP_*` environment variables below so every enquiry is emailed to you — treat that as the real delivery method on Netlify, and the JSON file as best-effort only. (On GoDaddy/VPS — Options B/C — the JSON file works normally, since those run as one always-on process.)

### 1. Push the project to a Git repo

Netlify deploys from GitHub, GitLab, or Bitbucket. Push the whole `website/` folder (this README's folder) to a repo — GitHub is the simplest if you don't already have one:

```bash
cd website
git init
git add .
git commit -m "Next Attire website"
```

Create an empty repo on GitHub, then:

```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

### 2. Create the Netlify site

1. Go to [app.netlify.com](https://app.netlify.com) and sign in (a free account works).
2. **Add new site → Import an existing project**, and connect the repo you just pushed.
3. If `website/` is the **root** of that repo, leave "Base directory" blank. If it's a subfolder of a bigger repo, set **Base directory** to `website`.
4. Netlify should auto-detect the build settings from `netlify.toml` (build command `npm install`, publish directory `frontend`, functions directory `netlify/functions`) — confirm they match, then click **Deploy**.

### 3. Add environment variables

In the new site, go to **Site configuration → Environment variables** and add:

| Name | Value |
|---|---|
| `SMTP_HOST` | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | your sending email address |
| `SMTP_PASS` | an app password for that account |
| `NOTIFY_TO` | `mis@nathjiagencies.in` |

Then **Deploys → Trigger deploy → Deploy site** so the function picks up the new variables.

### 4. Verify

- Visit the Netlify URL (or your connected domain) — the site should load.
- Visit `<your-site>/api/health` — should return `{"ok":true,...}`.
- Submit "Send us an enquiry" — you should see "Thanks — we'll be in touch shortly," and an email should land at `NOTIFY_TO` within a few seconds.

### 5. Point your domain at it (optional)

If you want `nextattire.in` to load the Netlify site instead of (or as well as) GoDaddy: in Netlify, go to **Domain management → Add a domain**, then either change the domain's nameservers to Netlify's (Netlify will show you which ones), or add the `A`/`CNAME` records Netlify gives you inside GoDaddy's DNS management for that domain. Netlify also issues a free HTTPS certificate automatically once the domain resolves to it.

### Redeploying after changes

Push to the branch Netlify is watching (`main`, by default) — Netlify rebuilds and redeploys automatically:

```bash
git add .
git commit -m "Update site"
git push
```

---

## Option B — Full stack on your own server (VPS)

This is the recommended path if you want the enquiry form to actually save/email leads. Steps below are for a fresh **Ubuntu 22.04/24.04** VPS (DigitalOcean, AWS Lightsail, Hetzner, etc.) pointed at your domain, e.g. `nextattire.in`.

### 1. Point your domain at the server

In your domain registrar / DNS provider, create:
- `A` record: `nextattire.in` → your server's IP
- `A` record: `www.nextattire.in` → your server's IP

### 2. SSH in and update the box

```bash
ssh root@YOUR_SERVER_IP
apt update && apt upgrade -y
```

### 3. Install Node.js (LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # confirm v20.x
```

### 4. Create a deploy user (recommended over running as root)

```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### 5. Upload the project

From your own machine (not the server), from inside the `website` folder:

```bash
scp -r ./* deploy@YOUR_SERVER_IP:/home/deploy/next-attire
```

Or, if the project is in git:

```bash
git clone <your-repo-url> /home/deploy/next-attire
```

### 6. Install dependencies and configure environment

```bash
cd /home/deploy/next-attire/backend
npm install --omit=dev
cp .env.example .env
nano .env       # set PORT, CORS_ORIGIN, and SMTP_* if you want email alerts
```

Leave `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` blank if you don't need email — enquiries are always saved to `backend/data/enquiries.json` regardless.

### 7. Run the app with a process manager (PM2)

PM2 keeps the Node process alive, restarts it on crash, and restarts it on server reboot.

```bash
sudo npm install -g pm2
pm2 start server.js --name next-attire
pm2 save
pm2 startup            # run the command it prints, then:
pm2 save
```

Check it's up: `pm2 status` and `curl http://localhost:3000/api/health`.

### 8. Install and configure Nginx as a reverse proxy

Nginx sits in front of Node, handles your domain name, and (next step) TLS.

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/next-attire
```

Paste:

```nginx
server {
    listen 80;
    server_name nextattire.in www.nextattire.in;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/next-attire /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9. Open the firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 10. Add free HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d nextattire.in -d www.nextattire.in
```

Certbot edits the Nginx config to redirect HTTP → HTTPS and auto-renews the certificate. Confirm renewal works with:

```bash
sudo certbot renew --dry-run
```

### 11. Verify

Visit `https://nextattire.in` — you should see the site over HTTPS, and submitting the "Send us an enquiry" form should return "Thanks — we'll be in touch shortly."

### Redeploying after changes

```bash
cd /home/deploy/next-attire
git pull                     # or re-upload changed files
cd backend && npm install --omit=dev
pm2 restart next-attire
```

---

## Option C — GoDaddy Web Hosting (cPanel + Node.js Selector)

GoDaddy's cPanel "Web Hosting" plans (Economy/Deluxe/Ultimate/Maximum) can run this app via cPanel's built-in **Node.js Selector** ("Setup Node.js App") — no VPS/SSH needed. If your cPanel doesn't show that icon under **Software**, ask GoDaddy support to enable it (it's included on current Web Hosting plans, not on Managed WordPress).

### 1. Upload the project files

Files go **outside** `public_html`, one level up in your home directory — the Node.js Selector routes your domain to the app for you, it doesn't need to live in the web root.

1. In cPanel, open **File Manager**.
2. Go to your home directory (the folder that contains `public_html`).
3. Create a new folder, e.g. `next-attire-app`.
4. Upload `next-attire-website.zip` into it, select it, and click **Extract**. You should end up with:
   ```
   next-attire-app/
   ├── backend/
   └── frontend/
   ```
   (or use an FTP client with the credentials from cPanel → **FTP Accounts** if you prefer that over File Manager.)

### 2. Create the Node.js app

1. In cPanel, search for **Setup Node.js App** (under Software) and open it.
2. Click **Create Application** and fill in:
   - **Node.js version**: pick the newest LTS offered (GoDaddy retired Node 10–18; use 20+ / latest available).
   - **Application mode**: `Production`
   - **Application root**: `next-attire-app/backend`
   - **Application URL**: your domain, e.g. `nextattire.in` (choose it from the dropdown)
   - **Application startup file**: `server.js`
3. Click **Create**.

Leave `PORT` alone — cPanel injects it automatically and `server.js` already reads `process.env.PORT`.

### 3. Add environment variables

Still on the application's page in Setup Node.js App, scroll to **Environment variables** and add (all optional except you'll want `CORS_ORIGIN` if you ever split frontend/backend across domains):

| Name | Value |
|---|---|
| `CORS_ORIGIN` | `https://nextattire.in,https://www.nextattire.in` |
| `SMTP_HOST` | e.g. `smtp.gmail.com` (leave blank to skip email, enquiries still save to a file) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | your sending email address |
| `SMTP_PASS` | an app password for that account |
| `NOTIFY_TO` | `mis@nathjiagencies.in` |

Click **Save**.

### 4. Install dependencies and start

1. Back on the **Setup Node.js App** list, click the pencil/edit icon on your app.
2. Click **Run NPM Install** and wait for it to finish (reads `backend/package.json`).
3. Click **Restart**.

### 5. Turn on HTTPS

In cPanel, go to **Security → SSL/TLS Status**, select your domain, and click **Run AutoSSL** (GoDaddy Web Hosting includes free Let's Encrypt certificates this way). Once issued, your site is reachable at `https://nextattire.in`.

### 6. Verify

- Visit your domain — the frontend should load.
- Visit `https://nextattire.in/api/health` — should return `{"ok":true,...}`.
- Submit the "Send us an enquiry" form and confirm you see "Thanks — we'll be in touch shortly," then check **File Manager** → `next-attire-app/backend/data/enquiries.json` for the new entry (and your inbox, if SMTP is configured).

### Redeploying after changes

1. Upload the changed files over the old ones in `next-attire-app/` (File Manager or FTP).
2. If `backend/package.json` changed, run **Run NPM Install** again in Setup Node.js App.
3. Click **Restart** on the app.

### If your domain isn't pointed at this hosting yet

Check GoDaddy → **My Products** → your domain → **DNS**. If the domain was bought separately from hosting, either point its nameservers at the ones your hosting account shows, or add an `A` record for `@` and `www` pointing at your hosting account's IP (shown in cPanel's home page under **General Information**). DNS changes can take up to a few hours to propagate.

---

## Notes

- **Enquiry data**: stored as JSON in `backend/data/enquiries.json` (Options B/C — not reliable on Netlify, see Option A2). For a higher volume of leads, swap `appendEnquiry()` in `backend/app.js` for a real database (Postgres/MySQL/MongoDB) — the rest of the API stays the same on every hosting option.
- **Email alerts**: optional. Fill in `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`/`NOTIFY_TO` in `.env` (a Gmail "app password" works well) to get an email each time someone submits the form.
- **Rate limiting**: the enquiry endpoint is capped at 20 submissions per IP per 15 minutes to deter spam/abuse.
- **CORS**: only needed if you ever host the frontend on a different domain than the backend. Same-origin (the default, per this guide) needs no CORS configuration at all.
