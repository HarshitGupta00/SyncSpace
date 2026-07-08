// routes/teamRoutes.js
const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../validators/validate");
const { createTeamSchema, updateTeamSchema } = require("../validators/teamValidator");

// All team routes are protected
router.use(protect);

router.route("/")
  .get(teamController.getMyTeams)
  .post(validate(createTeamSchema), teamController.createTeam);

router.route("/:teamId")
  .get(teamController.getTeam)
  .patch(validate(updateTeamSchema), teamController.updateTeam)
  .delete(teamController.deleteTeam);

router.route("/:teamId/members/:userId")
  .patch(teamController.updateMemberRole)
  .delete(teamController.removeMember);

// Ownership transfer — separate from role update (Task 5)
router.post("/:teamId/transfer-ownership", teamController.transferOwnership);

module.exports = router;
