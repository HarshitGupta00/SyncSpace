// routes/teamRoutes.js
const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const { protect } = require("../middleware/authMiddleware");

// All team routes are protected
router.use(protect);

router.route("/")
  .get(teamController.getMyTeams)
  .post(teamController.createTeam);

router.route("/:teamId")
  .get(teamController.getTeam)
  .patch(teamController.updateTeam)
  .delete(teamController.deleteTeam);

router.route("/:teamId/members/:userId")
  .patch(teamController.updateMemberRole)
  .delete(teamController.removeMember);

module.exports = router;
