const express = require("express");
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

//* To change user password there is 2 steps
// 1. post to this route with only email
router.post("/forgot-password", authController.forgotPassword);
// 2. post to this route with some token and the new password
router.patch("/reset-password/:token", authController.resetPassword);

// Update password without having to forget it :)
router.patch(
  "/update-my-password",
  authController.protect,
  authController.updatePassword,
);

router.get(
  "/me",
  authController.protect,
  userController.getMe,
  userController.getProfile,
);

// Update user data
router.patch(
  "/update-me",
  authController.protect,
  userController.uploadUserPhoto,
  userController.updateMe,
);

// Delete user
router.delete("/delete-me", authController.protect, userController.deleteMe);

router.route("/").get(userController.getAllUsers);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
