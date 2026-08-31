# Putting your website live on GoDaddy — a beginner's walkthrough

This assumes nothing. Follow it top to bottom, one step at a time. If a button or screen doesn't look like what's described, stop and tell me exactly what you see instead of guessing — a screenshot is perfect for that.

---

## First, what are we doing?

Your GoDaddy **Web Hosting** plan comes with a control panel called **cPanel** — think of it as the dashboard where you manage everything about your hosting: uploading files, creating email accounts, turning on security certificates, and (what we need) running your Node.js backend.

We're going to:
1. Upload your website's files into your hosting account.
2. Tell cPanel to run your backend as a proper "Node.js app" (this is what makes the enquiry form actually work).
3. Turn on HTTPS (the padlock in the browser).
4. Check that everything works.

---

## Step 1 — Log in and open cPanel

1. Go to **https://www.godaddy.com** and sign in to your account (top right).
2. Go to **https://account.godaddy.com/products** (or click your name/profile picture → **My Products**).
3. Find **Web Hosting** in your list of products, and click **Manage** next to it.
4. On the page that opens, look in the top-right corner for a button called **cPanel Admin** and click it.

This opens cPanel in a new tab — a page full of icons grouped into sections like "Files," "Databases," "Domains," "Security," and so on. This is your control panel for everything from here on.

---

## Step 2 — Upload your website files

We're going to put your files in a folder **outside** the `public_html` folder (that's the one that normally holds your website — but for this Node.js setup, cPanel handles the connection for us, so the app doesn't need to live inside `public_html`).

1. In cPanel, find the **Files** section and click **File Manager**.
2. In File Manager, you'll see a list of folders on the left, starting with your home folder. Click on your home folder (the very top one — NOT `public_html`) so you're looking at what's directly inside it.
3. Click **+ Folder** (or **New Folder**) near the top toolbar, and name it: `next-attire-app`
4. Double-click to open that new `next-attire-app` folder — you should now be inside an empty folder.
5. Click **Upload** in the top toolbar. This opens an upload screen — either drag your `next-attire-website.zip` file onto it, or click to browse and select it from your computer.
6. Wait for the upload to finish (you'll see a progress bar, then a green checkmark), then go back to the File Manager tab (there's usually a link like "Go Back" at the bottom of the upload page).
7. You should now see `next-attire-website.zip` sitting inside `next-attire-app`. Right-click it and choose **Extract**.
8. It'll ask where to extract to — leave it as the current folder and confirm. After a moment, you should see new folders appear: `backend`, `frontend`, and a few files like `README.md`.

If step 8 doesn't show a `frontend` folder, something went wrong with the zip — tell me and we'll check it.

---

## Step 3 — Create the Node.js app

This is the step that makes your enquiry form actually work (not just a static page).

1. In cPanel, use the search box near the top and type **Node.js** — click on **Setup Node.js App** when it appears.
2. Click **Create Application** (usually a button, top right).
3. You'll see a form. Fill it in exactly like this:
   - **Node.js version**: pick the newest one in the list (the highest number).
   - **Application mode**: choose **Production**.
   - **Application root**: type `next-attire-app/backend`
   - **Application URL**: click the dropdown and choose your domain (e.g. `nextattire.in`). Leave the rest of that field as-is.
   - **Application startup file**: type `server.js`
4. Leave everything else as its default, and click **Create**.

You'll land on a page for your new app. **Don't close this tab** — we need it for the next two steps.

---

## Step 4 — Add your email settings

Scroll down on that same app page until you see a section called **Environment variables**. This is where we tell your site which email account to send enquiry notifications from.

Click **Add Variable** for each row below, typing the name on the left and the value on the right:

| Name (left box) | Value (right box) |
|---|---|
| `NOTIFY_TO` | `mis@nathjiagencies.in` |
| `SMTP_HOST` | `smtp.gmail.com` (if sending from a Gmail address) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | the email address you're sending from |
| `SMTP_PASS` | an "app password" for that email — see note below |
| `CORS_ORIGIN` | `https://nextattire.in,https://www.nextattire.in` |

**About `SMTP_PASS`**: if you're using Gmail, your regular Gmail password won't work here — Google requires a separate "App Password" for this kind of thing. Search "create Gmail app password" for Google's current steps, or ask me and I'll walk you through it.

Don't touch anything called `PORT` if you see it — cPanel manages that one automatically.

Click **Save** once all the rows are added.

---

## Step 5 — Install and start the app

Still on that same app page:

1. Find and click **Run NPM Install** (this downloads the small pieces of code your backend depends on — takes 20–60 seconds).
2. Once it finishes, click **Restart** (this actually starts your app running).

---

## Step 6 — Turn on HTTPS (the padlock)

1. In cPanel, search for **SSL/TLS Status** and open it.
2. Find your domain in the list, tick the checkbox next to it, and click **Run AutoSSL**.
3. Wait a few minutes — this issues a free security certificate for your domain automatically.

---

## Step 7 — Check it worked

1. Open your domain (e.g. `https://nextattire.in`) in a browser — your website should load.
2. Add `/api/health` to the end of the address (e.g. `https://nextattire.in/api/health`) — you should see plain text like `{"ok":true,...}`. If you see an error page instead, something's off with the Node.js app — tell me what the error page says.
3. Fill out the "Send us an enquiry" form on your site with a test entry and submit it. You should see "Thanks — we'll be in touch shortly," and an email should land in your `NOTIFY_TO` inbox shortly after.

---

## If your domain doesn't show the new site yet

This can happen if your domain and hosting weren't fully connected to begin with. In your GoDaddy account, go to **My Products → your domain → DNS**, and check there's an `A` record pointing to your hosting account's IP address (cPanel's home page, under **General Information**, shows this IP). If you're not sure what you're looking at here, send me a screenshot of that DNS page and I'll tell you what to change.

---

## Updating your site later

If I send you an updated version of the project:

1. Upload the new zip into `next-attire-app` the same way as Step 2, and extract it (choose "overwrite" if it asks).
2. If anything changed inside `backend/package.json`, go back to **Setup Node.js App** and click **Run NPM Install** again.
3. Click **Restart** on the app.

That's it — no need to redo Steps 3, 4, or 6, those only happen once.

---

## If something goes wrong

Copy the exact error message, or take a screenshot of the screen you're stuck on, and send it to me — I'll tell you exactly what it means and what to click next. Nothing here is destructive or hard to undo.
