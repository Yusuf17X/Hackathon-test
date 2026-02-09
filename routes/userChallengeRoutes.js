const exptress = require("express");
const userChallengeController = require("../controllers/userChallengeController");

const router = exptress.Router();

router
  .route("/")
  .get(userChallengeController.getAllUserChallenges)
  .post(userChallengeController.createUserChallenge);

module.exports = router;
