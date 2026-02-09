const mongoose = require("mongoose");
const slugify = require("slugify");

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
