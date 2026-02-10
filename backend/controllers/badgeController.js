const factory = require("./handlerFactory");
const Badge = require("../models/badgeModel");

exports.getAllBadges = factory.getAll(Badge);
exports.createBadge = factory.createOne(Badge);
