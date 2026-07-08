// routes/commentRoutes.js
const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../validators/validate");
const { addCommentSchema, updateCommentSchema } = require("../validators/commentValidator");

router.use(protect);

router.route("/")
  .get(commentController.getComments)
  .post(validate(addCommentSchema), commentController.addComment);

router.route("/:commentId")
  .patch(validate(updateCommentSchema), commentController.updateComment)
  .delete(commentController.deleteComment);

router.patch("/:commentId/resolve", commentController.resolveComment);

module.exports = router;
