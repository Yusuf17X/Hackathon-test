const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A badge must have a name!"],
  },
  icon: {
    type: String,
    required: [true, "A badge must have an icon!"],
  },
  requirement_type: {
    type: String,
    required: [true, "A badge must have a requirement!"],
    enum: {
      values: ["challenges_count", "points_threshold"],
    },
  },
  requirement_value: {
    type: Number,
    required: [true, "A badge must have a points threshold!"],
  },
});

const Badge = mongoose.model("Badge", badgeSchema);

module.exports = Badge;
