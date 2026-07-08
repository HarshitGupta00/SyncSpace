// routes/documentRoutes.js
const express = require("express");
const router = express.Router();
const documentController = require("../controllers/documentController");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../validators/validate");
const {
  createDocumentSchema,
  updateDocumentSchema,
  snapshotSchema,
} = require("../validators/documentValidator");

router.use(protect);

router.route("/")
  .get(documentController.getDocuments)
  .post(validate(createDocumentSchema), documentController.createDocument);

router.route("/:docId")
  .get(documentController.getDocument)
  .patch(validate(updateDocumentSchema), documentController.updateDocument)
  .delete(documentController.deleteDocument);

router.post("/:docId/snapshot", validate(snapshotSchema), documentController.saveSnapshot);
router.get("/:docId/versions",   documentController.getVersions);
router.post("/:docId/versions/:versionId/restore", documentController.restoreVersion);

module.exports = router;
