const mongoose = require("mongoose");
const slugify = require("slugify");
const { trim } = require("validator");

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A title must have a name!"],
      unique: true,
      trim: true,
      minlength: [2, "Title too short!"],
      maxlength: [100, "Title too long!"],
    },
    slug: String,
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
    proof_type: {
      type: String,
      required: [true, "Challenge must have a proof type!"],
      enum: {
        values: ["photo", "report"],
        message: "{VALUE} is not a valid value!",
      },
      default: "photo",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

challengeSchema.pre("save", function () {
  this.slug = slugify(this.name, { lower: true });
});

const Challenge = mongoose.model("Challenge", challengeSchema);

module.exports = Challenge;
