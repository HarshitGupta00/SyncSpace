// validators/validate.js
// Reusable validation middleware factory for Zod schemas.
// Extracted from authValidator.js so all validator files can import it
// without importing auth-specific schemas.
//
// Usage: router.post("/", validate(createTeamSchema), teamController.createTeam)

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

module.exports = { validate };
