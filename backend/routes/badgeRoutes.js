const express = require("express");
const badgeController = require("../controllers/badgeController");

const router = express.Router();

router
  .route("/")
  .get(badgeController.getAllBadges)
  .post(badgeController.createBadge);

module.exports = router;
