const factory = require("./handlerFactory");
const Challenge = require("../models/challengeModel");

exports.getAllChallenges = factory.getAll(Challenge);
exports.getChallenge = factory.getOne(Challenge);
exports.createChallenge = factory.createOne(Challenge);
exports.updateChallenge = factory.updateOne(Challenge);
exports.deleteChallenge = factory.deleteOne(Challenge);
