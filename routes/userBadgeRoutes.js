const exptess = require("express");
const userBadgeController = require("../controllers/userBadgeController");

const router = exptess.Router();

router
  .route("/")
  .get(userBadgeController.getAllUserBadges)
  .post(userBadgeController.createUserBadge);

module.exports = router;
