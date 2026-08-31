/**
 * Netlify serverless function that wraps the SAME Express app used by
 * server.js (backend/app.js) — no route logic is duplicated.
 *
 * netlify.toml redirects /api/* to this function, so the Express app's
 * routes ("/api/health", "/api/enquiry") keep working unchanged.
 */
const serverless = require("serverless-http");
const app = require("../../backend/app");

exports.handler = serverless(app);
