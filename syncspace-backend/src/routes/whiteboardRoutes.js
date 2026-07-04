// routes/whiteboardRoutes.js
const express = require("express");
const router = express.Router();
const whiteboardController = require("../controllers/whiteboardController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .get(whiteboardController.getWhiteboards)
  .post(whiteboardController.createWhiteboard);

router.route("/:wbId")
  .get(whiteboardController.getWhiteboard)
  .patch(whiteboardController.updateWhiteboard)
  .delete(whiteboardController.deleteWhiteboard);

router.post("/:wbId/snapshot", whiteboardController.saveSnapshot);

module.exports = router;
