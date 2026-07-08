// validators/whiteboardValidator.js
const { z } = require("zod");

const createWhiteboardSchema = z.object({
  title: z.string().max(200, "Title too long").optional().default("Untitled Whiteboard"),
  projectId: z.string().min(1, "projectId is required"),
});

const updateWhiteboardSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  background: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Invalid hex color format")
    .optional(),
  settings: z
    .object({
      grid: z.boolean().optional(),
      snapToGrid: z.boolean().optional(),
      showCursor: z.boolean().optional(),
    })
    .optional(),
});

const whiteboardSnapshotSchema = z.object({
  yjsState: z.string().min(1, "yjsState is required"),
});

module.exports = { createWhiteboardSchema, updateWhiteboardSchema, whiteboardSnapshotSchema };
