// routes/whiteboardRoutes.js
const express = require("express");
const router = express.Router();
const whiteboardController = require("../controllers/whiteboardController");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../validators/validate");
const {
  createWhiteboardSchema,
  updateWhiteboardSchema,
  whiteboardSnapshotSchema,
} = require("../validators/whiteboardValidator");

router.use(protect);

router.route("/")
  .get(whiteboardController.getWhiteboards)
  .post(validate(createWhiteboardSchema), whiteboardController.createWhiteboard);

router.route("/:wbId")
  .get(whiteboardController.getWhiteboard)
  .patch(validate(updateWhiteboardSchema), whiteboardController.updateWhiteboard)
  .delete(whiteboardController.deleteWhiteboard);

router.post("/:wbId/snapshot", validate(whiteboardSnapshotSchema), whiteboardController.saveSnapshot);

module.exports = router;
