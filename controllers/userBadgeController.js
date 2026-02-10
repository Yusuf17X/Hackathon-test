const factory = require("./handlerFactory");
const UserBadge = require("../models/userBadgeModel");

exports.getAllUserBadges = factory.getAll(UserBadge);
exports.createUserBadge = factory.createOne(UserBadge);
