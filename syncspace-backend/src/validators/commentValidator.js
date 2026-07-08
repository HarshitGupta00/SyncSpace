// validators/commentValidator.js
const { z } = require("zod");

const addCommentSchema = z.object({
  targetId: z.string().min(1, "targetId is required"),
  targetType: z.enum(["Document", "Whiteboard"], {
    errorMap: () => ({ message: "targetType must be Document or Whiteboard" }),
  }),
  content: z
    .string()
    .min(1, "Comment content cannot be empty")
    .max(5000, "Comment too long"),
  anchor: z
    .object({
      from: z.number().int().nullable().optional(),
      to: z.number().int().nullable().optional(),
    })
    .optional(),
  mentions: z.array(z.string()).optional().default([]),
});

const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment content cannot be empty")
    .max(5000, "Comment too long"),
});

module.exports = { addCommentSchema, updateCommentSchema };
