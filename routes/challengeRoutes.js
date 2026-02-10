const express = require("express");
const challengeController = require("../controllers/challengeController");
const authController = require("../controllers/authController");

const router = express.Router();

// Protected route - get available challenges for authenticated user
router.get(
  "/available",
  authController.protect,
  challengeController.getAvailableChallenges
);

router
  .route("/")
  .get(challengeController.getAllChallenges)
  .post(challengeController.createChallenge);

router
  .route("/:id")
  .get(challengeController.getChallenge)
  .patch(challengeController.updateChallenge)
  .delete(challengeController.deleteChallenge);

module.exports = router;
