const factory = require("./handlerFactory");
const UserChallenge = require("../models/userChallengeModel");

exports.getAllUserChallenges = factory.getAll(UserChallenge);
exports.createUserChallenge = factory.createOne(UserChallenge);
