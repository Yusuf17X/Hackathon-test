const express = require("express");
const schoolController = require("../controllers/schoolController");
const authController = require("../controllers/authController");

const router = express.Router();

router.get(
  "/get-top-5-schools",
  schoolController.aliasTopSchools,
  schoolController.getAllSchools,
);

// School leaderboard route
router.get(
  "/leaderboard",
  authController.protect,
  schoolController.getSchoolsLeaderboard,
);

// School eco-stats route - public, no authentication
router.get('/:id/eco-stats', schoolController.getSchoolEcoStats);

router
  .route("/")
  .get(schoolController.getAllSchools)
  .post(schoolController.createSchool);

module.exports = router;
