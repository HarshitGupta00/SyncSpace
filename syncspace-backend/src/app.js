// app.js
// Express app configuration — middleware setup + routes mounted.
// WHY separate from server.js:
//   server.js handles "start the server" (HTTP + Socket.io + DB connection).
//   app.js handles "what the Express app does" (middleware, routes, error handling).
//   This separation makes testing easier — you can import app.js in tests
//   without actually starting an HTTP server.

require("dotenv").config(); // load .env variables FIRST, before anything else imports from config/env.js

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { CLIENT_URL, NODE_ENV } = require("./config/env");
const errorMiddleware = require("./middleware/errorMiddleware");
const { globalLimiter, authLimiter } = require("./middleware/rateLimiter");
const routes = require("./routes/index");

const app = express();

// --- Security Middleware ---

// helmet sets ~14 security-related HTTP headers automatically
// (e.g. X-Content-Type-Options, X-Frame-Options, Content-Security-Policy)
// This is a quick win for security that takes one line.
app.use(helmet());

// CORS — only allow requests from our frontend URL.
// WHY: without this, any website could make requests to our API from a browser.
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true, // allows cookies/auth headers to be sent cross-origin
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

// Rate limiting — extracted into middleware/rateLimiter.js.
// Global limiter: 100 requests per 15 minutes per IP across all /api routes.
// Auth limiter: 10 requests per 15 minutes per IP specifically on /api/auth
// (stricter because auth endpoints are the primary brute-force target).
app.use("/api/auth", authLimiter);
app.use("/api", globalLimiter);

// --- Request Parsing ---
app.use(express.json({ limit: "10mb" })); // parse JSON bodies, with size limit to prevent huge payload attacks
app.use(express.urlencoded({ extended: true }));

// --- Logging ---
// 'dev' format logs: METHOD /path STATUS response-time
// Only log in dev — in production you'd pipe to a logging service
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// --- Health Check ---
// Simple endpoint to verify the server is running — used by deployment
// platforms (Render/Railway) to check if the app is alive before routing traffic.
app.get("/health", (req, res) => {
  res.json({ success: true, message: "SyncSpace API is running" });
});

// --- API Routes ---
// All routes are mounted under /api — so /api/auth, /api/teams, etc.
// NOTE: /api/users is intentionally a separate router from /api/auth.
// /api/auth handles authentication (signup, login, session).
// /api/users handles user-facing profile lookups (e.g. viewing another
// team member's public profile in the member list).
app.use("/api", routes);

// --- 404 Handler ---
// If no route matched above, send a clean 404 instead of Express's default HTML error page
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// --- Centralized Error Handler ---
// MUST be last, after all routes and other middleware.
// Express identifies it as an error handler via the 4-argument signature.
app.use(errorMiddleware);

module.exports = app;
