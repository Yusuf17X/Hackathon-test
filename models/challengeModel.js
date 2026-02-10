const mongoose = require("mongoose");
const slugify = require("slugify");

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
    emoji: {
      type: String,
      default: "🌱",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

challengeSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

const Challenge = mongoose.model("Challenge", challengeSchema);

module.exports = Challenge;
