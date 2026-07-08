// validators/teamValidator.js
const { z } = require("zod");

const createTeamSchema = z.object({
  name: z
    .string()
    .min(2, "Team name must be at least 2 characters")
    .max(50, "Team name too long")
    .trim(),
  description: z.string().max(500, "Description too long").optional().default(""),
});

const updateTeamSchema = z.object({
  name: z.string().min(2).max(50).trim().optional(),
  description: z.string().max(500).optional(),
  logo: z.string().optional(),
});

const inviteEmailsSchema = z.object({
  teamId: z.string().min(1, "teamId is required"),
  emails: z
    .array(z.string().email("Invalid email address").toLowerCase())
    .min(1, "At least one email is required")
    .max(20, "Maximum 20 invites at once"),
  role: z.enum(["admin", "member"]).optional().default("member"),
});

module.exports = { createTeamSchema, updateTeamSchema, inviteEmailsSchema };
