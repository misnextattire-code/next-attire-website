# Putting your website on GitHub + Netlify — a beginner's walkthrough

This is the same process from before, but slower, with nothing assumed. Follow it top to bottom, one step at a time. If something doesn't match what you see on your screen, stop and tell me exactly what's different — don't guess and keep going.

---

## First, what are these things?

- **Git** — a small program on your computer that keeps track of every change you make to your project files, like a very detailed "save history."
- **GitHub** — a website that stores a copy of your project online (this stored copy is called a **repository**, or "repo" for short). Think of it as Google Drive, but built specifically for code.
- **Netlify** — the hosting service that actually puts your website on the internet. We're going to tell Netlify to watch your GitHub repo, so that every time you update the repo, Netlify automatically updates your live website too.

The flow is: **your computer → GitHub → Netlify → the live website.**

---

## Step 1 — Check if Git is already installed

You need a **terminal** (also called "command line" or "command prompt") — a plain black/white window where you type commands instead of clicking things.

- **On Windows**: search for "Git Bash" in the Start menu. If it's not there, you don't have Git yet.
- **On Mac**: press `Cmd + Space`, type "Terminal", press Enter.

Once a terminal window is open, type this and press Enter:

```bash
git --version
```

- If you see something like `git version 2.43.0`, Git is already installed — skip to Step 2.
- If you see an error like "command not found," you need to install Git first: go to **https://git-scm.com/downloads**, download the version for your operating system, and install it like any other program (keep clicking "Next" with the default options). Then close and reopen your terminal, and try `git --version` again.

---

## Step 2 — Create a free GitHub account

1. Go to **https://github.com** in your browser.
2. Click **Sign up** (top right).
3. Enter an email, password, and username, and follow the on-screen steps (it will ask you to verify your email).

That's it — you now have a GitHub account.

---

## Step 3 — Tell Git who you are (one-time setup)

Still in your terminal, type these two lines, replacing the name and email with your own (use the same email as your GitHub account):

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

This just labels your future changes with your name — it's a one-time setup, you won't need to do this again.

---

## Step 4 — Open your project folder in the terminal

1. Unzip the `next-attire-website.zip` file I sent you somewhere easy to find, like your Desktop. Inside it you'll see a folder — that's the one we care about (it contains `frontend`, `backend`, `README.md`, etc.)
2. In your terminal, you need to "move into" that folder. Type `cd ` (with a space after it), then drag the folder from your file explorer/Finder directly into the terminal window — it will paste the full path automatically. Press Enter.

To check you're in the right place, type:

```bash
ls
```

(On Windows Git Bash this also works.) You should see `frontend`, `backend`, `README.md`, `netlify.toml` listed. If you see those, you're in the right folder.

---

## Step 5 — Turn this folder into a Git repository

Type each line below one at a time, pressing Enter after each:

```bash
git init
```
This tells Git "start tracking this folder." You'll see a message like "Initialized empty Git repository."

```bash
git add .
```
This tells Git "get ready to save every file in this folder" (the `.` means "everything here"). Nothing is actually saved yet — this just stages the files.

```bash
git commit -m "Next Attire website"
```
This actually saves a snapshot of all those files, with a short note ("Next Attire website") describing what this snapshot is. This is your first **commit**.

---

## Step 6 — Create an empty repository on GitHub

1. Go to **https://github.com** and make sure you're logged in.
2. Click the **+** icon in the top-right corner → **New repository**.
3. Under "Repository name," type something like `next-attire-website`.
4. Leave it set to **Public** (or choose **Private** if you don't want strangers to see the code — either works fine with Netlify).
5. **Important**: do NOT check any of the boxes for "Add a README," "Add .gitignore," or "Choose a license" — your project already has these, and checking them causes conflicts.
6. Click the green **Create repository** button.

You'll land on a page with some setup instructions and a URL that looks like:
`https://github.com/your-username/next-attire-website.git`

Keep this page open — you need that URL in the next step.

---

## Step 7 — Send your project to GitHub

Back in your terminal (still inside your project folder), type these, replacing the URL with the one from your own GitHub page:

```bash
git remote add origin https://github.com/your-username/next-attire-website.git
git branch -M main
git push -u origin main
```

- The first line tells Git "this is the online address where this project lives."
- The second line names your main line of work `main` (the standard name).
- The third line actually uploads (**pushes**) your files to GitHub.

The first time you push, it may open a browser window asking you to log in to GitHub and approve access — do that, then come back to the terminal.

When it finishes, refresh your GitHub repository page in the browser — you should now see all your project's files listed there. That means it worked.

---

## Step 8 — Connect Netlify to this GitHub repo

Since you already have a Netlify site from before (the drag-and-drop one), we're going to connect Git to that *same* site, so you keep the same website address.

1. Go to **https://app.netlify.com** and open your existing site.
2. Click **Site configuration** (in the left sidebar) → **Build & deploy**.
3. Look for a section called **Continuous deployment**, and click **Link repository** (or **Link site to Git** — the exact wording can vary slightly).
4. Choose **GitHub**. If asked, click **Authorize Netlify** so it's allowed to see your repos.
5. Find and select the `next-attire-website` repo you just created.
6. Netlify will show you build settings it detected automatically (build command `npm install`, publish directory `frontend`, functions directory `netlify/functions`) — these come from the `netlify.toml` file already in your project, so you shouldn't need to change anything. Click **Deploy** / **Save**.

---

## Step 9 — Add your email settings

Your enquiry form needs to know which email account to send from and to. In the same site on Netlify:

1. **Site configuration → Environment variables → Add a variable.**
2. Add each of these one at a time (Key on the left, Value on the right):

| Key | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` (if you're using a Gmail account to send) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | the email address you're sending from |
| `SMTP_PASS` | an "app password" for that email account (see note below) |
| `NOTIFY_TO` | `mis@nathjiagencies.in` |

**Note on `SMTP_PASS`**: if you're using Gmail, you can't use your normal Gmail password here — Google requires a special "App Password." Search "create Gmail app password" for Google's current instructions, or tell me and I'll walk you through it.

3. After adding all five, go to the **Deploys** tab → **Trigger deploy → Deploy site**, so the new settings take effect.

---

## Step 10 — Check that it worked

1. Open your website's Netlify URL in a browser — the site should load normally.
2. Add `/api/health` to the end of the URL (e.g. `https://your-site.netlify.app/api/health`) — you should see text like `{"ok":true,...}`. If you see an error page instead, the backend function isn't working — come back and tell me what you see.
3. Fill out the enquiry form on your site with a test entry and submit it. You should see a "Thanks — we'll be in touch shortly" message, and an email should arrive at the `NOTIFY_TO` address within a minute or so.

---

## From now on: how to update your site

Every time you (or I) change a file in your project, here's how to publish that change:

```bash
git add .
git commit -m "describe what you changed here"
git push
```

That's it — Netlify notices the push automatically and rebuilds your site within a minute or two. You never need to drag-and-drop files again.

---

## If something goes wrong

Copy the exact error message you see (from the terminal or from Netlify's "Deploys" tab, click the failed deploy to see its log) and send it to me — I'll tell you exactly what it means and how to fix it. Don't worry about breaking anything; every step above can be redone safely.
