// routes/projectRoutes.js
const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../validators/validate");
const { createProjectSchema, updateProjectSchema } = require("../validators/projectValidator");

router.use(protect);

router.route("/")
  .get(projectController.getProjects)
  .post(validate(createProjectSchema), projectController.createProject);

router.route("/:projectId")
  .get(projectController.getProject)
  .patch(validate(updateProjectSchema), projectController.updateProject)
  .delete(projectController.deleteProject);

// Project-level role override management
router.patch("/:projectId/members/:userId/role", projectController.setMemberProjectRole);

module.exports = router;
