const express = require("express");
const userChallengeController = require("../controllers/userChallengeController");
const authController = require("../controllers/authController");

const router = express.Router();

// All routes require authentication
router.use(authController.protect);

router
  .route("/")
  .get(userChallengeController.getAllUserChallenges)
  .post(
    userChallengeController.uploadChallengePhoto,
    userChallengeController.createUserChallenge,
  );

router
  .route("/:id")
  .patch(
    authController.restrictTo("admin", "teacher"),
    userChallengeController.updateUserChallengeStatus,
  );

module.exports = router;
