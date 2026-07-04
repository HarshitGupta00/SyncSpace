// utils/asyncHandler.js
// A wrapper for async controller functions.
// WHY: Without this, every async controller needs its own try/catch block:
//
//   exports.getUser = async (req, res) => {
//     try { ... } catch(err) { next(err) }   <- repeated EVERYWHERE
//   }
//
// With asyncHandler, you wrap once and errors automatically flow to the
// centralized error middleware via next(err):
//
//   exports.getUser = asyncHandler(async (req, res) => { ... })
//
// This is a very common Express pattern — knowing WHY it exists is a
// strong interview signal.

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
  // If fn throws or returns a rejected promise, .catch(next) passes the
  // error to Express's next() — which triggers the error middleware.
};

module.exports = asyncHandler;
