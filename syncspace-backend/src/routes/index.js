// routes/index.js
// Central router — mounts all sub-routers onto /api.
// WHY a separate index instead of mounting in app.js:
// As the app grows, app.js stays clean. Adding a new resource = add one line here.

const express = require("express");
const router = express.Router();

// Routes will be imported and mounted here as they are built.
// Placeholder imports — uncomment as each route file is created:

const authRoutes         = require("./authRoutes");
const teamRoutes         = require("./teamRoutes");
const projectRoutes      = require("./projectRoutes");
const documentRoutes     = require("./documentRoutes");
const whiteboardRoutes   = require("./whiteboardRoutes");
const inviteRoutes       = require("./inviteRoutes");
const commentRoutes      = require("./commentRoutes");
const notificationRoutes = require("./notificationRoutes");
const aiRoutes           = require("./aiRoutes");
const userRoutes         = require("./userRoutes");

router.use("/auth",          authRoutes);
router.use("/teams",         teamRoutes);
router.use("/projects",      projectRoutes);
router.use("/documents",     documentRoutes);
router.use("/whiteboards",   whiteboardRoutes);
router.use("/invites",       inviteRoutes);
router.use("/comments",      commentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/ai",            aiRoutes);
router.use("/users",         userRoutes);

module.exports = router;
