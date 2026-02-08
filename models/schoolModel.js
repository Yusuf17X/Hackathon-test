const mongoose = require("mongoose");
const User = require("./userModel");
const slugify = require("slugify");

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A movie must have a name!"],
      unique: true,
      trim: true,
      minlength: [2, "Name too short!"],
      maxlength: [100, "Name too long!"],
    },
    slug: String,
    city: {
      type: String,
      required: [true, "The city of the school is required!"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

schoolSchema.virtual("total_points").get(async function () {
  const result = await User.aggregate([
    { $match: { school_id: this.id } },
    { $group: { _id: null, totalScore: { $sum: "$points" } } },
  ]);

  return result.length > 0 ? result[0].totalScore : 0;
});

schoolSchema.pre("save", function () {
  this.slug = slugify(this.name, { lower: true });
});

const School = mongoose.model("School", schoolSchema);

module.exports = School;
