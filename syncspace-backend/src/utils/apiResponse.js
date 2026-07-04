// utils/apiResponse.js
// Standardized response shape for ALL API responses.
// WHY: Consistency. Every success and error response from this API looks the
// same, so the frontend can always expect the same structure:
//   { success: true,  data: {...}, message: "..." }   <- success
//   { success: false, error: "...", message: "..." }  <- error
//
// Without this, different controllers might send different shapes
// (some send { user: {...} }, others send { data: { user: {...} } }) —
// messy for the frontend to handle.

const sendSuccess = (res, data = {}, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message = "Something went wrong", statusCode = 500, error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    // Only include raw error details in development — never leak stack traces in production
    ...(process.env.NODE_ENV === "development" && error && { error: error.toString() }),
  });
};

module.exports = { sendSuccess, sendError };
