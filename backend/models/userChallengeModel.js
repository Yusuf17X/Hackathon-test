const mongoose = require("mongoose");

const userChallengeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [
        true,
        "A user challenge must contain a reference to the user!",
      ],
    },
    challenge_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Challenge",
      required: [
        true,
        "A user challenge must contain a reference to the challenge!",
      ],
    },
    proof_url: {
      type: String,
      required: [true, "A user challenge must contain a proof url!"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "{VALUE} is not a valid value!",
      },
      required: [true, "A user challenge must have a status!"],
    },
  },
  { timestamps: true },
);

const UserChallenge = mongoose.model("UserChallenge", userChallengeSchema);

module.exports = UserChallenge;
