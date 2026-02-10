const mongoose = require("mongoose");
const slugify = require("slugify");

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A school must have a name!"],
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

schoolSchema.pre("save", function () {
  this.slug = slugify(this.name, { lower: true });
});

const School = mongoose.model("School", schoolSchema);

module.exports = School;
