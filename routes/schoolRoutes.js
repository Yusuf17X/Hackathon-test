const express = require("express");
const schoolController = require("../controllers/schoolController");

const router = express.Router();

router.get(
  "/get-top-5-schools",
  schoolController.aliasTopSchools,
  schoolController.getAllSchools,
);

router
  .route("/")
  .get(schoolController.getAllSchools)
  .post(schoolController.createSchool);

module.exports = router;
