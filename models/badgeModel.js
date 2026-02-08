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
  requirement: {
    type: String,
    required: [true, "A badge must have a requirement!"],
  },
  points_threshold: {
    type: Number,
    required: [true, "A badge must have a points threshold!"],
  },
});

const Badge = mongoose.model("Badge", badgeSchema);

module.exports = Badge;
