// validators/documentValidator.js
const { z } = require("zod");

const createDocumentSchema = z.object({
  title: z.string().max(200, "Title too long").optional().default("Untitled Document"),
  projectId: z.string().min(1, "projectId is required"),
});

const updateDocumentSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  tags: z
    .array(z.string().max(50))
    .max(20, "Maximum 20 tags")
    .optional(),
  properties: z
    .array(
      z.object({
        key: z.string().min(1).max(100),
        value: z.string().max(500),
      })
    )
    .max(50, "Maximum 50 properties")
    .optional(),
});

const snapshotSchema = z.object({
  yjsState: z.string().min(1, "yjsState is required"),
  // Base64-encoded Yjs binary state. We validate it's a non-empty string;
  // actual binary validity is checked when Buffer.from() is called.
});

module.exports = { createDocumentSchema, updateDocumentSchema, snapshotSchema };
