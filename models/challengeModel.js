const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A challenge must have a name!"],
      unique: true,
      trim: true,
      minlength: [2, "Name too short!"],
      maxlength: [100, "Name too long!"],
    },
    description: {
      type: String,
      trim: true,
      required: [true, "A challenge must have a description!"],
    },
    points: {
      type: Number,
      default: 10,
      min: [5, "Challenge points is too low!"],
    },
    icon: {
      type: String,
      default: "🌱",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    challenge_type: {
      type: String,
      enum: {
        values: ["solo", "school_task"],
        message: "{VALUE} is not a valid challenge type!",
      },
      default: "solo",
      required: [true, "A challenge must have a type!"],
    },
  },
  {
    timestamps: true,
  },
);

const Challenge = mongoose.model("Challenge", challengeSchema);

module.exports = Challenge;
