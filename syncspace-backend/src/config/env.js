// config/env.js
// Centralized environment variable access with validation.
// WHY: instead of doing process.env.JWT_SECRET everywhere in the codebase,
// we import from here. Two benefits:
//   1. If a required var is missing, we crash IMMEDIATELY on startup with
//      a clear error — instead of crashing mysteriously at runtime when
//      that code path is first hit.
//   2. One place to look if you need to know what env vars the app needs.

const requiredVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "INVITE_JWT_SECRET",
  "CLIENT_URL",
];

// Check all required vars are present at startup
requiredVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1); // hard crash — better to know immediately than to run in a broken state
  }
});

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  INVITE_JWT_SECRET: process.env.INVITE_JWT_SECRET,
  INVITE_JWT_EXPIRES_IN: process.env.INVITE_JWT_EXPIRES_IN || "48h",

  CLIENT_URL: process.env.CLIENT_URL,

  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  PINECONE_API_KEY: process.env.PINECONE_API_KEY || "",
  PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || "syncspace-docs",
};
