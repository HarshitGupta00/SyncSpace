// routes/aiRoutes.js
const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/index",              aiController.indexDoc);
router.post("/chat",               aiController.chat);
router.post("/summarize",          aiController.summarize);
router.delete("/index/:documentId", aiController.deleteIndex);

module.exports = router;
