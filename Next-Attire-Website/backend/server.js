/**
 * NEXT ATTIRE — backend entry point (normal long-running server)
 * -----------------------------------------------------------
 * Use this to run the app locally, on a VPS, or on GoDaddy's cPanel
 * "Setup Node.js App" (Node.js Selector) — see README.md.
 *
 * The actual Express app (routes + middleware) lives in app.js so the
 * exact same code can also run as a Netlify serverless function
 * (see netlify/functions/api.js) without duplicating any logic.
 * -----------------------------------------------------------
 */

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Next Attire server running on http://localhost:${PORT}`);
});
