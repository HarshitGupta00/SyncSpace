// routes/commentRoutes.js
const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .get(commentController.getComments)
  .post(commentController.addComment);

router.route("/:commentId")
  .patch(commentController.updateComment)
  .delete(commentController.deleteComment);

router.patch("/:commentId/resolve", commentController.resolveComment);

module.exports = router;
