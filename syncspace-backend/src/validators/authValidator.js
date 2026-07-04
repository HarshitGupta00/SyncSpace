// validators/authValidator.js
// Zod schemas for validating auth request bodies.
// WHY validate at this layer (not just in the controller):
// Controllers should handle business logic, not input sanitization.
// Keeping validation here makes controllers cleaner and schemas reusable.
//
// INTERVIEW POINT: Zod schemas can be shared between frontend (form validation)
// and backend (API validation) since both run JavaScript — one source of truth
// for "what makes a valid email/password".

const { z } = require("zod");

const signupSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name too long")
    .trim(),

  email: z
    .string()
    .email("Invalid email address")
    .toLowerCase(), // normalizes before validation

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      "Password must contain at least one letter and one number"
    ),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

// Middleware factory: takes a Zod schema, returns an Express middleware
// that validates req.body against it.
// Usage: router.post("/signup", validate(signupSchema), authController.signup)
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  // safeParse doesn't throw — it returns { success, data } or { success, error }
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }
  req.body = result.data; // replace body with parsed/normalized data
  next();
};

module.exports = { signupSchema, loginSchema, validate };
