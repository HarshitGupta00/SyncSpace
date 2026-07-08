// validators/projectValidator.js
const { z } = require("zod");

const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name too long")
    .trim(),
  description: z.string().max(500).optional().default(""),
  teamId: z.string().optional().nullable(),
  status: z.enum(["not_started", "in_progress", "completed", "archived"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  description: z.string().max(500).optional(),
  status: z.enum(["not_started", "in_progress", "completed", "archived"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
});

module.exports = { createProjectSchema, updateProjectSchema };
