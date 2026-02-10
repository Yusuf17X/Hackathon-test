const express = require("express");
const userBadgeController = require("../controllers/userBadgeController");

const router = express.Router();

router
  .route("/")
  .get(userBadgeController.getAllUserBadges)
  .post(userBadgeController.createUserBadge);

module.exports = router;
