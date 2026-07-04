// middleware/errorMiddleware.js
// Express's centralized error handler.
// WHY centralized: instead of sending error responses inside each controller's
// catch block, all errors flow HERE through next(err). One place handles all
// error formatting, logging, and status codes.
//
// Express identifies an error handler by its 4-argument signature: (err, req, res, next).
// This MUST be registered AFTER all routes in app.js — Express only invokes
// it when next(err) is called with an error argument.

const { sendError } = require("../utils/apiResponse");

const errorMiddleware = (err, req, res, next) => {
  // Log error in development — in production you'd send to a logging service
  if (process.env.NODE_ENV === "development") {
    console.error("ERROR:", err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // --- Handle specific Mongoose/MongoDB errors ---

  // Mongoose CastError: invalid ObjectId format (e.g. /api/documents/not-a-valid-id)
  // Without this, the default message is confusing: "Cast to ObjectId failed for value..."
  if (err.name === "CastError") {
    message = `Resource not found`;
    statusCode = 404;
  }

  // Mongoose duplicate key error (e.g. email already exists, duplicate team membership)
  // MongoDB error code 11000 = unique constraint violation
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
    statusCode = 409; // 409 Conflict is the correct HTTP code for "resource already exists"
  }

  // Mongoose ValidationError: schema-level validation failed (required field missing, enum mismatch etc.)
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    statusCode = 400;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    message = "Invalid token";
    statusCode = 401;
  }
  if (err.name === "TokenExpiredError") {
    message = "Token has expired";
    statusCode = 401;
  }

  return sendError(res, message, statusCode, err);
};

module.exports = errorMiddleware;
