const mongoose = require("mongoose");

const userBadgeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A user badge must have a user id!"],
    },
    badge_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Badge",
      required: [true, "A user badge must have a badge id!"],
    },
  },
  { timestamps: true },
);

const UserBadge = mongoose.model("UserBadge", userBadgeSchema);

module.exports = UserBadge;
